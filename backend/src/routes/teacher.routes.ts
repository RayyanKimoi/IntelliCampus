import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { UserRole } from '@intellicampus/shared';
import {
  getTeacherDashboard,
  createCourse,
  getCourses,
  getCourseDetail,
  createSubject,
  createTopic,
  uploadContent,
  createAssignment,
  addQuestion,
  getAssignments,
  getAssignmentResults,
  getClassMastery,
  getStudentAnalytics,
  generateInsights,
} from '../controllers/teacher.controller';

const router = Router();

// All routes require teacher auth
router.use(authenticate, authorize(UserRole.TEACHER));

// Dashboard
router.get('/dashboard', getTeacherDashboard);

// Curriculum
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.get('/courses/:courseId', getCourseDetail);
router.post('/subjects', createSubject);
router.post('/topics', createTopic);
router.post('/content', uploadContent);

// Assignments
router.post('/assignments', createAssignment);
router.post('/questions', addQuestion);
router.get('/courses/:courseId/assignments', getAssignments);
router.get('/assignments/:assignmentId/results', getAssignmentResults);

// Analytics
router.get('/courses/:courseId/mastery', getClassMastery);
router.get('/students/:studentId/analytics', getStudentAnalytics);
router.post('/courses/:courseId/insights', generateInsights);

export default router;
