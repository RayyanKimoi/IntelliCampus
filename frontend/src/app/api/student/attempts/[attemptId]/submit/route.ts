import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/student/attempts/:attemptId/submit — submit an attempt */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;

    let body: any = {};
    try { body = await req.json(); } catch { /* no body for quiz submits */ }

    const { textContent, codeContent, submissionFileUrl } = body ?? {};

    // Verify the attempt belongs to this student
    const attempt: any = await (prisma.studentAttempt.findUnique as any)({
      where: { id: attemptId, studentId: user.userId },
      include: {
        studentAnswers: {
          include: { question: { select: { correctOption: true } } },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.submittedAt) {
      return NextResponse.json({ success: false, error: 'Attempt already submitted' }, { status: 409 });
    }

    // Calculate score for MCQ attempts
    let score = attempt.score;
    if (attempt.studentAnswers.length > 0) {
      const correct = attempt.studentAnswers.filter((a) => a.isCorrect).length;
      score = (correct / attempt.studentAnswers.length) * 100;
    }

    // Build answers payload for open-ended submissions
    let answersJson: any = undefined;
    if (textContent || codeContent) {
      answersJson = { textContent, codeContent };
    }

    const updated: any = await (prisma.studentAttempt.update as any)({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score,
        ...(answersJson !== undefined && { answers: answersJson }),
        ...(submissionFileUrl && { submissionFileUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        startedAt: updated.startedAt.toISOString(),
        submittedAt: updated.submittedAt?.toISOString(),
      },
      message: 'Assignment submitted successfully',
    });
  } catch (error: any) {
    console.error('[Student Attempt Submit API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit attempt' }, { status: 500 });
  }
}
