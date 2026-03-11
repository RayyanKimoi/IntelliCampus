import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

// POST /api/student/practice/adaptive-quiz
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const {
      courseId = '',
      chapterId = '',
      weakConcepts,
      numberOfQuestions = 5,
    } = body as {
      courseId?: string;
      chapterId?: string;
      weakConcepts: Array<{ concept: string; errorCount?: number } | string>;
      numberOfQuestions?: number;
    };

    if (!Array.isArray(weakConcepts) || weakConcepts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A non-empty weakConcepts array is required' },
        { status: 400 }
      );
    }

    // Normalise: accept string[] or { concept }[]
    const conceptList: string[] = weakConcepts
      .map((c) => (typeof c === 'string' ? c.trim() : String(c.concept ?? '').trim()))
      .filter(Boolean);

    if (conceptList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid concept names found in weakConcepts' },
        { status: 400 }
      );
    }

    const clampedCount = Math.min(Math.max(1, Number(numberOfQuestions)), 20);

    // ── 1. Call AI service ────────────────────────────────────────────────────
    const aiRes = await fetch(`${AI_SERVICE_URL}/generate-adaptive-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        chapterId,
        weakConcepts: conceptList,
        numberOfQuestions: clampedCount,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => 'AI service error');
      return NextResponse.json(
        { success: false, error: `AI service failed: ${errText}` },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json() as {
      success: boolean;
      questions?: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        concept: string;
      }>;
      error?: string;
    };

    if (!aiData.success || !Array.isArray(aiData.questions) || aiData.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: aiData.error ?? 'AI service returned no questions' },
        { status: 502 }
      );
    }

    // ── 2. Persist Quiz (type=ADAPTIVE) + QuizQuestions ──────────────────────
    const quiz = await (prisma as any).quiz.create({
      data: {
        student: { connect: { id: user.userId } },
        ...(courseId ? { courseId } : {}),
        ...(chapterId ? { chapterId } : {}),
        type: 'ADAPTIVE',
        difficulty: 'MEDIUM',
        totalQuestions: aiData.questions.length,
        questions: {
          create: aiData.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            concept: q.concept,
          })),
        },
      },
      include: { questions: true },
    });

    // ── 3. Return quiz ────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        type: 'ADAPTIVE',
        targetedConcepts: conceptList,
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
    console.error('[AdaptiveQuiz] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate adaptive quiz' },
      { status }
    );
  }
}
