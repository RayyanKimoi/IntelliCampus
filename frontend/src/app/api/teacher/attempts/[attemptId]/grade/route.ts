import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock route: POST /api/teacher/attempts/[attemptId]/grade
 * Simulates grading a student submission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const body = await request.json().catch(() => ({}));
  const { score, comment } = body as { score?: number; comment?: string };

  // Validate
  if (score === undefined || typeof score !== 'number') {
    return NextResponse.json(
      { error: 'score is required and must be a number' },
      { status: 400 }
    );
  }

  // Return the updated attempt record (mock)
  return NextResponse.json({
    success: true,
    attempt: {
      id: attemptId,
      score,
      comment: comment ?? '',
      gradedAt: new Date().toISOString(),
      status: 'graded',
    },
  });
}
