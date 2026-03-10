import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

export async function POST(req: NextRequest) {
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
    const aiRes = await fetch(`${AI_SERVICE_URL}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim(), courseId }),
    });

    const data = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error ?? 'AI service error' },
        { status: aiRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
