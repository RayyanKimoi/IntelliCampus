import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// POST /api/student/practice/generate-quiz
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { courseId, chapterId, numberOfQuestions = 5, difficulty = 'medium' } = body;

    if (!courseId || !chapterId) {
      return NextResponse.json(
        { success: false, error: 'courseId and chapterId are required' },
        { status: 400 }
      );
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'difficulty must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Call AI service to generate questions via RAG pipeline
    let aiQuestions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      concept: string;
    }> = [];

    let aiServiceError = '';

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, chapterId, numberOfQuestions, difficulty }),
        signal: AbortSignal.timeout(90_000),
      });

      const aiData = await aiRes.json();

      if (aiRes.ok) {
        aiQuestions = aiData?.questions || aiData?.data?.questions || [];
      } else {
        aiServiceError = aiData?.error || `AI service returned ${aiRes.status}`;
        console.error('[GenerateQuiz] AI service error:', aiServiceError);
      }
    } catch (aiError: any) {
      // Connection refused or timeout — AI service is not running
      const isDown = aiError.name === 'AbortError' || aiError.cause?.code === 'ECONNREFUSED';
      aiServiceError = isDown
        ? 'AI service is not running. Start it with: cd ai-services && pnpm dev'
        : aiError.message;
      console.error('[GenerateQuiz] AI service unavailable:', aiServiceError);
    }

    if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: aiServiceError
            ? aiServiceError
            : 'AI service returned no questions. Ensure curriculum content has been ingested for this chapter.',
        },
        { status: 502 }
      );
    }

    // Map difficulty string to Prisma enum
    const difficultyMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
      easy: 'EASY',
      medium: 'MEDIUM',
      hard: 'HARD',
    };

    // Persist Quiz + QuizQuestions in a transaction
    const quiz = await (prisma as any).quiz.create({
      data: {
        studentId: user.userId,
        courseId,
        chapterId,
        type: 'CURRICULUM',
        difficulty: difficultyMap[difficulty],
        totalQuestions: aiQuestions.length,
        questions: {
          create: aiQuestions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            concept: q.concept || '',
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          quizId: quiz.id,
          questions: quiz.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            concept: q.concept,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[GenerateQuiz] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate quiz' }, { status });
  }
}
