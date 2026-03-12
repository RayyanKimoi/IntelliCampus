import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Must match GAMIFICATION.LEVEL_XP_MULTIPLIER in shared/constants/config
const LEVEL_XP_MULTIPLIER = 1000;
const WEAK_MASTERY_THRESHOLD = 70;

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const userId = user.userId;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      xpRecord,
      conceptMasteryRecords,
      performanceLogs30d,
      allPerformanceLogs,
      aiSessions,
      bossBattles,
      quizAttempts,
      enrollmentCount,
      xpLogs30d,
    ] = await Promise.all([
      prisma.studentXP.findUnique({ where: { userId } }),

      prisma.conceptMastery.findMany({
        where: { studentId: userId },
        orderBy: { masteryScore: 'asc' },
      }),

      prisma.performanceLog.findMany({
        where: { userId, createdAt: { gte: last30Days } },
        include: { topic: true },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.performanceLog.findMany({
        where: { userId },
        select: { timeSpent: true },
      }),

      prisma.aISession.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      prisma.bossBattle.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),

      prisma.quizAttempt.findMany({
        where: { studentId: userId, completedAt: { gte: last30Days } },
        include: {
          quiz: {
            select: {
              type: true,
              totalQuestions: true,
              course: { select: { name: true } },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),

      prisma.courseEnrollment.count({ where: { studentId: userId } }),

      prisma.xPLog.findMany({
        where: { userId, createdAt: { gte: last30Days } },
        select: { xpAmount: true, createdAt: true, source: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Study Streak with auto-heal
    let streak = xpRecord?.streakDays ?? 0;
    if (streak === 0 && (xpRecord?.totalXp ?? 0) > 0 && xpRecord?.lastActivityDate) {
      const diffDays = Math.floor(
        (Date.now() - new Date(xpRecord.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) {
        streak = 1;
        await prisma.studentXP.update({ where: { userId }, data: { streakDays: 1 } });
      }
    }

    // Avg Session Time (timeSpent in seconds)
    const avgSessionTime =
      allPerformanceLogs.length > 0
        ? Math.round(
            allPerformanceLogs.reduce((sum, p) => sum + p.timeSpent, 0) /
              allPerformanceLogs.length /
              60
          )
        : 0;

    // Mastery metrics from conceptMastery (same source as Mastery tab)
    const totalCorrectConcept = conceptMasteryRecords.reduce(
      (sum, r) => sum + (r.correctCount ?? 0),
      0
    );
    const totalAttemptsConcept = conceptMasteryRecords.reduce(
      (sum, r) => sum + (r.totalCount ?? 0),
      0
    );

    const correctRate =
      totalAttemptsConcept > 0
        ? Math.round((totalCorrectConcept / totalAttemptsConcept) * 100)
        : 0;

    const topicsStudied = conceptMasteryRecords.filter((r) => (r.totalCount ?? 0) > 0).length;

    const overallMastery =
      totalAttemptsConcept > 0
        ? Math.round((totalCorrectConcept / totalAttemptsConcept) * 100)
        : 0;

    // Weak Topics
    const weakTopics = conceptMasteryRecords
      .filter((r) => r.masteryScore < WEAK_MASTERY_THRESHOLD && (r.totalCount ?? 0) > 0)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        topicName: r.concept,
        mastery: Math.round(r.masteryScore),
        courseName: '',
      }));

    // Performance Trend: quiz scores + XP per day over last 30 days
    type TrendDay = { totalPct: number; count: number; xp: number };
    const trendMap = new Map<string, TrendDay>();

    for (const attempt of quizAttempts) {
      const day = (attempt.completedAt instanceof Date
        ? attempt.completedAt
        : new Date(attempt.completedAt)
      ).toISOString().split('T')[0];
      const totalQ = (attempt.quiz as any)?.totalQuestions ?? 1;
      const pct = Math.min(100, Math.round((attempt.score / totalQ) * 100));
      const existing = trendMap.get(day) ?? { totalPct: 0, count: 0, xp: 0 };
      existing.totalPct += pct;
      existing.count += 1;
      trendMap.set(day, existing);
    }

    // Overlay XP earned per day (from xpLogs30d already fetched)
    for (const xpLog of xpLogs30d) {
      const day = xpLog.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(day) ?? { totalPct: 0, count: 0, xp: 0 };
      existing.xp += xpLog.xpAmount;
      trendMap.set(day, existing);
    }

    const performanceTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { totalPct, count, xp }]) => ({
        date,
        mastery: count > 0 ? Math.round(totalPct / count) : 0,
        xp,
      }));

    // XP Profile with level self-heal
    const totalXp = xpRecord?.totalXp ?? 0;
    const correctLevel = Math.floor(totalXp / LEVEL_XP_MULTIPLIER) + 1;
    if (xpRecord && correctLevel !== xpRecord.level) {
      await prisma.studentXP.update({ where: { userId }, data: { level: correctLevel } });
    }
    const level = correctLevel;
    const xpForNextLevel = level * LEVEL_XP_MULTIPLIER;
    const currentLevelXP = totalXp % LEVEL_XP_MULTIPLIER;

    const xp = {
      totalXP: totalXp,
      level,
      xpToNextLevel: xpForNextLevel,
      currentLevelXP,
    };

    // Recent Activity
    type ActivityEvent = {
      id: string;
      type: string;
      title: string;
      timestamp: string;
      xpEarned?: number;
    };

    const activityFromLogs: ActivityEvent[] = performanceLogs30d
      .slice()
      .reverse()
      .slice(0, 10)
      .map((log) => ({
        id: log.id,
        type: log.activityType === 'practice' ? 'quiz' : log.activityType,
        title: capitaliseFirst(log.activityType) + ' - ' + log.topic.name,
        timestamp: log.createdAt.toISOString(),
      }));

    const activityFromAI: ActivityEvent[] = aiSessions.map((s) => ({
      id: s.id,
      type: 'chat',
      title: 'AI Tutor - ' + s.topic.name,
      timestamp: s.createdAt.toISOString(),
    }));

    const activityFromBoss: ActivityEvent[] = bossBattles.map((b) => ({
      id: b.id,
      type: 'boss_battle',
      title: 'Boss Battle - ' + b.topic.name,
      timestamp: b.startedAt.toISOString(),
    }));

    const activityFromQuiz: ActivityEvent[] = quizAttempts.map((a) => {
      const quizType = capitaliseFirst((a.quiz as any)?.type ?? 'Quiz');
      const courseName = (a.quiz as any)?.course?.name;
      return {
        id: a.id,
        type: 'quiz',
        title: courseName ? quizType + ' - ' + courseName : quizType,
        timestamp:
          a.completedAt instanceof Date
            ? a.completedAt.toISOString()
            : String(a.completedAt),
      };
    });

    const xpByMinute = new Map<string, number>();
    for (const xpLog of xpLogs30d) {
      const key = xpLog.createdAt.toISOString().substring(0, 16);
      xpByMinute.set(key, (xpByMinute.get(key) ?? 0) + xpLog.xpAmount);
    }

    const allActivity: ActivityEvent[] = [
      ...activityFromLogs,
      ...activityFromAI,
      ...activityFromBoss,
      ...activityFromQuiz,
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
      .map((act) => ({
        ...act,
        xpEarned: xpByMinute.get(act.timestamp.substring(0, 16)),
      }));

    return NextResponse.json(
      {
        success: true,
        data: {
          streak,
          avgSessionTime,
          correctRate,
          topicsStudied,
          overallMastery,
          coursesEnrolled: enrollmentCount,
          performanceTrend,
          xp,
          weakTopics,
          recentActivities: allActivity,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: error.message?.includes('Authentication')
          ? 401
          : error.message?.includes('permissions')
          ? 403
          : 500,
      }
    );
  }
}

function capitaliseFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}