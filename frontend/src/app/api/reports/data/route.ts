import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReportFilters {
  courseId?: string;
  chapterId?: string;
  assignmentId?: string;
  studentId?: string;
  status?: string; // 'submitted' | 'late' | 'missing' | 'all'
  dateRange?: string; // 'all' | 'last7' | 'last30' | 'last90'
  reportType?: string; // 'performance' | 'assignment' | 'weak_students' | 'integrity' | 'coverage'
}

/**
 * POST /api/reports/data
 * Fetches report data based on filters and report type
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.TEACHER]);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const filters: ReportFilters = await req.json();

    // Get teacher's courses
    const teacherCourses = await prisma.course.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { teacherAssignments: { some: { teacherId: userId } } }
        ]
      },
      select: { id: true }
    });

    const courseIds = teacherCourses.map(c => c.id);
    if (courseIds.length === 0) {
      return NextResponse.json({ data: [], summary: getEmptySummary() });
    }

    // Build where clause for student attempts
    const whereClause: any = {
      assignment: {
        courseId: filters.courseId || { in: courseIds }
      }
    };

    if (filters.chapterId) {
      whereClause.assignment.chapterId = filters.chapterId;
    }

    if (filters.assignmentId) {
      whereClause.assignmentId = filters.assignmentId;
    }

    if (filters.studentId) {
      whereClause.studentId = filters.studentId;
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const daysAgo = filters.dateRange === 'last7' ? 7 : filters.dateRange === 'last30' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      whereClause.submittedAt = { gte: startDate };
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'submitted') {
        whereClause.submittedAt = { not: null };
        whereClause.assignment = { ...whereClause.assignment, dueDate: { gte: whereClause.submittedAt } };
      } else if (filters.status === 'late') {
        whereClause.submittedAt = { not: null };
        // Will filter in code since we need to compare submittedAt with dueDate
      } else if (filters.status === 'missing') {
        whereClause.submittedAt = null;
      }
    }

    // Fetch data based on report type
    const reportType = filters.reportType || 'performance';

    if (reportType === 'integrity') {
      return await getIntegrityReport(whereClause);
    } else if (reportType === 'weak_students') {
      return await getWeakStudentsReport(filters, courseIds);
    } else if (reportType === 'coverage') {
      return await getCoverageReport(filters, courseIds);
    } else if (reportType === 'assignment') {
      return await getAssignmentAnalytics(whereClause);
    } else {
      // Default: Student Performance Report
      return await getPerformanceReport(whereClause, filters.status);
    }

  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}

async function getPerformanceReport(whereClause: any, statusFilter?: string) {
  const attempts = await prisma.studentAttempt.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: { yearOfStudy: true }
          }
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          course: {
            select: { id: true, name: true }
          },
          chapter: {
            select: { id: true, name: true }
          }
        }
      },
      grader: {
        select: { name: true }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  // Calculate total points for each assignment (based on questions or default 100)
  const assignmentPoints: Record<string, number> = {};
  for (const attempt of attempts) {
    if (!assignmentPoints[attempt.assignmentId]) {
      const questionCount = await prisma.question.count({
        where: { assignmentId: attempt.assignmentId }
      });
      assignmentPoints[attempt.assignmentId] = questionCount > 0 ? questionCount : 100;
    }
  }

  // Filter by status if needed
  let filteredAttempts = attempts;
  if (statusFilter === 'late') {
    filteredAttempts = attempts.filter(a => 
      a.submittedAt && a.assignment.dueDate && a.submittedAt > a.assignment.dueDate
    );
  }

  // Format data
  const data = filteredAttempts.map(attempt => {
    const totalPoints = assignmentPoints[attempt.assignmentId] || 100;
    const percentage = (attempt.score / totalPoints) * 100;
    const isLate = attempt.submittedAt && attempt.assignment.dueDate && 
                   attempt.submittedAt > attempt.assignment.dueDate;
    
    let status = 'Missing';
    if (attempt.submittedAt) {
      status = isLate ? 'Late' : 'Submitted';
    }

    return {
      studentId: attempt.student.id,
      studentName: attempt.student.name,
      studentEmail: attempt.student.email,
      rollNumber: attempt.student.profile?.yearOfStudy || 'N/A',
      courseId: attempt.assignment.course.id,
      courseName: attempt.assignment.course.name,
      chapterId: attempt.assignment.chapter?.id || null,
      chapterName: attempt.assignment.chapter?.name || 'N/A',
      assignmentId: attempt.assignment.id,
      assignmentTitle: attempt.assignment.title,
      assignmentType: attempt.assignment.type,
      score: attempt.score,
      totalPoints,
      percentage: percentage.toFixed(2),
      status,
      submittedAt: attempt.submittedAt?.toISOString() || null,
      gradedAt: attempt.gradedAt?.toISOString() || null,
      gradedBy: attempt.grader?.name || null,
      teacherComment: attempt.teacherComment || '',
      integrityFlag: attempt.integrityFlag,
    };
  });

  // Calculate summary
  const submitted = data.filter(d => d.submittedAt);
  const late = data.filter(d => d.status === 'Late');
  const missing = data.filter(d => d.status === 'Missing');
  const scores = submitted.map(d => parseFloat(d.percentage));

  const summary = {
    totalStudents: new Set(data.map(d => d.studentId)).size,
    totalSubmissions: submitted.length,
    averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0',
    highestScore: scores.length > 0 ? Math.max(...scores).toFixed(2) : '0',
    lowestScore: scores.length > 0 ? Math.min(...scores).toFixed(2) : '0',
    lateSubmissions: late.length,
    missingSubmissions: missing.length,
    integrityFlags: data.filter(d => d.integrityFlag).length,
  };

  return NextResponse.json({ data, summary });
}

async function getAssignmentAnalytics(whereClause: any) {
  const attempts = await prisma.studentAttempt.findMany({
    where: whereClause,
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          course: { select: { name: true } }
        }
      }
    }
  });

  // Group by assignment
  const assignmentMap = new Map<string, any>();

  for (const attempt of attempts) {
    const key = attempt.assignmentId;
    if (!assignmentMap.has(key)) {
      const questionCount = await prisma.question.count({
        where: { assignmentId: key }
      });
      assignmentMap.set(key, {
        assignmentId: key,
        assignmentTitle: attempt.assignment.title,
        assignmentType: attempt.assignment.type,
        courseName: attempt.assignment.course.name,
        dueDate: attempt.assignment.dueDate.toISOString(),
        totalQuestions: questionCount || 100,
        attempts: 0,
        submitted: 0,
        late: 0,
        missing: 0,
        scores: []
      });
    }

    const data = assignmentMap.get(key);
    data.attempts++;
    
    if (attempt.submittedAt) {
      data.submitted++;
      const totalPoints = data.totalQuestions;
      const percentage = (attempt.score / totalPoints) * 100;
      data.scores.push(percentage);

      if (attempt.submittedAt > attempt.assignment.dueDate) {
        data.late++;
      }
    } else {
      data.missing++;
    }
  }

  const data = Array.from(assignmentMap.values()).map(item => ({
    ...item,
    averageScore: item.scores.length > 0 
      ? (item.scores.reduce((a: number, b: number) => a + b, 0) / item.scores.length).toFixed(2)
      : '0',
    highestScore: item.scores.length > 0 ? Math.max(...item.scores).toFixed(2) : '0',
    lowestScore: item.scores.length > 0 ? Math.min(...item.scores).toFixed(2) : '0',
  }));

  const allScores = data.flatMap(d => d.scores);
  const summary = {
    totalAssignments: data.length,
    totalAttempts: attempts.length,
    totalSubmitted: data.reduce((sum, d) => sum + d.submitted, 0),
    averageScore: allScores.length > 0 
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : '0',
    highestScore: allScores.length > 0 ? Math.max(...allScores).toFixed(2) : '0',
    lowestScore: allScores.length > 0 ? Math.min(...allScores).toFixed(2) : '0',
    totalLate: data.reduce((sum, d) => sum + d.late, 0),
    totalMissing: data.reduce((sum, d) => sum + d.missing, 0),
  };

  return NextResponse.json({ data, summary });
}

async function getWeakStudentsReport(filters: ReportFilters, courseIds: string[]) {
  // Get students who are performing below average (< 60%)
  const courseFilter = filters.courseId || { in: courseIds };
  
  const attempts = await prisma.studentAttempt.findMany({
    where: {
      assignment: { courseId: courseFilter },
      submittedAt: { not: null }
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          course: { select: { name: true } }
        }
      }
    }
  });

  // Calculate student averages
  const studentScores = new Map<string, { student: any; scores: number[]; assignments: string[] }>();

  for (const attempt of attempts) {
    const questionCount = await prisma.question.count({
      where: { assignmentId: attempt.assignmentId }
    });
    const totalPoints = questionCount || 100;
    const percentage = (attempt.score / totalPoints) * 100;

    if (!studentScores.has(attempt.studentId)) {
      studentScores.set(attempt.studentId, {
        student: attempt.student,
        scores: [],
        assignments: []
      });
    }

    const data = studentScores.get(attempt.studentId)!;
    data.scores.push(percentage);
    data.assignments.push(attempt.assignment.title);
  }

  // Filter weak students (average < 60%)
  const weakStudents = Array.from(studentScores.entries())
    .map(([studentId, data]) => {
      const average = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      return {
        studentId,
        studentName: data.student.name,
        studentEmail: data.student.email,
        averageScore: average.toFixed(2),
        totalAssignments: data.assignments.length,
        lowestScore: Math.min(...data.scores).toFixed(2),
        highestScore: Math.max(...data.scores).toFixed(2),
        riskLevel: average < 40 ? 'High' : average < 60 ? 'Medium' : 'Low',
      };
    })
    .filter(s => parseFloat(s.averageScore) < 60)
    .sort((a, b) => parseFloat(a.averageScore) - parseFloat(b.averageScore));

  const summary = {
    totalWeakStudents: weakStudents.length,
    highRisk: weakStudents.filter(s => s.riskLevel === 'High').length,
    mediumRisk: weakStudents.filter(s => s.riskLevel === 'Medium').length,
    averageScore: weakStudents.length > 0
      ? (weakStudents.reduce((sum, s) => sum + parseFloat(s.averageScore), 0) / weakStudents.length).toFixed(2)
      : '0',
  };

  return NextResponse.json({ data: weakStudents, summary });
}

async function getIntegrityReport(whereClause: any) {
  const attempts = await prisma.studentAttempt.findMany({
    where: {
      ...whereClause,
      integrityFlag: true
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      assignment: {
        select: {
          id: true,
          title: true,
          type: true,
          course: { select: { name: true } },
          chapter: { select: { name: true } }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  const data = attempts.map(attempt => ({
    studentId: attempt.student.id,
    studentName: attempt.student.name,
    studentEmail: attempt.student.email,
    assignmentTitle: attempt.assignment.title,
    assignmentType: attempt.assignment.type,
    courseName: attempt.assignment.course.name,
    chapterName: attempt.assignment.chapter?.name || 'N/A',
    score: attempt.score,
    submittedAt: attempt.submittedAt?.toISOString() || null,
    integrityFlag: attempt.integrityFlag,
    teacherComment: attempt.teacherComment || '',
  }));

  const summary = {
    totalFlags: data.length,
    uniqueStudents: new Set(data.map(d => d.studentId)).size,
    uniqueAssignments: new Set(data.map(d => d.assignmentTitle)).size,
  };

  return NextResponse.json({ data, summary });
}

async function getCoverageReport(filters: ReportFilters, courseIds: string[]) {
  const courseFilter = filters.courseId || { in: courseIds };

  const courses = await prisma.course.findMany({
    where: { id: courseFilter },
    include: {
      chapters: {
        include: {
          assignments: {
            include: {
              _count: {
                select: { studentAttempts: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true
        }
      }
    }
  });

  const data = courses.flatMap(course =>
    course.chapters.map(chapter => ({
      courseId: course.id,
      courseName: course.name,
      chapterId: chapter.id,
      chapterName: chapter.name,
      totalAssignments: chapter.assignments.length,
      totalAttempts: chapter.assignments.reduce((sum, a) => sum + a._count.studentAttempts, 0),
      enrolledStudents: course._count.enrollments,
      coveragePercentage: course._count.enrollments > 0
        ? ((chapter.assignments.reduce((sum, a) => sum + a._count.studentAttempts, 0) / 
            (chapter.assignments.length * course._count.enrollments)) * 100).toFixed(2)
        : '0'
    }))
  );

  const summary = {
    totalCourses: courses.length,
    totalChapters: data.length,
    totalAssignments: data.reduce((sum, d) => sum + d.totalAssignments, 0),
    averageCoverage: data.length > 0
      ? (data.reduce((sum, d) => sum + parseFloat(d.coveragePercentage), 0) / data.length).toFixed(2)
      : '0',
  };

  return NextResponse.json({ data, summary });
}

function getEmptySummary() {
  return {
    totalStudents: 0,
    totalSubmissions: 0,
    averageScore: '0',
    highestScore: '0',
    lowestScore: '0',
    lateSubmissions: 0,
    missingSubmissions: 0,
    integrityFlags: 0,
  };
}
