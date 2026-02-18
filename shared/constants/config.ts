// ========================
// App-wide Configuration Constants
// ========================

export const APP_CONFIG = {
  name: 'IntelliCampus',
  version: '0.1.0',
  description: 'Governed AI Academic Intelligence Platform',
} as const;

// Mastery thresholds
export const MASTERY = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  WEAK_THRESHOLD: 40,
  MODERATE_THRESHOLD: 70,
  STRONG_THRESHOLD: 90,
} as const;

// Gamification
export const GAMIFICATION = {
  XP_PER_CORRECT_ANSWER: 10,
  XP_PER_QUIZ_COMPLETE: 50,
  XP_PER_BOSS_BATTLE_WIN: 100,
  XP_PER_FLASHCARD_REVIEW: 5,
  XP_PER_STREAK_DAY: 25,
  XP_PER_SPIN: 15,
  BOSS_DEFAULT_HP: 100,
  PLAYER_DEFAULT_HP: 100,
  BOSS_DAMAGE_PER_CORRECT: 20,
  PLAYER_DAMAGE_PER_WRONG: 25,
  SPRINT_QUIZ_TIME_SECONDS: 45,
  SPRINT_QUIZ_QUESTIONS: 10,
  LEVEL_XP_MULTIPLIER: 100, // XP needed = level * multiplier
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_TYPES: ['application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.doc', '.docx'],
} as const;

// RAG / Embedding
export const RAG = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  TOP_K_RESULTS: 5,
  MIN_RELEVANCE_SCORE: 0.7,
} as const;
