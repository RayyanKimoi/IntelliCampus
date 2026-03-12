import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

/**
 * POST /api/ai/adaptive-quiz
 * Generates an adaptive quiz targeting a student's weak concepts.
 *
 * Body: { studentId?, courseId, topic?, difficulty?, numberOfQuestions? }
 * Returns: { quizId, questions[] }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const {
      courseId = '',
      chapterId = '',
      topic,
      difficulty = 'medium',
      numberOfQuestions = 5,
    } = body as {
      courseId?: string;
      chapterId?: string;
      topic?: string;
      difficulty?: string;
      numberOfQuestions?: number;
    };

    const clampedCount = Math.min(Math.max(1, Number(numberOfQuestions) || 5), 20);

    // ── 1. Fetch student's weak concepts ──────────────────────────────────────
    const whereClause: any = { studentId: user.userId, isWeak: true };
    if (courseId) {
      const courseQuizConcepts = await (prisma.quizQuestion as any).findMany({
        where: { quiz: { studentId: user.userId, courseId } },
        select: { concept: true },
        distinct: ['concept'],
      });
      const allowedConcepts = courseQuizConcepts.map((r: any) => r.concept as string);
      if (allowedConcepts.length > 0) {
        whereClause.concept = { in: allowedConcepts };
      }
    }

    if (topic) {
      whereClause.concept = topic;
    }

    const weakConceptRecords = await (prisma.conceptMastery as any).findMany({
      where: whereClause,
      orderBy: { masteryScore: 'asc' },
      take: 5,
    });

    const weakConcepts: string[] = weakConceptRecords.length > 0
      ? weakConceptRecords.map((r: any) => r.concept as string)
      : topic
        ? [topic]
        : [];

    if (weakConcepts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No weak concepts found. Complete some quizzes first to identify areas for improvement.',
        },
        { status: 400 }
      );
    }

    // ── 2. Call AI service to generate adaptive quiz ──────────────────────────
    let aiQuestions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      concept: string;
    }> = [];

    let aiError = '';

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/generate-adaptive-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, chapterId, weakConcepts, numberOfQuestions: clampedCount }),
        signal: AbortSignal.timeout(120_000),
      });

      const aiData = await aiRes.json();
      if (aiRes.ok && Array.isArray(aiData?.questions)) {
        aiQuestions = aiData.questions;
      } else {
        aiError = aiData?.error ?? `AI service returned ${aiRes.status}`;
        console.error('[/api/ai/adaptive-quiz] AI error:', aiError);
      }
    } catch (err: any) {
      const isDown = err.name === 'AbortError' || err.cause?.code === 'ECONNREFUSED';
      aiError = isDown
        ? 'AI service is not running. Start it with: cd ai-services && pnpm dev'
        : err.message;
      console.error('[/api/ai/adaptive-quiz] AI service unavailable:', aiError);
    }

    if (!aiQuestions.length) {
      return NextResponse.json(
        { success: false, error: aiError || 'AI returned no questions' },
        { status: 502 }
      );
    }

    // ── 3. Persist the quiz to DB ─────────────────────────────────────────────
    const difficultyMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
      easy: 'EASY', medium: 'MEDIUM', hard: 'HARD',
    };

    const quiz = await (prisma.quiz as any).create({
      data: {
        studentId: user.userId,
        courseId: courseId || null,
        chapterId: chapterId || null,
        type: 'ADAPTIVE',
        difficulty: difficultyMap[difficulty] ?? 'MEDIUM',
        totalQuestions: aiQuestions.length,
        questions: {
          create: aiQuestions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            concept: q.concept || weakConcepts[0],
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        weakConcepts,
        questions: quiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          concept: q.concept,
        })),
      },
    });
  } catch (error: any) {
    console.error('[/api/ai/adaptive-quiz] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate adaptive quiz' },
      { status }
    );
  }
}
