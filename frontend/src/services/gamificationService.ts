import { api } from './apiClient';

export const gamificationService = {
  // XP
  getXPProfile: () => api.get('/gamification/xp'),
  getLeaderboard: (limit = 10) => api.get(`/gamification/leaderboard?limit=${limit}`),

  // Boss Battle
  startBossBattle: (topicId: string) =>
    api.post('/gamification/boss-battle/start', { topicId }),
  answerBattle: (data: {
    battleId: string;
    questionId: string;
    selectedOption: string;
  }) => api.post('/gamification/boss-battle/answer', data),
  getActiveBattle: () => api.get('/gamification/boss-battle/active'),
  getBattleHistory: () => api.get('/gamification/boss-battle/history'),

  // Sprint Quiz
  startSprintQuiz: (topicId: string) =>
    api.post('/gamification/sprint/start', { topicId }),
  submitSprintAnswer: (data: {
    questionId: string;
    selectedOption: string;
    timeTaken: number;
  }) => api.post('/gamification/sprint/answer', data),

  // Flashcards
  getFlashcards: (topicId: string) =>
    api.get(`/gamification/flashcards/${topicId}`),
  addFlashcard: (topicId: string, cardText: string) =>
    api.post('/gamification/flashcards', { topicId, cardText }),
  updateFlashcard: (flashcardId: string, known: boolean) =>
    api.put(`/gamification/flashcards/${flashcardId}`, { known }),

  // Spin the Wheel
  spinWheel: () => api.post('/gamification/spin'),
};
