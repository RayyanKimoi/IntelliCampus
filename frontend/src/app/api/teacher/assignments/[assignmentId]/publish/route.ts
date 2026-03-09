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

    const assignment: any = await (prisma.assignment.update as any)({
      where: { id: assignmentId, teacherId: user.userId },
      data: { isPublished: true },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...assignment, dueDate: assignment.dueDate.toISOString(), createdAt: assignment.createdAt.toISOString() },
    });
  } catch (error: any) {
    console.error('[Teacher Assignment Publish API] Error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to publish assignment' }, { status: 500 });
  }
}
