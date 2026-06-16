import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

export async function POST(req: NextRequest) {
  const _start = performance.now();
  try {
    // Authenticate — any logged-in student or teacher may use the tutor
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT, UserRole.TEACHER]);

    const body = await req.json();
    const { question, courseId } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'question is required' },
        { status: 400 }
      );
    }

    // Forward to AI services Express server
    const _aiCallStart = performance.now();
    const aiRes = await fetch(`${AI_SERVICE_URL}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim(), courseId }),
    });
    const ai_service_ms = Math.round(performance.now() - _aiCallStart);

    const data = await aiRes.json();
    const total_ms = Math.round(performance.now() - _start);
    console.log(JSON.stringify({ stage: 'frontend_api_tutor', total_ms, ai_service_ms, network_overhead_ms: total_ms - ai_service_ms, from_cache: data?.data?.fromCache ?? false }));

    if (!aiRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error ?? 'AI service error' },
        { status: aiRes.status }
      );
    }

    return NextResponse.json({ ...data, _timing: { frontend_total_ms: total_ms, ai_service_ms } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const total_ms = Math.round(performance.now() - _start);
    console.error(JSON.stringify({ stage: 'frontend_api_tutor_error', total_ms, error: message }));
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
