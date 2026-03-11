import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

// POST /api/student/practice/adaptive-resources
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { courseId, chapterId, weakConcepts } = body as {
      courseId: string;
      chapterId: string;
      weakConcepts: Array<{ concept: string; errorCount?: number } | string>;
    };

    if (!courseId || !chapterId || !Array.isArray(weakConcepts) || weakConcepts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'courseId, chapterId, and a non-empty weakConcepts array are required' },
        { status: 400 }
      );
    }

    // Normalise: weakConcepts may be strings or objects with a concept field
    const conceptList: string[] = weakConcepts.map((c) =>
      typeof c === 'string' ? c.trim() : String(c.concept ?? '').trim()
    ).filter(Boolean);

    if (conceptList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid concept names found in weakConcepts' },
        { status: 400 }
      );
    }

    // ── Generate + persist resources for each concept in parallel ─────────────
    const results = await Promise.allSettled(
      conceptList.map(async (concept) => {
        // Call AI service
        const aiRes = await fetch(`${AI_SERVICE_URL}/adaptive-resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept, courseId, chapterId }),
          signal: AbortSignal.timeout(60_000),
        });

        if (!aiRes.ok) {
          const err = await aiRes.text().catch(() => 'AI service error');
          throw new Error(`AI service failed for concept "${concept}": ${err}`);
        }

        const aiData = await aiRes.json() as {
          success: boolean;
          explanation?: string;
          mindmap?: string;
          error?: string;
        };

        if (!aiData.success) {
          throw new Error(aiData.error ?? `AI service returned failure for "${concept}"`);
        }

        const explanation = aiData.explanation ?? '';
        const mindmap = aiData.mindmap ?? '';

        // Persist into AdaptiveResource table
        const saved = await (prisma as any).adaptiveResource.create({
          data: {
            studentId: user.userId,
            courseId,
            chapterId,
            concept,
            explanation,
            mindmap,
          },
        });

        return { concept, explanation, mindmap, resourceId: saved.id };
      })
    );

    // ── Separate successes from failures ──────────────────────────────────────
    const resources: Array<{ concept: string; explanation: string; mindmap: string; resourceId: string }> = [];
    const errors: Array<{ concept: string; error: string }> = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        resources.push(result.value);
      } else {
        errors.push({ concept: conceptList[i], error: result.reason?.message ?? 'Unknown error' });
        console.error('[adaptive-resources] concept failed:', conceptList[i], result.reason);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resources,
        ...(errors.length > 0 ? { partialErrors: errors } : {}),
      },
    });
  } catch (error: any) {
    console.error('[AdaptiveResources] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate adaptive resources' },
      { status }
    );
  }
}
