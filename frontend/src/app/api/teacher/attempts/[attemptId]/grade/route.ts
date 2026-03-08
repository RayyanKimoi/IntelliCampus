import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/teacher/attempts/[attemptId]/grade
 * Grade a student submission with score, comment, and rubric scores.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = getAuthUser(request);
    requireRole(user, [UserRole.TEACHER]);

    const { attemptId } = await params;
    const body = await request.json().catch(() => ({}));
    const { score, comment, rubricScores } = body as { 
      score?: number; 
      comment?: string;
      rubricScores?: Record<string, number>;
    };

    // Validate
    if (score === undefined || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'score is required and must be a number' },
        { status: 400 }
      );
    }

    // Update the student attempt
    const updatedAttempt = await prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        teacherComment: comment || '',
        rubricScores: rubricScores ? JSON.stringify(rubricScores) : Prisma.JsonNull,
        gradedAt: new Date(),
        gradedBy: user.userId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt,
    });
  } catch (error) {
    console.error('[API] Error grading attempt:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
