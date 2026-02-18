import { Request, Response } from 'express';
import { curriculumService } from '../services/curriculum.service';
import { assessmentService } from '../services/assessment.service';
import { analyticsService } from '../services/analytics.service';
import { masteryService } from '../services/mastery.service';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import {
  createCourseSchema,
  createSubjectSchema,
  createTopicSchema,
  createAssignmentSchema,
  createQuestionSchema,
} from '../utils/validators';

// ========================
// Dashboard
// ========================

export const getTeacherDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await analyticsService.getTeacherDashboard(req.user!.userId);
  sendSuccess(res, dashboard);
});

// ========================
// Curriculum Management
// ========================

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const course = await curriculumService.createCourse({
    ...parsed.data,
    createdBy: req.user!.userId,
    institutionId: req.user!.institutionId,
  });
  sendSuccess(res, course, 'Course created', 201);
});

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

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const subject = await curriculumService.createSubject(parsed.data);
  sendSuccess(res, subject, 'Subject created', 201);
});

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTopicSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const topic = await curriculumService.createTopic(parsed.data);
  sendSuccess(res, topic, 'Topic created', 201);
});

export const uploadContent = asyncHandler(async (req: Request, res: Response) => {
  const content = await curriculumService.uploadContent({
    topicId: req.body.topicId,
    uploadedBy: req.user!.userId,
    title: req.body.title,
    contentText: req.body.contentText,
    fileUrl: req.body.fileUrl,
  });
  sendSuccess(res, content, 'Content uploaded', 201);
});

// ========================
// Assignments
// ========================

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const assignment = await assessmentService.createAssignment({
    ...parsed.data,
    teacherId: req.user!.userId,
  });
  sendSuccess(res, assignment, 'Assignment created', 201);
});

export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 400);
    return;
  }

  const question = await assessmentService.addQuestion(parsed.data);
  sendSuccess(res, question, 'Question added', 201);
});

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assessmentService.getCourseAssignments(req.params.courseId as string);
  sendSuccess(res, assignments);
});

export const getAssignmentResults = asyncHandler(async (req: Request, res: Response) => {
  const results = await assessmentService.getAssignmentResults(req.params.assignmentId as string);
  sendSuccess(res, results);
});

// ========================
// Analytics
// ========================

export const getClassMastery = asyncHandler(async (req: Request, res: Response) => {
  const mastery = await masteryService.getClassMastery(req.params.courseId as string);
  sendSuccess(res, mastery);
});

export const getStudentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await analyticsService.getStudentAnalyticsForTeacher(
    req.params.studentId as string
  );
  sendSuccess(res, analytics);
});

export const generateInsights = asyncHandler(async (req: Request, res: Response) => {
  const insights = await analyticsService.generateTeacherInsights(
    req.user!.userId,
    req.params.courseId as string
  );
  sendSuccess(res, insights, 'Insights generated');
});
