import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';
import {
  chat,
  getSessionHistory,
  getMySessions,
  getTopicContext,
} from '../controllers/ai.controller';

const router = Router();

// All AI routes require auth
router.use(authenticate);

// Chat
router.post('/chat', aiLimiter, chat);

// Sessions
router.get('/sessions', getMySessions);
router.get('/sessions/:sessionId/history', getSessionHistory);

// Context (for AI pipeline)
router.get('/context/:topicId', getTopicContext);

export default router;
