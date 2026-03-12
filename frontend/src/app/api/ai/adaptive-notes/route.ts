import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

/**
 * POST /api/ai/adaptive-notes
 * Generates AI adaptive curriculum notes for the given topics/concepts.
 * Uses the existing adaptive-summary RAG pipeline in ai-services.
 *
 * Body: { courseId: string, topics: string[] }
 * Alternatively accepts weakConcepts[] for API compatibility with adaptive-summary.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { courseId = '', topics, weakConcepts } = body as {
      courseId?: string;
      topics?: string[];
      weakConcepts?: string[];
    };

    // Accept either `topics` or `weakConcepts` for flexibility
    const conceptList: string[] = (topics ?? weakConcepts ?? [])
      .map((c: string) => String(c).trim())
      .filter(Boolean)
      .slice(0, 10);

    if (conceptList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'topics array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Proxy to AI service adaptive-summary endpoint (same pipeline)
    const aiRes = await fetch(`${AI_SERVICE_URL}/adaptive-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, weakConcepts: conceptList }),
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
    return NextResponse.json({
      success: true,
      data: aiData.data ?? aiData,
    });
  } catch (error: any) {
    console.error('[/api/ai/adaptive-notes]', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate adaptive notes' },
      { status }
    );
  }
}
