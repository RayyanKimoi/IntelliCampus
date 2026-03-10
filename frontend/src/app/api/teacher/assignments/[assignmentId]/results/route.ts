import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { assignmentId } = await params;

    // Verify the assignment belongs to this teacher
    const assignment: any = await (prisma.assignment.findUnique as any)({
      where: { id: assignmentId },
      select: { teacherId: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch all submission attempts for this assignment
    const attempts: any = await (prisma.studentAttempt.findMany as any)({
      where: {
        assignmentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        studentAnswers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('[API] Error fetching assignment results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment results' },
      { status: 500 }
    );
  }
}
