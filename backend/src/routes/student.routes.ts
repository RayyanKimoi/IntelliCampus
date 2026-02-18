import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '@intellicampus/shared';
import {
  getDashboard,
  getCourses,
  getCourseDetail,
  getSubjects,
  getTopics,
  getMyMastery,
  getCourseMastery,
  getWeakTopics,
  getAssignments,
  getAssignment,
  startAttempt,
  submitAnswer,
  submitAttempt,
  getPerformanceTrend,
  getAccessibility,
  updateAccessibility,
} from '../controllers/student.controller';

const router = Router();

// All routes require student auth
router.use(authenticate, authorize(UserRole.STUDENT));

// Dashboard
router.get('/dashboard', getDashboard);

// Courses
router.get('/courses', getCourses);
router.get('/courses/:courseId', getCourseDetail);
router.get('/courses/:courseId/subjects', getSubjects);
router.get('/subjects/:subjectId/topics', getTopics);

// Mastery
router.get('/mastery', getMyMastery);
router.get('/mastery/course/:courseId', getCourseMastery);
router.get('/mastery/weak-topics', getWeakTopics);

// Assignments
router.get('/assignments', getAssignments);
router.get('/assignments/:assignmentId', getAssignment);
router.post('/assignments/:assignmentId/attempt', startAttempt);
router.post('/attempts/:attemptId/answer', submitAnswer);
router.post('/attempts/:attemptId/submit', submitAttempt);

// Insights
router.get('/performance/trend', getPerformanceTrend);

// Accessibility
router.get('/accessibility', getAccessibility);
router.put('/accessibility', updateAccessibility);

export default router;
