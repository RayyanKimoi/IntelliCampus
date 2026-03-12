import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const DIFFICULTY_MAP: Record<string, 'easy' | 'medium' | 'hard'> = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

/**
 * POST /api/teacher/assignments/ai-generate
 * Creates a quiz assignment with AI-generated questions from the RAG pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER]);

    const body = await req.json();
    const {
      courseId,
      chapterId,
      topic,
      title,
      description,
      dueDate,
      difficultyLevel = 'intermediate',
      questionCount = 5,
    } = body;

    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }
    if (!chapterId) {
      return NextResponse.json({ success: false, error: 'chapterId is required' }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }

    // dueDate is optional — default to 7 days from now if not provided
    const resolvedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const difficulty = DIFFICULTY_MAP[difficultyLevel] ?? 'medium';
    const clampedCount = Math.min(Math.max(1, Number(questionCount) || 5), 20);

    // ── Step 1: Create the assignment record ─────────────────────────────────
    // isPublished: true so enrolled students can see it immediately.
    // Teacher can un-publish from Assessment Studio if review is needed first.
    const assignment = await (prisma.assignment as any).create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? '',
        courseId,
        chapterId,
        teacherId: user.userId,
        dueDate: resolvedDueDate,
        type: 'quiz',
        submissionTypes: [],
        rubric: null,
        evaluationPoints: 100,
        isPublished: true,
      },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true, studentAttempts: true } },
      },
    });

    // ── Step 2: Call AI service to generate questions via RAG ─────────────────
    let aiQuestions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      concept: string;
    }> = [];

    let aiError = '';

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          chapterId,
          numberOfQuestions: clampedCount,
          difficulty,
          ...(topic ? { topic } : {}),
        }),
        signal: AbortSignal.timeout(120_000),
      });

      const aiData = await aiRes.json();
      if (aiRes.ok && Array.isArray(aiData?.questions)) {
        aiQuestions = aiData.questions;
      } else {
        aiError = aiData?.error ?? `AI service returned ${aiRes.status}`;
        console.error('[ai-generate] AI service error:', aiError);
      }
    } catch (err: any) {
      aiError =
        err.name === 'AbortError' || err.cause?.code === 'ECONNREFUSED'
          ? 'AI service is not running. Start it with: cd ai-services && pnpm dev'
          : err.message;
      console.error('[ai-generate] AI service unavailable:', aiError);
    }

    // ── Step 3: Persist questions (if any) ───────────────────────────────────
    let savedQuestions: any[] = [];

    if (aiQuestions.length > 0) {
      // Map AI question format to DB Question format
      const optionKeys = ['A', 'B', 'C', 'D'] as const;

      const createData = aiQuestions.map((q) => {
        const opts: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        while (opts.length < 4) opts.push('');

        // Find which option letter matches the correctAnswer text
        const correctIdx = opts.findIndex(
          (o) => o.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
        );
        const correctOption = correctIdx >= 0 ? optionKeys[correctIdx] : 'A';

        return {
          assignmentId: assignment.id,
          questionText: String(q.question).trim(),
          optionA: opts[0],
          optionB: opts[1],
          optionC: opts[2],
          optionD: opts[3],
          correctOption,
          explanation: String(q.explanation ?? '').trim(),
          difficultyLevel: difficulty === 'easy' ? 'beginner' : difficulty === 'hard' ? 'advanced' : 'intermediate',
        };
      });

      savedQuestions = await Promise.all(
        createData.map((data) =>
          (prisma.question as any).create({ data })
        )
      );
    }

    const responseData = {
      assignment: {
        ...assignment,
        dueDate: assignment.dueDate.toISOString(),
        createdAt: assignment.createdAt.toISOString(),
      },
      questions: savedQuestions,
      aiError: aiError || null,
      generatedCount: aiQuestions.length,
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Teacher AI Generate API] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate AI quiz' },
      { status }
    );
  }
}
