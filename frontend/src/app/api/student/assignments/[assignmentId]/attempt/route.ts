import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/student/assignments/:assignmentId/attempt — start a new attempt */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { assignmentId } = await params;

    // Check for an existing incomplete attempt
    const existing: any = await (prisma.studentAttempt.findFirst as any)({
      where: { assignmentId, studentId: user.userId, submittedAt: null },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { ...existing, startedAt: existing.startedAt.toISOString() },
      });
    }

    const attempt: any = await (prisma.studentAttempt.create as any)({
      data: {
        assignmentId,
        studentId: user.userId,
        score: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...attempt, startedAt: attempt.startedAt.toISOString() },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Student Attempt Start API] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to start attempt' }, { status: 500 });
  }
}
