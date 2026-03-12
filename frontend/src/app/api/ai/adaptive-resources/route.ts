import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

/**
 * POST /api/ai/adaptive-resources
 * After a quiz/assignment, returns simplified explanation + practice questions
 * for wrong answers.
 *
 * Body: { concept: string, courseId: string, chapterId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { concept, courseId, chapterId } = body as {
      concept: string;
      courseId: string;
      chapterId: string;
    };

    if (!concept || !courseId || !chapterId) {
      return NextResponse.json(
        { success: false, error: 'concept, courseId, and chapterId are required' },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/adaptive-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept: String(concept).trim(),
        courseId: String(courseId),
        chapterId: String(chapterId),
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => 'AI service error');
      return NextResponse.json(
        { success: false, error: `AI service failed: ${errText}` },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    return NextResponse.json({ success: true, data: aiData });
  } catch (error: any) {
    console.error('[/api/ai/adaptive-resources]', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch adaptive resources' },
      { status }
    );
  }
}
