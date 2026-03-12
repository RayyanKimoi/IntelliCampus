import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

/**
 * POST /api/ai/mindmap
 * Converts an AI tutor answer into a Mermaid mindmap diagram.
 * Forwards to the AI service at AI_SERVICE_URL/mindmap.
 * Body: { answer: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT, UserRole.TEACHER]);

    const body = await req.json();
    const { answer, question } = body;

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json(
        { success: false, error: 'answer is required' },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/mindmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: answer.trim(),
        question: typeof question === 'string' ? question.trim() : undefined,
      }),
    });

    const data = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error ?? 'AI service error' },
        { status: aiRes.status }
      );
    }

    return NextResponse.json({ success: true, chart: data.chart });
  } catch (error: any) {
    console.error('[/api/ai/mindmap] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

