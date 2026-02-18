import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { aiChatSchema } from '../utils/validators';
import { aiService } from '../services/ai.service';

/**
 * AI Chat endpoint
 * Delegates to the AI Microservice for RAG responses.
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const parsed = aiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const { sessionId, courseId, topicId, message, mode, isVoice } = parsed.data;
  const userId = req.user!.userId;

  // Get or create session
  let session;
  if (sessionId) {
    session = await prisma.aISession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      sendError(res, 'Session not found', 404);
      return;
    }
  } else {
    session = await prisma.aISession.create({
      data: {
        userId,
        courseId,
        topicId,
        mode: mode as any,
      },
    });
  }

  // Store student message
  await prisma.aIMessage.create({
    data: {
      sessionId: session.id,
      sender: 'student',
      messageText: message,
      responseType: 'explanation',
    },
  });

  // Determine response type based on mode and policy
  let responseType: 'explanation' | 'hint' | 'restricted' = 'explanation';
  const policy = await prisma.aIPolicySettings.findUnique({
    where: { institutionId: req.user!.institutionId },
  });

  if (policy?.hintModeOnly) {
    responseType = 'hint';
  }
  if (policy?.strictExamMode && mode === 'assessment') {
    responseType = 'restricted';
  }
  if (mode === 'assessment') {
    responseType = 'hint';
  }

  // Generate AI Response
  let aiResponseText = '';
  
  if (responseType === 'restricted') {
    aiResponseText = 'I cannot provide direct answers during active assessments. Please try to work through the problem step by step.';
  } else if (responseType === 'hint') {
    const hintData = await aiService.generateHint({
      query: message,
      topicId,
      courseId,
      strictMode: policy?.strictExamMode || false,
    });
    // The response structure from generateHint might vary, let's assume it returns a hint string or object
    const hint = hintData as { hint?: string; answer?: string } | string;
    aiResponseText = typeof hint === 'string' ? hint : (hint.hint || hint.answer || 'Here is a hint...');
  } else {
    // Standard learning mode (RAG)
    const ragResponse = await aiService.generateResponse({
      query: message,
      topicId,
      courseId,
      mode,
      studentLevel: 'beginner', // TODO: Fetch from mastery graph
      masteryScore: 0,
    });
    aiResponseText = ragResponse.answer;
  }

  // Store AI response
  await prisma.aIMessage.create({
    data: {
      sessionId: session.id,
      sender: 'ai',
      messageText: aiResponseText,
      responseType: responseType as any,
    },
  });

  // Log concept interaction
  await prisma.conceptInteraction.create({
    data: {
      userId,
      topicId,
      interactionType: 'doubt',
      correct: true, // Learning interactions always positive
      timeSpent: 0,
    },
  });

  sendSuccess(res, {
    sessionId: session.id,
    message: aiResponseText,
    responseType,
    audioUrl: isVoice ? null : undefined, // TODO: TTS integration
  });
});

/**
 * Get chat history for a session
 */
export const getSessionHistory = asyncHandler(async (req: Request, res: Response) => {
  const messages = await prisma.aIMessage.findMany({
    where: { sessionId: req.params.sessionId as string },
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, messages);
});

/**
 * Get all sessions for current user
 */
export const getMySessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await prisma.aISession.findMany({
    where: { userId: req.user!.userId },
    include: {
      topic: true,
      course: true,
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  sendSuccess(res, sessions);
});

/**
 * Get topic content for AI context
 */
export const getTopicContext = asyncHandler(async (req: Request, res: Response) => {
  const content = await prisma.curriculumContent.findMany({
    where: { topicId: req.params.topicId as string },
    select: {
      id: true,
      title: true,
      contentText: true,
      embeddingId: true,
    },
  });
  sendSuccess(res, content);
});

// Helper for MVP placeholder responses (Kept for reference or fallback if needed, though not used)
function generatePlaceholderResponse(
  question: string,
  responseType: string,
  mode: string
): string {
  if (responseType === 'restricted') {
    return 'I cannot provide direct answers during active assessments. Please try to work through the problem step by step. If you need help, try reviewing your course materials.';
  }

  if (responseType === 'hint') {
    return `Here's a hint to guide your thinking about "${question.substring(0, 50)}...": Consider reviewing the fundamental concepts related to this topic. Think about the key principles and how they connect to what you already know. [This is a placeholder - AI RAG service will provide curriculum-specific hints]`;
  }

  return `Great question! Let me explain based on your curriculum materials. [This is a placeholder response - the AI RAG service will provide a detailed, curriculum-bound explanation for: "${question.substring(0, 80)}..."]

Key points to consider:
1. Review the relevant topic materials
2. Connect this to prerequisite concepts
3. Practice with related exercises

[Full AI response will be generated by the RAG pipeline in production]`;
}
