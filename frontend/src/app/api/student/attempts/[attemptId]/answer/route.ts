import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/student/attempts/:attemptId/answer — record a single MCQ answer */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;
    const body = await req.json();

    const { questionId, selectedOption, timeTaken } = body;

    if (!questionId || !selectedOption) {
      return NextResponse.json({ success: false, error: 'questionId and selectedOption are required' }, { status: 400 });
    }

    // Verify the attempt belongs to this student
    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: attemptId, studentId: user.userId },
    });

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    // Get the correct answer
    const question: any = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    const isCorrect = question.correctOption === selectedOption;

    // Delete any existing answer for this question in this attempt, then create fresh
    await prisma.studentAnswer.deleteMany({ where: { attemptId, questionId } });

    const answer = await prisma.studentAnswer.create({
      data: {
        attemptId,
        questionId,
        selectedOption,
        isCorrect,
        timeTaken: timeTaken || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...answer,
        correctOption: question.correctOption,
        explanation: question.explanation,
      },
    });
  } catch (error: any) {
    console.error('[Student Attempt Answer API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to record answer' }, { status: 500 });
  }
}
