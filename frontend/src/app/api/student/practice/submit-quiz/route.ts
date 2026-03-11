import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { UserRole } from '@intellicampus/shared';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubmittedAnswer {
  questionId: string;
  selectedAnswer: string;
}

// POST /api/student/practice/submit-quiz
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, [UserRole.STUDENT]);

    const body = await req.json();
    const { quizId, answers } = body as {
      quizId: string;
      answers: SubmittedAnswer[];
    };

    if (!quizId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'quizId and answers array are required' },
        { status: 400 }
      );
    }

    // ── 1. Load quiz + all questions ──────────────────────────────────────────
    const quiz = await (prisma as any).quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (quiz.studentId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized — this quiz belongs to another student' },
        { status: 403 }
      );
    }

    // ── 2. Grade each answer ──────────────────────────────────────────────────
    const questionMap = new Map<string, any>(
      quiz.questions.map((q: any) => [q.id, q])
    );

    const gradedAnswers = answers.map((ans) => {
      const question = questionMap.get(ans.questionId);
      if (!question) return null;

      const isCorrect =
        String(ans.selectedAnswer).trim() ===
        String(question.correctAnswer).trim();

      return {
        questionId: ans.questionId,
        selectedAnswer: String(ans.selectedAnswer).trim(),
        isCorrect,
        concept: question.concept as string,
        question: question.question as string,
        correctAnswer: question.correctAnswer as string,
        explanation: question.explanation as string,
      };
    }).filter(Boolean) as Array<{
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      concept: string;
      question: string;
      correctAnswer: string;
      explanation: string;
    }>;

    // ── 3. Calculate score ────────────────────────────────────────────────────
    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // ── 4. Detect weak concepts ───────────────────────────────────────────────
    // Count incorrect answers per concept, sort by frequency descending
    const conceptErrorMap = new Map<string, number>();
    for (const ans of gradedAnswers) {
      if (!ans.isCorrect && ans.concept) {
        conceptErrorMap.set(ans.concept, (conceptErrorMap.get(ans.concept) ?? 0) + 1);
      }
    }
    const weakConcepts = Array.from(conceptErrorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([concept, errorCount]) => ({ concept, errorCount }));

    // ── 5. Persist QuizAttempt + QuizAnswers in one transaction ──────────────
    const attempt = await (prisma as any).quizAttempt.create({
      data: {
        quizId,
        studentId: user.userId,
        score,
        completedAt: new Date(),
        answers: {
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer,
            isCorrect: a.isCorrect,
          })),
        },
      },
      include: { answers: true },
    });

    // ── 6. Update ConceptMastery for each concept answered ───────────────────
    const conceptGroups: Record<string, { correct: number; total: number }> = {};
    for (const a of gradedAnswers) {
      if (!a.concept) continue;
      if (!conceptGroups[a.concept]) conceptGroups[a.concept] = { correct: 0, total: 0 };
      conceptGroups[a.concept].total++;
      if (a.isCorrect) conceptGroups[a.concept].correct++;
    }

    await Promise.all(
      Object.entries(conceptGroups).map(async ([concept, { correct, total }]) => {
        const existing = await (prisma as any).conceptMastery.findUnique({
          where: { studentId_concept: { studentId: user.userId, concept } },
        });
        const newCorrect = (existing?.correctCount ?? 0) + correct;
        const newTotal = (existing?.totalCount ?? 0) + total;
        const masteryScore = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
        const isWeak = masteryScore < 70;

        await (prisma as any).conceptMastery.upsert({
          where: { studentId_concept: { studentId: user.userId, concept } },
          create: { studentId: user.userId, concept, masteryScore, isWeak, correctCount: newCorrect, totalCount: newTotal },
          update: { masteryScore, isWeak, correctCount: newCorrect, totalCount: newTotal },
        });
      })
    );

    // ── 7. Update TopicMastery (course-scoped, powers Mastery dashboard) ─────
    if (quiz.courseId) {
      await Promise.all(
        Object.entries(conceptGroups).map(async ([topic, { correct, total }]) => {
          const existing = await (prisma as any).topicMastery.findUnique({
            where: {
              studentId_courseId_topic: {
                studentId: user.userId,
                courseId: quiz.courseId,
                topic,
              },
            },
          });
          const newAttempts = (existing?.attempts ?? 0) + total;
          const newCorrect = (existing?.correct ?? 0) + correct;
          const topicScore = newAttempts > 0 ? (newCorrect / newAttempts) * 100 : 0;

          await (prisma as any).topicMastery.upsert({
            where: {
              studentId_courseId_topic: {
                studentId: user.userId,
                courseId: quiz.courseId,
                topic,
              },
            },
            create: {
              studentId: user.userId,
              courseId: quiz.courseId,
              topic,
              attempts: newAttempts,
              correct: newCorrect,
              score: topicScore,
            },
            update: {
              attempts: newAttempts,
              correct: newCorrect,
              score: topicScore,
            },
          });
        })
      );
    }

    // ── 8. Build detailed breakdowns for the response ─────────────────────────
    const correctQuestions = gradedAnswers
      .filter((a) => a.isCorrect)
      .map(({ questionId, question, selectedAnswer, concept }) => ({
        questionId,
        question,
        selectedAnswer,
        concept,
      }));

    const incorrectQuestions = gradedAnswers
      .filter((a) => !a.isCorrect)
      .map(({ questionId, question, selectedAnswer, correctAnswer, explanation, concept }) => ({
        questionId,
        question,
        selectedAnswer,
        correctAnswer,
        explanation,
        concept,
      }));

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        quizId,
        score,
        totalQuestions: quiz.questions.length,
        correctCount,
        incorrectCount: gradedAnswers.length - correctCount,
        correctQuestions,
        incorrectQuestions,
        weakConcepts,
      },
    });
  } catch (error: any) {
    console.error('[SubmitQuiz] Error:', error);
    const status =
      error.message?.includes('Authentication') ? 401 :
      error.message?.includes('permissions') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit quiz' },
      { status }
    );
  }
}
