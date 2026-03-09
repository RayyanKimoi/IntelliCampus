import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId, teacherId: user.userId },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        questions: true,
        _count: { select: { questions: true, studentAttempts: true } },
      } as any,
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...assignment, dueDate: assignment.dueDate.toISOString(), createdAt: assignment.createdAt.toISOString() },
    });
  } catch (error: any) {
    console.error('[Teacher Assignment API] GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch assignment' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { assignmentId } = await params;
    const body = await req.json();

    const { title, description, dueDate, submissionTypes, rubric, assignmentDocumentUrl, evaluationPoints, isPublished, chapterId } = body;

    const assignment: any = await prisma.assignment.update({
      where: { id: assignmentId, teacherId: user.userId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(submissionTypes !== undefined && { submissionTypes }),
        ...(rubric !== undefined && { rubric }),
        ...(assignmentDocumentUrl !== undefined && { assignmentDocumentUrl }),
        ...(evaluationPoints !== undefined && { evaluationPoints }),
        ...(isPublished !== undefined && { isPublished }),
        ...(chapterId !== undefined && { chapterId }),
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      } as any,
    });

    return NextResponse.json({
      success: true,
      data: { ...assignment, dueDate: assignment.dueDate.toISOString(), createdAt: assignment.createdAt.toISOString() },
    });
  } catch (error: any) {
    console.error('[Teacher Assignment API] PUT Error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);
    const { assignmentId } = await params;

    await prisma.assignment.delete({
      where: { id: assignmentId, teacherId: user.userId },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('[Teacher Assignment API] DELETE Error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete assignment' }, { status: 500 });
  }
}
