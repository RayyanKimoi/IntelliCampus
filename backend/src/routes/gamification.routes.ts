import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '@intellicampus/shared';
import {
  getXPProfile,
  getLeaderboard,
  startBattle,
  answerBattle,
  getActiveBattle,
  getBattleHistory,
  startSprintQuiz,
  submitSprintAnswer,
  getFlashcards,
  addFlashcard,
  updateFlashcard,
  spinWheel,
} from '../controllers/gamification.controller';

const router = Router();

// All gamification routes require student auth
router.use(authenticate, authorize(UserRole.STUDENT));

// XP
router.get('/xp', getXPProfile);
router.get('/leaderboard', getLeaderboard);

// Boss Battle
router.post('/boss-battle/start', startBattle);
router.post('/boss-battle/answer', answerBattle);
router.get('/boss-battle/active', getActiveBattle);
router.get('/boss-battle/history', getBattleHistory);

// Sprint Quiz
router.post('/sprint/start', startSprintQuiz);
router.post('/sprint/answer', submitSprintAnswer);

// Flashcards
router.get('/flashcards/:topicId', getFlashcards);
router.post('/flashcards', addFlashcard);
router.put('/flashcards/:flashcardId', updateFlashcard);

// Spin the Wheel
router.post('/spin', spinWheel);

export default router;
