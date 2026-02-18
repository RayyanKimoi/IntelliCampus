import { z } from 'zod';

// ========================
// Auth Validators
// ========================

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['student', 'teacher', 'admin']),
  institutionId: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ========================
// Course Validators
// ========================

export const createCourseSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
});

export const createSubjectSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
});

export const createTopicSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ========================
// Assignment Validators
// ========================

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2).max(300),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime(),
  strictMode: z.boolean().optional(),
});

export const createQuestionSchema = z.object({
  assignmentId: z.string().optional(),
  topicId: z.string().min(1),
  questionText: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

// ========================
// AI Chat Validators
// ========================

export const aiChatSchema = z.object({
  sessionId: z.string().optional(),
  courseId: z.string().min(1),
  topicId: z.string().min(1),
  message: z.string().min(1).max(5000),
  mode: z.enum(['learning', 'assessment', 'practice']),
  isVoice: z.boolean().optional(),
});

// ========================
// Gamification Validators
// ========================

export const startBossBattleSchema = z.object({
  topicId: z.string().min(1),
});

export const answerBattleSchema = z.object({
  battleId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.enum(['A', 'B', 'C', 'D']),
});

export const submitSprintAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(['A', 'B', 'C', 'D']),
  timeTaken: z.number().int().min(0),
});

// ========================
// Pagination Validator
// ========================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ========================
// Admin Validators
// ========================

export const updateAIPolicySchema = z.object({
  hintModeOnly: z.boolean().optional(),
  strictExamMode: z.boolean().optional(),
  maxTokens: z.number().int().min(128).max(4096).optional(),
});

export const updateAccessibilitySchema = z.object({
  adhdMode: z.boolean().optional(),
  dyslexiaFont: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  speechEnabled: z.boolean().optional(),
  focusMode: z.boolean().optional(),
  fontScale: z.number().min(0.5).max(3.0).optional(),
});
