import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Weak: score < 70  |  Mastered: score >= 80
const WEAK_THRESHOLD = 70;

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    // conceptMastery is populated by submit-quiz for all quiz types (curriculum + adaptive)
    const records = await (prisma as any).conceptMastery.findMany({
      where: { studentId: user.userId },
      orderBy: { masteryScore: 'asc' },
    });

    // For each concept, find the most recent quiz question that used it
    // to get course and chapter names
    const concepts: string[] = records.map((r: any) => r.concept);

    const quizQuestions = concepts.length > 0
      ? await (prisma as any).quizQuestion.findMany({
          where: {
            concept: { in: concepts },
            quiz: { studentId: user.userId },
          },
          select: {
            concept: true,
            quiz: {
              select: {
                courseId: true,
                chapterId: true,
                createdAt: true,
                course: { select: { name: true } },
              },
            },
          },
          orderBy: { quiz: { createdAt: 'desc' } },
        })
      : [];

    // Build a map: concept → { courseName, chapterId }
    // Prefer quiz records that have a courseId (curriculum quizzes) over adaptive ones (no courseId).
    // Fall back to the most recent quiz if no curriculum quiz exists for that concept.
    const conceptMeta: Record<string, { courseName: string; chapterId: string | null }> = {};
    for (const qq of quizQuestions) {
      const existing = conceptMeta[qq.concept];
      const hasCourse = !!qq.quiz?.courseId;
      if (!existing) {
        conceptMeta[qq.concept] = {
          courseName: qq.quiz?.course?.name ?? '',
          chapterId: qq.quiz?.chapterId ?? null,
        };
      } else if (hasCourse && !existing.courseName) {
        // Upgrade to a record that actually has course info
        conceptMeta[qq.concept] = {
          courseName: qq.quiz?.course?.name ?? '',
          chapterId: qq.quiz?.chapterId ?? null,
        };
      }
    }

    // Fetch chapter names for all chapterIds found
    const chapterIds = [...new Set(
      Object.values(conceptMeta)
        .map(m => m.chapterId)
        .filter(Boolean) as string[]
    )];

    const chapters = chapterIds.length > 0
      ? await (prisma as any).chapter.findMany({
          where: { id: { in: chapterIds } },
          select: { id: true, name: true },
        })
      : [];

    const chapterMap: Record<string, string> = {};
    for (const ch of chapters) chapterMap[ch.id] = ch.name;

    const byTopic = records.map((r: any) => {
      const meta = conceptMeta[r.concept];
      const chapterName = meta?.chapterId ? (chapterMap[meta.chapterId] ?? '') : '';
      return {
        topicId: r.id,
        topicName: r.concept,
        courseName: meta?.courseName ?? '',
        chapterName,
        masteryLevel: Math.round(r.masteryScore),
        attempts: r.totalCount,
        correct: r.correctCount,
        lastAssessed: r.updatedAt?.toISOString(),
      };
    });

    // Overall mastery = sum(correct) / sum(attempts) * 100
    const totalCorrect = records.reduce((sum: number, r: any) => sum + (r.correctCount ?? 0), 0);
    const totalAttempts = records.reduce((sum: number, r: any) => sum + (r.totalCount ?? 0), 0);
    const overallMastery = totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;

    const weakTopics = byTopic.filter((t: any) => t.masteryLevel < WEAK_THRESHOLD);

    return NextResponse.json(
      { success: true, data: { overallMastery, byTopic, weakTopics } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: error.message.includes('Authentication') ? 401
          : error.message.includes('permissions') ? 403
          : 500,
      }
    );
  }
}
