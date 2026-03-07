import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const { chapterId } = await context.params;
    const body = await req.json();
    const { notes } = body;

    if (typeof notes !== 'string') {
      return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
    }

    // In dev/mock mode, simply return the notes back.
    // In production this would upsert into the DB and queue for RAG re-indexing.
    console.log(`[TeacherNotes] Chapter ${chapterId} notes updated by ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          chapterId,
          teacherNotes: notes,
          updatedAt: new Date().toISOString(),
          updatedBy: user.userId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API] POST teacher-notes error:', error);

    const isAuthError =
      error.message?.includes('Authentication required') ||
      error.message?.includes('Invalid or expired token');
    const statusCode = isAuthError ? 401 : 500;

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    );
  }
}
