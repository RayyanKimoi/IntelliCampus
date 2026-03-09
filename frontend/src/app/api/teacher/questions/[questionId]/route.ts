import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { questionId } = await params;
    const body = await req.json();

    const { questionText, optionA, optionB, optionC, optionD, correctOption, explanation, difficultyLevel } = body;

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(questionText !== undefined && { questionText }),
        ...(optionA !== undefined && { optionA }),
        ...(optionB !== undefined && { optionB }),
        ...(optionC !== undefined && { optionC }),
        ...(optionD !== undefined && { optionD }),
        ...(correctOption !== undefined && { correctOption }),
        ...(explanation !== undefined && { explanation }),
        ...(difficultyLevel !== undefined && { difficultyLevel }),
      },
    });

    return NextResponse.json({ success: true, data: question });
  } catch (error: any) {
    console.error('[Teacher Questions API] PUT Error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { questionId } = await params;

    await prisma.question.delete({ where: { id: questionId } });

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('[Teacher Questions API] DELETE Error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete question' }, { status: 500 });
  }
}
