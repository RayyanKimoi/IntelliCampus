"use strict";
// ========================
// App-wide Configuration Constants
// ========================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAG = exports.UPLOAD = exports.PAGINATION = exports.GAMIFICATION = exports.MASTERY = exports.APP_CONFIG = void 0;
exports.APP_CONFIG = {
    name: 'IntelliCampus',
    version: '0.1.0',
    description: 'Governed AI Academic Intelligence Platform',
};
// Mastery thresholds
exports.MASTERY = {
    MIN_SCORE: 0,
    MAX_SCORE: 100,
    WEAK_THRESHOLD: 40,
    MODERATE_THRESHOLD: 70,
    STRONG_THRESHOLD: 90,
};
// Gamification
exports.GAMIFICATION = {
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
};
// Pagination
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// File upload
exports.UPLOAD = {
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_TYPES: ['application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.doc', '.docx'],
};
// RAG / Embedding
exports.RAG = {
    CHUNK_SIZE: 1000,
    CHUNK_OVERLAP: 200,
    TOP_K_RESULTS: 5,
    MIN_RELEVANCE_SCORE: 0.7,
};
//# sourceMappingURL=config.js.map