import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnswerEntry {
  topic: string;
  isCorrect: boolean;
}

// POST /api/student/mastery/update
// Body: { courseId: string, answers: { topic: string, isCorrect: boolean }[] }
// Called when a quiz is submitted to update per-topic mastery statistics.
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { courseId, answers } = body as {
      courseId: string;
      answers: AnswerEntry[];
    };

    if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'courseId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'answers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate course exists
    const course = await (prisma as any).course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Group answers by topic
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const ans of answers) {
      const topic = String(ans.topic ?? '').trim();
      if (!topic) continue;
      const entry = topicMap.get(topic) ?? { correct: 0, total: 0 };
      entry.total++;
      if (ans.isCorrect) entry.correct++;
      topicMap.set(topic, entry);
    }

    // Upsert TopicMastery for each topic
    const updated = await Promise.all(
      Array.from(topicMap.entries()).map(async ([topic, { correct, total }]) => {
        const existing = await (prisma as any).topicMastery.findUnique({
          where: {
            studentId_courseId_topic: {
              studentId: user.userId,
              courseId,
              topic,
            },
          },
        });

        const newAttempts = (existing?.attempts ?? 0) + total;
        const newCorrect = (existing?.correct ?? 0) + correct;
        const score = newAttempts > 0 ? (newCorrect / newAttempts) * 100 : 0;

        return (prisma as any).topicMastery.upsert({
          where: {
            studentId_courseId_topic: {
              studentId: user.userId,
              courseId,
              topic,
            },
          },
          create: {
            studentId: user.userId,
            courseId,
            topic,
            attempts: newAttempts,
            correct: newCorrect,
            score,
          },
          update: {
            attempts: newAttempts,
            correct: newCorrect,
            score,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: { updated: updated.length } });
  } catch (error: any) {
    console.error('[MasteryUpdate] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update mastery' },
      { status }
    );
  }
}
