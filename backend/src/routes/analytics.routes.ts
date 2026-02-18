import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getStudentPerformance,
  getPerformanceTrend,
  logUsage,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

// Student performance
router.get('/student/:studentId', getStudentPerformance);
router.get('/student/:studentId/trend', getPerformanceTrend);

// Own performance
router.get('/me', getStudentPerformance);
router.get('/me/trend', getPerformanceTrend);

// Usage logging
router.post('/log', logUsage);

export default router;
