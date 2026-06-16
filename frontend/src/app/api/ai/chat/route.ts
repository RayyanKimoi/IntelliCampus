import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

/**
 * POST /api/ai/chat
 * Bridges the ChatWindow client format → AI service tutor endpoint.
 * Body: { message, courseId, topicId?, mode, sessionId? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT, UserRole.TEACHER]);

    const body = await req.json();
    const { message, courseId, topicId, mode, sessionId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: message.trim(),
        courseId,
        topicId,
        mode,
        sessionId,
      }),
    });

    // Parse AI service response safely — some deployments return HTML error pages
    // (e.g. Vercel 404/500 HTML) which would throw when calling `res.json()`.
    let data: any = null;
    const contentType = aiRes.headers.get('content-type') || '';
    const bodyText = await aiRes.text();
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(bodyText);
      } catch (err) {
        // Fall through — we'll return the raw body in the error below
        data = null;
      }
    }

    if (!aiRes.ok) {
      const errorMessage = data?.error ?? (bodyText ? `AI service error: ${bodyText.slice(0, 200)}` : 'AI service error');
      return NextResponse.json({ success: false, error: errorMessage }, { status: aiRes.status });
    }

    // AI service wraps result in { success, data: { answer, sources, fromCache } }
    const payload = data?.data ?? data;

    // Wrap in { data: { ... } } so ChatWindow's response.data.message works correctly
    return NextResponse.json({
      success: true,
      data: {
        message: payload.answer ?? payload.message ?? payload.response ?? 'No response from AI.',
        sessionId: payload.sessionId ?? sessionId ?? null,
        responseType: payload.responseType ?? 'explanation',
        sources: payload.sources ?? [],
        fromCache: payload.fromCache ?? false,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
