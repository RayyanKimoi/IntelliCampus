import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/student/attempts/:attemptId/reject — auto-reject due to integrity violations */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }

    // Verify the attempt belongs to this student
    const attempt: any = await (prisma.studentAttempt.findUnique as any)({
      where: { id: attemptId },
      select: { studentId: true, status: true, submittedAt: true },
    });

    if (!attempt || attempt.studentId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 },
      );
    }

    if (attempt.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'Attempt already rejected' },
        { status: 409 },
      );
    }

    // Reject the attempt
    const updated: any = await (prisma.studentAttempt.update as any)({
      where: { id: attemptId },
      data: {
        status: 'REJECTED',
        integrityFlag: true,
        submittedAt: attempt.submittedAt ?? new Date(),
        score: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        violations: updated.violations,
      },
    });
  } catch (error: any) {
    console.error('[Reject API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject attempt' },
      { status: 500 },
    );
  }
}
