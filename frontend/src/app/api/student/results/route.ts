import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const studentId = user.userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel
    const [quizAttempts, studentAttempts, topicMasteryRecords] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: {
            select: {
              totalQuestions: true,
              course: { select: { name: true } },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.studentAttempt.findMany({
        where: { studentId, submittedAt: { not: null } },
        include: {
          assignment: {
            select: {
              title: true,
              course: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.topicMastery.findMany({
        where: { studentId },
        include: { course: { select: { name: true } } },
        orderBy: { score: 'asc' },
      }),
    ]);

    // 1. Overall Performance — average score across all graded attempts
    const allScores: number[] = [];

    for (const qa of quizAttempts) {
      allScores.push(Math.min(qa.score, 100));
    }

    for (const sa of studentAttempts) {
      if (sa.score > 0) {
        allScores.push(Math.min(Math.round(sa.score), 100));
      }
    }

    const overallPct =
      allScores.length > 0
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : 0;

    // 2. Topic Mastery
    const topicMastery = topicMasteryRecords.map((tm) => ({
      topicId: tm.id,
      topicName: tm.topic,
      masteryPct: Math.round(Math.min(tm.score, 100)),
      courseName: tm.course?.name ?? '',
    }));

    // 3. Recent Scores — combine quiz + assignment, sort by date, take 10
    const recentScores = [
      ...quizAttempts.map((qa) => ({
        id: qa.id,
        assignmentTitle: `Quiz – ${qa.quiz?.course?.name ?? 'General'}`,
        submittedAt: qa.completedAt.toISOString(),
        score: Math.min(qa.score, 100),
        totalPoints: 100,
        status: 'graded' as const,
      })),
      ...studentAttempts
        .filter((sa) => sa.score > 0)
        .map((sa) => ({
          id: sa.id,
          assignmentTitle: sa.assignment?.title ?? 'Assignment',
          submittedAt: sa.submittedAt?.toISOString() ?? new Date().toISOString(),
          score: Math.min(Math.round(sa.score), 100),
          totalPoints: 100,
          status: sa.gradedAt ? 'graded' as const : 'submitted' as const,
        })),
    ]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10);

    // 4. 30-Day Performance Trend — group scores by date
    const recentItems = [
      ...quizAttempts
        .filter((qa) => qa.completedAt >= thirtyDaysAgo)
        .map((qa) => ({ date: qa.completedAt, score: Math.min(qa.score, 100) })),
      ...studentAttempts
        .filter((sa) => sa.submittedAt && sa.submittedAt >= thirtyDaysAgo && sa.score > 0)
        .map((sa) => ({ date: sa.submittedAt!, score: Math.min(Math.round(sa.score), 100) })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const trendMap = new Map<string, { total: number; count: number }>();
    for (const item of recentItems) {
      const dateStr = item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const entry = trendMap.get(dateStr) ?? { total: 0, count: 0 };
      entry.total += item.score;
      entry.count += 1;
      trendMap.set(dateStr, entry);
    }

    const trendData = Array.from(trendMap.entries()).map(([date, { total, count }]) => ({
      date,
      score: Math.round(total / count),
    }));

    return NextResponse.json({
      success: true,
      data: { overallPct, topicMastery, recentScores, trendData },
    });
  } catch (error: any) {
    console.error('[Student Results API] Error:', error);

    // Handle table-not-found errors gracefully
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: { overallPct: 0, topicMastery: [], recentScores: [], trendData: [] },
      });
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load results' },
      {
        status: error.message?.includes('Authentication')
          ? 401
          : error.message?.includes('permissions')
            ? 403
            : 500,
      },
    );
  }
}
