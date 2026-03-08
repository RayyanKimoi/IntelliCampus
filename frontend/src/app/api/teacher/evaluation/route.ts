import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const body = await req.json();
    const { studentId, courseId, score, feedback } = body;

    if (!studentId || !courseId || score === undefined) {
      return NextResponse.json(
        { success: false, error: 'studentId, courseId and score are required' },
        { status: 400 }
      );
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json(
        { success: false, error: 'score must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    const evaluation = await prisma.studentEvaluation.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {
        score: numericScore,
        feedback: feedback ?? '',
        gradedAt: new Date(),
      },
      create: {
        studentId,
        courseId,
        score: numericScore,
        feedback: feedback ?? '',
      },
    });

    return NextResponse.json(
      { success: true, data: evaluation, message: 'Evaluation saved' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Evaluation API] Error:', error);
    const isAuth =
      error.message?.includes('Authentication') ||
      error.message?.includes('token');
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save evaluation' },
      { status: isAuth ? 401 : 500 }
    );
  }
}
