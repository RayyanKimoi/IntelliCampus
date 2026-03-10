import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reports/generate
 * Generates a specific report type with institution-level data
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    let user;
    try {
      user = getAuthUser(req);
      requireRole(user, [UserRole.ADMIN]);
    } catch (authError: any) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    let data: any = {};

    // Generate report based on type
    switch (reportId) {
      case 'institutional-performance':
        data = await generateInstitutionalPerformance();
        break;
      case 'student-progress':
        data = await generateStudentProgress();
        break;
      case 'assessment-audit':
        data = await generateAssessmentAudit();
        break;
      case 'ai-usage':
        data = await generateAIUsageReport();
        break;
      case 'completion-dropout':
        data = await generateCompletionDropoutReport();
        break;
      case 'accessibility':
        data = await generateAccessibilityReport();
        break;
      case 'accreditation-pack':
        data = await generateAccreditationPack();
        break;
      default:
        return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reportId,
      data,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Report Generation Functions

async function generateInstitutionalPerformance() {
  const [
    totalCourses,
    totalStudents,
    totalAssignments,
    totalSubmissions,
    lateSubmissions,
    integrityFlags,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.assignment.count(),
    prisma.studentAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.studentAttempt.count({
      where: {
        AND: [
          { submittedAt: { not: null } },
          prisma.$queryRaw`submitted_at > (SELECT due_date FROM assignments WHERE id = student_attempts.assignment_id)` as any
        ]
      }
    }),
    prisma.studentAttempt.count({ where: { integrityFlag: true } }),
  ]);

  // Calculate completion rate
  const enrollments = await prisma.courseEnrollment.count();
  const completionRate = enrollments > 0 
    ? ((totalSubmissions / (enrollments * totalAssignments)) * 100).toFixed(2)
    : '0';

  // Calculate average score
  const attempts = await prisma.studentAttempt.findMany({
    where: { submittedAt: { not: null } },
    select: { score: true, assignmentId: true }
  });

  let averageScore = 0;
  if (attempts.length > 0) {
    const assignmentIds = [...new Set(attempts.map(a => a.assignmentId))];
    const assignmentPoints = new Map<string, number>();
    
    for (const id of assignmentIds) {
      const questionCount = await prisma.question.count({ where: { assignmentId: id } });
      assignmentPoints.set(id, questionCount || 100);
    }

    const percentages = attempts.map(a => 
      (a.score / (assignmentPoints.get(a.assignmentId) || 100)) * 100
    );
    averageScore = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  }

  return {
    totalCourses,
    totalStudents,
    totalAssignments,
    totalSubmissions,
    lateSubmissions,
    integrityFlags,
    averageScore: averageScore.toFixed(2),
    completionRate,
    metadata: {
      generatedAt: new Date().toISOString(),
      scope: 'institution',
    }
  };
}

async function generateStudentProgress() {
  const students = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    include: {
      studentAttempts: {
        include: {
          assignment: {
            select: {
              title: true,
              type: true,
              course: { select: { name: true } },
              chapter: { select: { name: true } }
            }
          }
        }
      },
      enrollments: {
        include: {
          course: { select: { name: true } }
        }
      }
    },
    take: 1000 // Limit for performance
  });

  const progress = students.map(student => ({
    studentId: student.id,
    studentName: student.name,
    email: student.email,
    enrolledCourses: student.enrollments.length,
    totalAttempts: student.studentAttempts.length,
    submittedAttempts: student.studentAttempts.filter(a => a.submittedAt).length,
    averageScore: student.studentAttempts.length > 0
      ? (student.studentAttempts.reduce((sum, a) => sum + a.score, 0) / student.studentAttempts.length).toFixed(2)
      : '0',
    lastActivity: student.studentAttempts.length > 0
      ? student.studentAttempts.sort((a, b) => 
          (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)
        )[0]?.submittedAt?.toISOString()
      : null
  }));

  return { students: progress, total: students.length };
}

async function generateAssessmentAudit() {
  const attempts = await prisma.studentAttempt.findMany({
    where: { submittedAt: { not: null } },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: {
        select: {
          id: true,
          title: true,
          type: true,
          course: { select: { name: true } }
        }
      },
      grader: { select: { name: true } }
    },
    orderBy: { submittedAt: 'desc' },
    take: 5000 // Limit for performance
  });

  const audit = attempts.map(attempt => ({
    attemptId: attempt.id,
    assignmentId: attempt.assignment.id,
    assignmentTitle: attempt.assignment.title,
    assignmentType: attempt.assignment.type,
    courseName: attempt.assignment.course.name,
    studentId: attempt.student.id,
    studentName: attempt.student.name,
    studentEmail: attempt.student.email,
    score: attempt.score,
    rubricScores: attempt.rubricScores,
    teacherComment: attempt.teacherComment,
    submittedAt: attempt.submittedAt?.toISOString(),
    gradedAt: attempt.gradedAt?.toISOString(),
    gradedBy: attempt.grader?.name,
    integrityFlag: attempt.integrityFlag,
  }));

  return { attempts: audit, total: attempts.length };
}

async function generateAIUsageReport() {
  const [totalSessions, sessionsByMode] = await Promise.all([
    prisma.aISession.count(),
    prisma.aISession.groupBy({
      by: ['mode'],
      _count: { mode: true }
    })
  ]);

  const studentsUsingAI = await prisma.aISession.findMany({
    select: { userId: true },
    distinct: ['userId']
  });

  return {
    totalSessions,
    uniqueStudents: studentsUsingAI.length,
    sessionsByMode: sessionsByMode.map(s => ({
      mode: s.mode,
      count: s._count.mode
    })),
    metadata: {
      note: 'Token consumption tracking requires additional integration'
    }
  };
}

async function generateCompletionDropoutReport() {
  const students = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    include: {
      enrollments: true,
      studentAttempts: {
        where: { submittedAt: { not: null } }
      }
    }
  });

  const totalAssignments = await prisma.assignment.count();

  const analysis = students.map(student => {
    const completionRate = totalAssignments > 0
      ? (student.studentAttempts.length / totalAssignments) * 100
      : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      enrolledCourses: student.enrollments.length,
      completedAssignments: student.studentAttempts.length,
      totalAssignments,
      completionRate: completionRate.toFixed(2),
      riskLevel: completionRate < 30 ? 'High' : completionRate < 60 ? 'Medium' : 'Low',
      neverSubmitted: student.studentAttempts.length === 0
    };
  });

  const atRisk = analysis.filter(s => parseFloat(s.completionRate) < 60);
  const dropouts = analysis.filter(s => s.neverSubmitted);

  return {
    analysis,
    summary: {
      totalStudents: students.length,
      atRiskStudents: atRisk.length,
      potentialDropouts: dropouts.length,
      averageCompletion: analysis.length > 0
        ? (analysis.reduce((sum, s) => sum + parseFloat(s.completionRate), 0) / analysis.length).toFixed(2)
        : '0'
    }
  };
}

async function generateAccessibilityReport() {
  const [totalUsers, usersWithSettings] = await Promise.all([
    prisma.user.count(),
    prisma.accessibilitySettings.count()
  ]);

  const settings = await prisma.accessibilitySettings.findMany({
    select: {
      adhdMode: true,
      dyslexiaFont: true,
      highContrast: true,
      speechEnabled: true,
      focusMode: true,
    }
  });

  const featureUsage = {
    adhdMode: settings.filter(s => s.adhdMode).length,
    dyslexiaFont: settings.filter(s => s.dyslexiaFont).length,
    highContrast: settings.filter(s => s.highContrast).length,
    speechEnabled: settings.filter(s => s.speechEnabled).length,
    focusMode: settings.filter(s => s.focusMode).length,
  };

  return {
    totalUsers,
    usersWithAccessibilitySettings: usersWithSettings,
    adoptionRate: ((usersWithSettings / totalUsers) * 100).toFixed(2),
    featureUsage,
  };
}

async function generateAccreditationPack() {
  // Generate all required reports for accreditation
  const [
    performance,
    studentProgress,
    assessmentAudit,
    aiUsage,
    accessibility
  ] = await Promise.all([
    generateInstitutionalPerformance(),
    generateStudentProgress(),
    generateAssessmentAudit(),
    generateAIUsageReport(),
    generateAccessibilityReport(),
  ]);

  return {
    performance,
    studentProgress: {
      total: studentProgress.total,
      summary: `${studentProgress.total} students tracked`
    },
    assessmentAudit: {
      total: assessmentAudit.total,
      summary: `${assessmentAudit.total} submissions audited`
    },
    aiUsage,
    accessibility,
    compiledAt: new Date().toISOString(),
  };
}
