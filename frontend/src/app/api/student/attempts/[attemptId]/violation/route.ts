import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/student/attempts/:attemptId/violation — record an integrity violation */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { attemptId } = await params;

    const body = await req.json();
    const { type, count } = body ?? {};

    if (!type || typeof count !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing violation type or count' },
        { status: 400 },
      );
    }

    // Verify the attempt belongs to this student
    const attempt: any = await (prisma.studentAttempt.findUnique as any)({
      where: { id: attemptId },
      select: { studentId: true, status: true },
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

    // Update violation count and set integrity flag
    const updated: any = await (prisma.studentAttempt.update as any)({
      where: { id: attemptId },
      data: {
        violations: count,
        integrityFlag: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        violations: updated.violations,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error('[Violation API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record violation' },
      { status: 500 },
    );
  }
}
