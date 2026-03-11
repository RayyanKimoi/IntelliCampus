import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

// POST /api/student/adaptive-summary
// Accepts { courseId, weakConcepts: string[] }
// Calls the AI service to generate rich concept summaries + Mermaid mindmaps
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { courseId = '', weakConcepts } = body as {
      courseId?: string;
      weakConcepts: string[];
    };

    if (!Array.isArray(weakConcepts) || weakConcepts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A non-empty weakConcepts array is required' },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/adaptive-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, weakConcepts }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => 'AI service error');
      return NextResponse.json(
        { success: false, error: `AI service failed: ${errText}` },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    return NextResponse.json({ success: true, data: aiData.data ?? aiData });
  } catch (error: any) {
    console.error('[/api/student/adaptive-summary]', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate adaptive summary' },
      { status }
    );
  }
}
