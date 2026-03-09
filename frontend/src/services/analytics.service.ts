import { prisma } from '@/lib/prisma';
import { MASTERY } from '@intellicampus/shared';

export class AnalyticsService {
  // ========================
  // Student Analytics
  // ========================

  /**
   * Get comprehensive student dashboard data
   */
  async getStudentDashboard(userId: string) {
    const [mastery, xp, weakTopics, recentPerformance, battleStats] =
      await Promise.all([
        prisma.masteryGraph.findMany({
          where: { userId },
          include: {
            topic: {
              include: { subject: { include: { course: true } } },
            },
          },
          orderBy: { masteryScore: 'asc' },
        }),
        prisma.studentXP.findUnique({ where: { userId } }),
        prisma.weakTopicFlag.findMany({
          where: { userId },
          include: { topic: true },
          take: 5,
        }),
        prisma.performanceLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { topic: true },
        }),
        prisma.bossBattle.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
      ]);

    // Calculate overall mastery
    const avgMastery =
      mastery.length > 0
        ? mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length
        : 0;

    // Study time (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyPerformance = recentPerformance.filter(
      (p) => p.createdAt >= weekAgo
    );
    const totalStudyTime = weeklyPerformance.reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );

    return {
      mastery: {
        overall: Math.round(avgMastery * 10) / 10,
        byTopic: mastery,
        weakTopics,
      },
      xp: xp || { totalXp: 0, level: 1, streakDays: 0 },
      performance: {
        recent: recentPerformance,
        weeklyStudyTimeMinutes: Math.round(totalStudyTime / 60),
      },
      battles: battleStats,
    };
  }

  /**
   * Get student performance trend (daily averages)
   */
  async getPerformanceTrend(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.performanceLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
      include: { topic: true },
    });
  }

  // ========================
  // Teacher Analytics
  // ========================

  /**
   * Get teacher dashboard: class overview
   */
  async getTeacherDashboard(teacherId: string) {
    const courses = await (prisma.course.findMany as any)({
      where: { createdBy: teacherId },
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
        assignments: {
          include: {
            studentAttempts: {
              include: {
                student: true,
              },
            },
          },
        },
        subjects: {
          include: {
            topics: {
              include: {
                masteryGraphs: true,
              },
            },
          },
        },
      },
    });

    // Calculate total unique students across all courses
    const allStudentIds = new Set<string>();
    courses.forEach((course: any) => {
      course.enrollments?.forEach((enrollment: any) => {
        allStudentIds.add(enrollment.studentId);
      });
    });
    const totalStudents = allStudentIds.size;

    // Calculate overall mastery across all topics
    const allMasteryScores: number[] = [];
    courses.forEach((course: any) => {
      course.subjects?.forEach((subject: any) => {
        subject.topics?.forEach((topic: any) => {
          const scores = topic.masteryGraphs?.map((m: any) => m.masteryScore) || [];
          allMasteryScores.push(...scores);
        });
      });
    });
    const avgMastery = allMasteryScores.length > 0
      ? Math.round((allMasteryScores.reduce((a, b) => a + b, 0) / allMasteryScores.length) * 10) / 10
      : 0;

    // Format courses data
    const formattedCourses = courses.map((course: any) => {
      const enrollmentCount = course.enrollments?.length || 0;
      
      // Calculate average grade from recent attempts
      const allGrades: number[] = [];
      course.assignments?.forEach((assignment: any) => {
        assignment.studentAttempts?.forEach((attempt: any) => {
          if (attempt.score != null) {
            allGrades.push(attempt.score);
          }
        });
      });
      const avgGrade = allGrades.length > 0
        ? Math.round((allGrades.reduce((a, b) => a + b, 0) / allGrades.length) * 10) / 10
        : 0;

      // Find next upcoming assignment
      const upcomingAssignments = course.assignments
        ?.filter((a: any) => new Date(a.dueDate) > new Date())
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      const nextAssignment = upcomingAssignments?.[0];

      return {
        id: course.id,
        title: course.name,
        studentCount: enrollmentCount,
        avgGrade,
        nextAssignmentDue: nextAssignment ? new Date(nextAssignment.dueDate).toISOString() : undefined,
      };
    });

    // Identify at-risk students (low performance)
    const studentPerformanceMap = new Map<string, { studentId: string; name: string; scores: number[]; courseNames: string[] }>();
    
    courses.forEach((course: any) => {
      course.assignments?.forEach((assignment: any) => {
        assignment.studentAttempts?.forEach((attempt: any) => {
          if (attempt.score != null && attempt.student) {
            if (!studentPerformanceMap.has(attempt.studentId)) {
              studentPerformanceMap.set(attempt.studentId, {
                studentId: attempt.studentId,
                name: attempt.student.name || attempt.student.email,
                scores: [],
                courseNames: [],
              });
            }
            const studentData = studentPerformanceMap.get(attempt.studentId)!;
            studentData.scores.push(attempt.score);
            if (!studentData.courseNames.includes(course.name)) {
              studentData.courseNames.push(course.name);
            }
          }
        });
      });
    });

    const atRiskStudents = Array.from(studentPerformanceMap.values())
      .map(student => {
        const avgScore = student.scores.reduce((a, b) => a + b, 0) / student.scores.length;
        let riskFactor: 'High' | 'Medium' | 'Low' = 'Low';
        if (avgScore < 50) riskFactor = 'High';
        else if (avgScore < 70) riskFactor = 'Medium';
        
        return {
          id: student.studentId,
          name: student.name,
          riskFactor,
          currentGrade: Math.round(avgScore * 10) / 10,
          courseName: student.courseNames[0] || 'Unknown',
        };
      })
      .filter(s => s.riskFactor === 'High' || s.riskFactor === 'Medium')
      .sort((a, b) => a.currentGrade - b.currentGrade)
      .slice(0, 10);

    // Generate simple performance trend (placeholder)
    const performanceTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      performanceTrend.push({
        date: `Week ${12 - i}`,
        classAverage: avgMastery > 0 ? avgMastery + Math.floor(Math.random() * 10 - 5) : 60,
      });
    }

    return {
      totalStudents,
      avgMastery,
      activeCoursesCount: courses.length,
      courses: formattedCourses,
      atRiskStudents,
      performanceTrend,
    };
  }

  /**
   * Get individual student analytics for teacher view
   */
  async getStudentAnalyticsForTeacher(studentId: string) {
    return this.getStudentDashboard(studentId);
  }

  /**
   * Generate and store teacher insights
   */
  async generateTeacherInsights(teacherId: string, courseId: string) {
    const topics = await prisma.topic.findMany({
      where: {
        subject: { courseId },
      },
      include: {
        masteryGraphs: true,
      },
    });

    const insights = [];

    for (const topic of topics) {
      const scores = topic.masteryGraphs.map((m) => m.masteryScore);
      if (scores.length === 0) continue;

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const weakCount = scores.filter(
        (s) => s < MASTERY.WEAK_THRESHOLD
      ).length;

      const insight = await prisma.teacherInsight.create({
        data: {
          teacherId,
          courseId,
          topicId: topic.id,
          avgMastery: Math.round(avg * 10) / 10,
          weakStudentCount: weakCount,
        },
      });

      insights.push(insight);
    }

    return insights;
  }

  // ========================
  // Admin Analytics
  // ========================

  /**
   * Get institution-wide analytics
   */
  async getAdminDashboard(institutionId: string) {
    const [userCounts, recentUsage, aiUsage] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        where: { institutionId },
        _count: true,
      }),
      prisma.systemUsageLog.findMany({
        where: {
          user: { institutionId },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.aISession.count({
        where: {
          user: { institutionId },
        },
      }),
    ]);

    return {
      users: userCounts,
      totalAISessions: aiUsage,
      recentActivity: recentUsage,
    };
  }

  /**
   * Log a system usage event
   */
  async logUsage(userId: string, actionType: string, metadata?: Record<string, unknown>) {
    return prisma.systemUsageLog.create({
      data: {
        userId,
        actionType,
        metadata: (metadata || {}) as any,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
