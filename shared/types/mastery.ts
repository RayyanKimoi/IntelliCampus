// ========================
// Mastery & Analytics Types
// ========================

export interface MasteryGraph {
  id: string;
  userId: string;
  topicId: string;
  masteryScore: number; // 0-100
  confidenceScore: number;
  attemptsCount: number;
  correctCount: number;
  lastUpdated: Date;
}

export interface PerformanceLog {
  id: string;
  userId: string;
  topicId: string;
  activityType: ActivityType;
  score: number;
  accuracy: number;
  timeSpent: number;
  createdAt: Date;
}

export interface WeakTopicFlag {
  id: string;
  userId: string;
  topicId: string;
  weaknessScore: number;
  detectedAt: Date;
}

export interface TeacherInsight {
  id: string;
  teacherId: string;
  courseId: string;
  topicId: string;
  avgMastery: number;
  weakStudentCount: number;
  generatedAt: Date;
}

export interface ConceptInteraction {
  id: string;
  userId: string;
  topicId: string;
  interactionType: InteractionType;
  correct: boolean;
  timeSpent: number;
  createdAt: Date;
}

export enum ActivityType {
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  BOSS_BATTLE = 'boss_battle',
  FLASHCARD = 'flashcard',
  PRACTICE = 'practice',
  AI_LEARNING = 'ai_learning',
}

export enum InteractionType {
  DOUBT = 'doubt',
  QUIZ = 'quiz',
  FLASHCARD = 'flashcard',
  BOSS_BATTLE = 'boss_battle',
}
