import { Request, Response } from 'express';
import { gamificationService } from '../services/gamification.service';
import { assessmentService } from '../services/assessment.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import {
  startBossBattleSchema,
  answerBattleSchema,
  submitSprintAnswerSchema,
} from '../utils/validators';

// ========================
// XP & Profile
// ========================

export const getXPProfile = asyncHandler(async (req: Request, res: Response) => {
  const xp = await gamificationService.getStudentXP(req.user!.userId);
  sendSuccess(res, xp);
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = await gamificationService.getLeaderboard(limit);
  sendSuccess(res, leaderboard);
});

// ========================
// Boss Battle
// ========================

export const startBattle = asyncHandler(async (req: Request, res: Response) => {
  const parsed = startBossBattleSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  try {
    const battle = await gamificationService.startBossBattle(
      req.user!.userId,
      parsed.data.topicId
    );

    // Get questions for the battle
    const questions = await assessmentService.getQuestionsByTopic(
      parsed.data.topicId,
      10
    );

    sendSuccess(res, { battle, questions }, 'Boss battle started!', 201);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const answerBattle = asyncHandler(async (req: Request, res: Response) => {
  const parsed = answerBattleSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  // Check if answer is correct
  const question = await assessmentService.getQuestionsByTopic(parsed.data.questionId, 1);
  // For now, we need to look up the question differently
  const { prisma } = await import('../config/db');
  const questionData = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  });

  if (!questionData) {
    sendError(res, 'Question not found', 404);
    return;
  }

  const isCorrect = parsed.data.selectedOption === questionData.correctOption;

  try {
    const result = await gamificationService.processBattleAnswer(
      parsed.data.battleId,
      req.user!.userId,
      isCorrect,
      questionData.topicId
    );

    sendSuccess(res, {
      ...result,
      isCorrect,
      correctOption: questionData.correctOption,
    });
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});

export const getActiveBattle = asyncHandler(async (req: Request, res: Response) => {
  const battle = await gamificationService.getActiveBattle(req.user!.userId);
  sendSuccess(res, battle);
});

export const getBattleHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await gamificationService.getBattleHistory(req.user!.userId);
  sendSuccess(res, history);
});

// ========================
// Sprint Quiz
// ========================

export const startSprintQuiz = asyncHandler(async (req: Request, res: Response) => {
  const topicId = req.body.topicId;
  if (!topicId) {
    sendError(res, 'topicId is required', 400);
    return;
  }

  const questions = await assessmentService.getQuestionsByTopic(topicId, 10);

  if (questions.length === 0) {
    sendError(res, 'No questions available for this topic', 404);
    return;
  }

  // Strip correct answers for client
  const clientQuestions = questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    difficultyLevel: q.difficultyLevel,
  }));

  sendSuccess(res, {
    questions: clientQuestions,
    totalQuestions: clientQuestions.length,
    timeLimitSeconds: 45,
  });
});

export const submitSprintAnswer = asyncHandler(async (req: Request, res: Response) => {
  const parsed = submitSprintAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const { prisma } = await import('../config/db');
  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  });

  if (!question) {
    sendError(res, 'Question not found', 404);
    return;
  }

  const isCorrect = parsed.data.selectedOption === question.correctOption;

  if (isCorrect) {
    await gamificationService.awardXP(
      req.user!.userId,
      'quiz',
      10
    );
  }

  // Update mastery
  const { masteryService } = await import('../services/mastery.service');
  await masteryService.updateMastery(
    req.user!.userId,
    question.topicId,
    isCorrect,
    parsed.data.timeTaken
  );

  sendSuccess(res, {
    isCorrect,
    correctOption: question.correctOption,
    xpAwarded: isCorrect ? 10 : 0,
  });
});

// ========================
// Flashcards
// ========================

export const getFlashcards = asyncHandler(async (req: Request, res: Response) => {
  const cards = await gamificationService.getFlashcards(
    req.user!.userId,
    req.params.topicId as string
  );
  sendSuccess(res, cards);
});

export const addFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const card = await gamificationService.addFlashcard(
    req.user!.userId,
    req.body.topicId,
    req.body.cardText
  );
  sendSuccess(res, card, 'Flashcard added', 201);
});

export const updateFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const card = await gamificationService.updateFlashcard(
    req.params.flashcardId as string,
    req.body.known
  );

  if (req.body.known) {
    await gamificationService.awardXP(req.user!.userId, 'flashcard', 5);
  }

  sendSuccess(res, card);
});

// ========================
// Spin the Wheel
// ========================

export const spinWheel = asyncHandler(async (req: Request, res: Response) => {
  try {
    const reward = await gamificationService.spinWheel(req.user!.userId);
    sendSuccess(res, reward, 'Wheel spun!');
  } catch (error: any) {
    sendError(res, error.message, 429);
  }
});
