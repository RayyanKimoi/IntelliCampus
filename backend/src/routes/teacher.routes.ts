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
  getAllAssignments,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  publishAssignment,
  getAssignments,
  getAssignmentResults,
  getAllSubmissions,
  gradeSubmission,
  getClassMastery,
  getStudentAnalytics,
  generateInsights,
  generateQuiz,
  getCohortAnalytics,
  getIntegrityFlags,
  exportReport,
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
router.get('/courses/:courseId/subjects', async (req, res) => {
  const { curriculumService } = await import('../services/curriculum.service');
  const { sendSuccess } = await import('../utils/helpers');
  const subjects = await curriculumService.getSubjects(req.params.courseId);
  sendSuccess(res, subjects);
});
router.post('/subjects', createSubject);
router.get('/subjects/:subjectId/topics', async (req, res) => {
  const { curriculumService } = await import('../services/curriculum.service');
  const { sendSuccess } = await import('../utils/helpers');
  const topics = await curriculumService.getTopics(req.params.subjectId);
  sendSuccess(res, topics);
});
router.post('/topics', createTopic);
router.post('/content', uploadContent);
router.get('/topics/:topicId/content', async (req, res) => {
  const { curriculumService } = await import('../services/curriculum.service');
  const { sendSuccess } = await import('../utils/helpers');
  const content = await curriculumService.getTopicContent(req.params.topicId);
  sendSuccess(res, content);
});

// Assignments
router.get('/assignments', getAllAssignments);
router.post('/assignments', createAssignment);
router.post('/assignments/:assignmentId/questions', addQuestion);
router.put('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);
router.post('/assignments/:assignmentId/publish', publishAssignment);
router.get('/courses/:courseId/assignments', getAssignments);
router.get('/assignments/:assignmentId/results', getAssignmentResults);

// AI Quiz
router.post('/quiz/generate', generateQuiz);

// Submissions & Grading
router.get('/submissions', getAllSubmissions);
router.post('/attempts/:attemptId/grade', gradeSubmission);

// Analytics
router.get('/courses/:courseId/mastery', getClassMastery);
router.get('/cohort', getCohortAnalytics);
router.get('/students/:studentId/analytics', getStudentAnalytics);
router.post('/courses/:courseId/insights', generateInsights);

// Integrity
router.get('/integrity', getIntegrityFlags);

// Reports
router.post('/report/export', exportReport);

export default router;
