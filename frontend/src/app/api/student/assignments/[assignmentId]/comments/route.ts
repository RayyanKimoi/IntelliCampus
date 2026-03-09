import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/student/assignments/:assignmentId/comments — get assignment comments */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { assignmentId } = await params;

    // TODO: Implement comments feature with database
    // For now, return empty array to prevent errors
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('[Student Assignment Comments API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/** POST /api/student/assignments/:assignmentId/comments — post a comment */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);
    const { assignmentId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // TODO: Implement comments feature with database
    // For now, return mock comment
    const mockComment = {
      id: `comment-${Date.now()}`,
      content: content.trim(),
      authorId: user.userId,
      authorName: user.email.split('@')[0], // Use email prefix as name
      authorRole: 'student' as const,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: mockComment,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Student Assignment Comments API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post comment' },
      { status: 500 }
    );
  }
}
