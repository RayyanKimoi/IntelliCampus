// @ts-nocheck - Prisma client types out of sync with schema
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/student/attempts/:attemptId — get attempt result */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;

    // @ts-ignore - Prisma client types not up to date with schema
    const attempt: any = await prisma.studentAttempt.findUnique({
      where: { id: attemptId, studentId: user.userId },
      include: {
        studentAnswers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                correctOption: true,
                explanation: true,
                topicId: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: attempt.id,
        assignmentId: attempt.assignmentId,
        userId: attempt.studentId,
        score: attempt.score,
        startedAt: attempt.startedAt.toISOString(),
        completedAt: attempt.submittedAt?.toISOString(),
        totalQuestions: attempt.studentAnswers.length,
        correctAnswers: attempt.studentAnswers.filter((a: any) => a.isCorrect).length,
        answers: attempt.studentAnswers.map((a: any) => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption,
          isCorrect: a.isCorrect,
          correctOption: a.question.correctOption,
          explanation: a.question.explanation,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Student Attempt Result API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch attempt' }, { status: 500 });
  }
}
