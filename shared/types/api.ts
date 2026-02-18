// ========================
// API Types
// ========================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// AI Chat types
export enum AIMode {
  LEARNING = 'learning',
  ASSESSMENT = 'assessment',
  PRACTICE = 'practice',
}

export enum MessageSender {
  STUDENT = 'student',
  AI = 'ai',
}

export enum ResponseType {
  EXPLANATION = 'explanation',
  HINT = 'hint',
  RESTRICTED = 'restricted',
}

export interface AISession {
  id: string;
  userId: string;
  courseId: string;
  topicId: string;
  mode: AIMode;
  createdAt: Date;
}

export interface AIMessage {
  id: string;
  sessionId: string;
  sender: MessageSender;
  messageText: string;
  responseType: ResponseType;
  createdAt: Date;
}

export interface AIChatRequest {
  sessionId?: string;
  courseId: string;
  topicId: string;
  message: string;
  mode: AIMode;
  isVoice?: boolean;
}

export interface AIChatResponse {
  sessionId: string;
  message: string;
  responseType: ResponseType;
  audioUrl?: string;
}

// Assessment types
export interface Assignment {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: Date;
  strictMode: boolean;
  createdAt: Date;
}

export interface Question {
  id: string;
  assignmentId?: string;
  topicId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficultyLevel: string;
}

export interface StudentAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  startedAt: Date;
  submittedAt?: Date;
  integrityFlag: boolean;
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  timeTaken: number;
}

// Governance types
export interface AIPolicySettings {
  id: string;
  institutionId: string;
  hintModeOnly: boolean;
  strictExamMode: boolean;
  maxTokens: number;
  updatedAt: Date;
}

export interface SystemUsageLog {
  id: string;
  userId: string;
  actionType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
