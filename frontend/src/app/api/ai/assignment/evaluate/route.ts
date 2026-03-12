import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

interface AIEvaluationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  feedback: string;
  weakTopics: string[];
}

/**
 * POST /api/ai/assignment/evaluate
 * Runs AI evaluation on a student's assignment attempt.
 * Only teachers (and the student who owns the attempt) may call this.
 *
 * Body: { attemptId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.TEACHER, UserRole.STUDENT]);

    const body = await req.json();
    const { attemptId } = body as { attemptId: string };

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: 'attemptId is required' },
        { status: 400 }
      );
    }

    // ── 1. Load the attempt with assignment details ───────────────────────────
    const attempt = await (prisma.studentAttempt as any).findUnique({
      where: { id: attemptId },
      include: {
        assignment: {
          select: {
            title: true,
            description: true,
            evaluationPoints: true,
            courseId: true,
            chapterId: true,
            teacherId: true,
          },
        },
        student: { select: { id: true, name: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // ── 2. Authorization check ────────────────────────────────────────────────
    const isTeacher = user.role === UserRole.TEACHER && attempt.assignment.teacherId === user.userId;
    const isStudent = user.role === UserRole.STUDENT && attempt.studentId === user.userId;

    if (!isTeacher && !isStudent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ── 3. Build submission text from stored answers ──────────────────────────
    const answers = attempt.answers as Record<string, any> | null;
    let submissionText = '';

    if (answers) {
      if (answers.textContent && typeof answers.textContent === 'string') {
        submissionText += answers.textContent.trim();
      }
      if (answers.codeContent && typeof answers.codeContent === 'string') {
        if (submissionText) submissionText += '\n\n--- Code ---\n\n';
        submissionText += answers.codeContent.trim();
      }
    }

    // Fallback: if no assignment JSON content, note it
    if (!submissionText.trim()) {
      submissionText = attempt.submissionFileUrl
        ? `[File submission: ${attempt.submissionFileUrl}]`
        : '[No text content provided in submission]';
    }

    // ── 4. Call AI service ─────────────────────────────────────────────────────
    let evalResult: AIEvaluationResult | null = null;
    let aiError = '';

    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/evaluate-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionText,
          assignmentTitle: attempt.assignment.title,
          assignmentDescription: attempt.assignment.description,
          evaluationPoints: attempt.assignment.evaluationPoints ?? '',
          courseId: attempt.assignment.courseId ?? '',
          chapterId: attempt.assignment.chapterId ?? '',
        }),
        signal: AbortSignal.timeout(120_000),
      });

      const aiData = await aiRes.json();

      if (aiRes.ok && aiData.success) {
        evalResult = aiData.data as AIEvaluationResult;
      } else {
        aiError = aiData?.error ?? `AI service returned ${aiRes.status}`;
        console.error('[/api/ai/assignment/evaluate] AI service error:', aiError);
      }
    } catch (err: any) {
      const isDown = err.name === 'AbortError' || err.cause?.code === 'ECONNREFUSED';
      aiError = isDown
        ? 'AI service is not running. Start it with: cd ai-services && pnpm dev'
        : err.message;
      console.error('[/api/ai/assignment/evaluate] AI service unavailable:', aiError);
    }

    if (!evalResult) {
      return NextResponse.json(
        { success: false, error: aiError || 'AI evaluation failed' },
        { status: 502 }
      );
    }

    // ── 5. Persist evaluation back on the attempt ────────────────────────────
    const updatedAttempt = await (prisma.studentAttempt as any).update({
      where: { id: attemptId },
      data: {
        aiEvaluation: evalResult,
        aiGraded: true,
        // Only auto-update score if not yet manually graded
        ...(attempt.gradedAt === null && { score: evalResult.score }),
      },
    });

    // ── 6. Update ConceptMastery for weak topics (Feature 3) ─────────────────
    if (evalResult.weakTopics.length > 0 && evalResult.score < 70) {
      const studentId = attempt.studentId;
      await Promise.all(
        evalResult.weakTopics.map(async (topic: string) => {
          const existing = await (prisma.conceptMastery as any).findUnique({
            where: { studentId_concept: { studentId, concept: topic } },
          });

          const prevTotal = existing?.totalCount ?? 0;
          const prevCorrect = existing?.correctCount ?? 0;

          // Weight assignment score: score/100 = proportion correct
          const newTotal = prevTotal + 1;
          const addedCorrect = evalResult!.score / 100;
          const newCorrect = prevCorrect + addedCorrect;
          const masteryScore = (newCorrect / newTotal) * 100;
          const isWeak = masteryScore < 70;

          await (prisma.conceptMastery as any).upsert({
            where: { studentId_concept: { studentId, concept: topic } },
            create: {
              studentId,
              concept: topic,
              masteryScore,
              isWeak,
              correctCount: Math.round(newCorrect),
              totalCount: newTotal,
            },
            update: {
              masteryScore,
              isWeak,
              correctCount: Math.round(newCorrect),
              totalCount: newTotal,
            },
          });
        })
      );

      // Update TopicMastery if we have a courseId
      const courseId = attempt.assignment.courseId;
      if (courseId) {
        await Promise.all(
          evalResult.weakTopics.map(async (topic: string) => {
            const existing = await (prisma.topicMastery as any).findUnique({
              where: { studentId_courseId_topic: { studentId: attempt.studentId, courseId, topic } },
            });
            const newAttempts = (existing?.attempts ?? 0) + 1;
            const addedCorrect = evalResult!.score / 100;
            const newCorrect = (existing?.correct ?? 0) + addedCorrect;
            const topicScore = (newCorrect / newAttempts) * 100;

            await (prisma.topicMastery as any).upsert({
              where: { studentId_courseId_topic: { studentId: attempt.studentId, courseId, topic } },
              create: { studentId: attempt.studentId, courseId, topic, attempts: newAttempts, correct: Math.round(newCorrect), score: topicScore },
              update: { attempts: newAttempts, correct: Math.round(newCorrect), score: topicScore },
            });
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId,
        aiGraded: true,
        evaluation: evalResult,
        score: updatedAttempt.score,
      },
    });
  } catch (error: any) {
    console.error('[/api/ai/assignment/evaluate] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Evaluation failed' },
      { status }
    );
  }
}
