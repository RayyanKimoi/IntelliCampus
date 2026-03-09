// @ts-nocheck - Prisma client types out of sync with schema
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { assignmentId } = await params;
    const body = await req.json();

    const { questionText, optionA, optionB, optionC, optionD, correctOption, explanation, difficultyLevel } = body;

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return NextResponse.json({ success: false, error: 'All question fields are required' }, { status: 400 });
    }

    // Verify the assignment belongs to this teacher
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId, teacherId: user.userId },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    // @ts-ignore - Prisma client types not up to date with schema
    const question: any = await prisma.question.create({
      data: {
        assignmentId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        explanation: explanation || null,
        difficultyLevel: difficultyLevel || 'beginner',
      },
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error: any) {
    console.error('[Teacher Assignment Questions API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to add question' }, { status: 500 });
  }
}
