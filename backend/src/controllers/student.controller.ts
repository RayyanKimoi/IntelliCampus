import { Request, Response } from 'express';
import { curriculumService } from '../services/curriculum.service';
import { masteryService } from '../services/mastery.service';
import { assessmentService } from '../services/assessment.service';
import { analyticsService } from '../services/analytics.service';
import { accessibilityService } from '../services/accessibility.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';

// ========================
// Dashboard
// ========================

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const dashboard = await analyticsService.getStudentDashboard(userId);
  sendSuccess(res, dashboard);
});

// ========================
// Courses & Curriculum
// ========================

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await curriculumService.getCourses(req.user!.institutionId);
  sendSuccess(res, courses);
});

export const getCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  const course = await curriculumService.getCourseById(req.params.courseId as string);
  if (!course) {
    sendError(res, 'Course not found', 404);
    return;
  }
  sendSuccess(res, course);
});

export const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await curriculumService.getSubjects(req.params.courseId as string);
  sendSuccess(res, subjects);
});

export const getTopics = asyncHandler(async (req: Request, res: Response) => {
  const topics = await curriculumService.getTopics(req.params.subjectId as string);
  sendSuccess(res, topics);
});

// ========================
// Mastery
// ========================

export const getMyMastery = asyncHandler(async (req: Request, res: Response) => {
  const mastery = await masteryService.getStudentMastery(req.user!.userId);

  const byTopic = mastery.map((m: any) => ({
    topicId: m.topicId,
    topicName: m.topic?.name || 'Unknown Topic',
    subjectName: m.topic?.subject?.name || 'Unknown Subject',
    courseName: m.topic?.subject?.course?.name || 'Unknown Course',
    masteryLevel: Math.round(m.masteryScore * 100) / 100,
    lastAssessed: m.lastUpdated,
  }));

  const overallMastery = byTopic.length > 0
    ? byTopic.reduce((sum: number, t: any) => sum + t.masteryLevel, 0) / byTopic.length
    : 0;

  const weakTopics = byTopic.filter((t: any) => t.masteryLevel < 50);

  sendSuccess(res, { overallMastery, byTopic, weakTopics });
});

export const getCourseMastery = asyncHandler(async (req: Request, res: Response) => {
  const mastery = await masteryService.getCourseMastery(
    req.user!.userId,
    req.params.courseId as string
  );
  sendSuccess(res, mastery);
});

export const getWeakTopics = asyncHandler(async (req: Request, res: Response) => {
  const weakTopics = await masteryService.getWeakTopics(req.user!.userId);
  sendSuccess(res, weakTopics);
});

// ========================
// Assignments
// ========================

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assessmentService.getStudentAssignments(req.user!.userId);
  sendSuccess(res, assignments);
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assessmentService.getAssignmentById(req.params.assignmentId as string);
  if (!assignment) {
    sendError(res, 'Assignment not found', 404);
    return;
  }
  sendSuccess(res, assignment);
});

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await assessmentService.startAttempt(
    req.params.assignmentId as string,
    req.user!.userId
  );
  sendSuccess(res, attempt, 'Attempt started', 201);
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const answer = await assessmentService.submitAnswer({
    attemptId: req.params.attemptId as string,
    questionId: req.body.questionId,
    selectedOption: req.body.selectedOption,
    timeTaken: req.body.timeTaken || 0,
  });
  sendSuccess(res, answer);
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const result = await assessmentService.submitAttempt(req.params.attemptId as string);
  sendSuccess(res, result, 'Assignment submitted');
});

// ========================
// Performance / Insights
// ========================

export const getPerformanceTrend = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const trend = await analyticsService.getPerformanceTrend(req.user!.userId, days);
  sendSuccess(res, trend);
});

// ========================
// Accessibility
// ========================

export const getAccessibility = asyncHandler(async (req: Request, res: Response) => {
  const settings = await accessibilityService.getSettings(req.user!.userId);
  sendSuccess(res, settings);
});

export const updateAccessibility = asyncHandler(async (req: Request, res: Response) => {
  const settings = await accessibilityService.updateSettings(
    req.user!.userId,
    req.body
  );
  sendSuccess(res, settings, 'Accessibility settings updated');
});
