import { prisma } from '../config/db';
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
    const courses = await prisma.course.findMany({
      where: { createdBy: teacherId },
      include: {
        subjects: {
          include: {
            topics: {
              include: {
                masteryGraphs: true,
              },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
    });

    const classInsights = courses.map((course) => {
      const allMasteryScores: number[] = [];
      const topicBreakdown: Array<{
        topicId: string;
        topicName: string;
        avgMastery: number;
        weakCount: number;
        studentCount: number;
      }> = [];

      course.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          const scores = topic.masteryGraphs.map((m) => m.masteryScore);
          allMasteryScores.push(...scores);

          const avg =
            scores.length > 0
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0;

          topicBreakdown.push({
            topicId: topic.id,
            topicName: topic.name,
            avgMastery: Math.round(avg * 10) / 10,
            weakCount: scores.filter((s) => s < MASTERY.WEAK_THRESHOLD).length,
            studentCount: scores.length,
          });
        });
      });

      const overallAvg =
        allMasteryScores.length > 0
          ? allMasteryScores.reduce((a, b) => a + b, 0) /
            allMasteryScores.length
          : 0;

      return {
        courseId: course.id,
        courseName: course.name,
        overallMastery: Math.round(overallAvg * 10) / 10,
        assignmentCount: course._count.assignments,
        topicBreakdown: topicBreakdown.sort(
          (a, b) => a.avgMastery - b.avgMastery
        ),
      };
    });

    return classInsights;
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
