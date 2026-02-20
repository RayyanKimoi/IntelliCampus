import { Request, Response } from 'express';
import { curriculumService } from '../services/curriculum.service';
import { assessmentService } from '../services/assessment.service';
import { analyticsService } from '../services/analytics.service';
import { masteryService } from '../services/mastery.service';
import { prisma } from '../config/db';
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
  if (!parsed.success) { sendError(res, parsed.error.errors[0].message, 400); return; }
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
  if (!course) { sendError(res, 'Course not found', 404); return; }
  sendSuccess(res, course);
});

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSubjectSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0].message, 400); return; }
  const subject = await curriculumService.createSubject(parsed.data);
  sendSuccess(res, subject, 'Subject created', 201);
});

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTopicSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0].message, 400); return; }
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

export const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
  const courses = await curriculumService.getCourses(req.user!.institutionId);
  const allAssignments = await Promise.all(
    courses.map((c: any) => assessmentService.getCourseAssignments(c.id).catch(() => []))
  );
  sendSuccess(res, allAssignments.flat());
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0].message, 400); return; }
  const assignment = await assessmentService.createAssignment({
    ...parsed.data,
    teacherId: req.user!.userId,
  });
  sendSuccess(res, assignment, 'Assignment created', 201);
});

export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, parsed.error.errors[0].message, 400); return; }
  const question = await assessmentService.addQuestion(parsed.data);
  sendSuccess(res, question, 'Question added', 201);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await prisma.question.update({
    where: { id: req.params.questionId },
    data: req.body,
  });
  sendSuccess(res, question, 'Question updated');
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  await prisma.question.delete({ where: { id: req.params.questionId } });
  sendSuccess(res, null, 'Question deleted');
});

export const publishAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await prisma.assignment.update({
    where: { id: req.params.assignmentId },
    data: { isPublished: true },
  });
  sendSuccess(res, assignment, 'Assignment published');
});

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assessmentService.getCourseAssignments(req.params.courseId as string);
  sendSuccess(res, assignments);
});

export const getAssignmentResults = asyncHandler(async (req: Request, res: Response) => {
  const results = await assessmentService.getAssignmentResults(req.params.assignmentId as string);
  sendSuccess(res, results);
});

export const getAllSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const courses = await curriculumService.getCourses(req.user!.institutionId);
  const courseIds = courses.map((c: any) => c.id);
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true },
  });
  const assignmentIds = assignments.map((a: any) => a.id);
  const attempts = await prisma.studentAttempt.findMany({
    where: { assignmentId: { in: assignmentIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, courseId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  sendSuccess(res, attempts);
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { score, comment } = req.body;
  const attempt = await prisma.studentAttempt.update({
    where: { id: req.params.attemptId },
    data: { score, teacherComment: comment, gradedAt: new Date() },
  });
  sendSuccess(res, attempt, 'Graded successfully');
});

// ========================
// AI Quiz Generation
// ========================

export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { title, dueDate, courseId, topicId, difficulty, numberOfQuestions } = req.body;
  if (!title || !courseId || !numberOfQuestions) {
    sendError(res, 'title, courseId and numberOfQuestions are required', 400);
    return;
  }
  // Create assignment shell
  const assignment = await assessmentService.createAssignment({
    title,
    description: `AI-generated quiz — ${difficulty ?? 'medium'} difficulty`,
    dueDate: dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    courseId,
    topicId,
    teacherId: req.user!.userId,
    strictMode: true,
    type: 'quiz',
  } as any);
  // Generate questions via RAG/AI pipeline
  let questions: any[] = [];
  try {
    const { ragService } = await import('../services/rag.service').catch(() => ({ ragService: null })) as any;
    if (ragService?.generateQuizQuestions) {
      questions = await ragService.generateQuizQuestions(
        topicId,
        numberOfQuestions,
        difficulty ?? 'medium',
      );
    }
  } catch { /* AI unavailable — return empty Q list for manual edit */ }
  sendSuccess(res, { assignment, questions }, 'Quiz created', 201);
});

// ========================
// Analytics
// ========================

export const getClassMastery = asyncHandler(async (req: Request, res: Response) => {
  const mastery = await masteryService.getClassMastery(req.params.courseId as string);
  sendSuccess(res, mastery);
});

export const getCohortAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const courses = await curriculumService.getCourses(req.user!.institutionId);
  const courseIds = courses.map((c: any) => c.id);
  const [masteryData, topicAccuracy, studentXP] = await Promise.all([
    prisma.masteryGraph.groupBy({
      by: ['topicId'],
      where: { topic: { subject: { courseId: { in: courseIds } } } },
      _avg: { masteryScore: true },
      _count: { userId: true },
    }),
    prisma.performanceLog.groupBy({
      by: ['topicId'],
      where: { topic: { subject: { courseId: { in: courseIds } } } },
      _avg: { score: true },
      _count: { id: true },
    }),
    prisma.studentXP.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { totalXp: 'desc' },
      take: 50,
    }),
  ]);
  // Attach topic names
  const topicIds = masteryData.map((m: any) => m.topicId);
  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds } },
    select: { id: true, name: true },
  });
  const topicMap = Object.fromEntries(topics.map((t: any) => [t.id, t.name]));
  sendSuccess(res, {
    masteryByTopic: masteryData.map((m: any) => ({
      topicId: m.topicId,
      topicName: topicMap[m.topicId] ?? m.topicId,
      avgMastery: Math.round((m._avg.masteryScore ?? 0) * 10) / 10,
      studentCount: m._count.userId,
    })),
    topicAccuracy: topicAccuracy.map((t: any) => ({
      topicId: t.topicId,
      topicName: topicMap[t.topicId] ?? t.topicId,
      avgScore: Math.round((t._avg.score ?? 0) * 10) / 10,
      attempts: t._count.id,
    })),
    studentRanking: studentXP.map((x: any, i: number) => ({
      rank: i + 1,
      userId: x.userId,
      name: x.user?.name ?? 'Student',
      totalXP: x.totalXp,
      level: x.level,
    })),
  });
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

// ========================
// Integrity & Monitoring
// ========================

export const getIntegrityFlags = asyncHandler(async (req: Request, res: Response) => {
  const courses = await curriculumService.getCourses(req.user!.institutionId);
  const courseIds = courses.map((c: any) => c.id);
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, title: true },
  });
  const assignmentIds = assignments.map((a: any) => a.id);
  const assignmentMap = Object.fromEntries(assignments.map((a: any) => [a.id, a.title]));
  // Flag attempts with very low time-per-question (rapid guessing)
  const suspiciousAttempts = await prisma.studentAttempt.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      completedAt: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      answers: { select: { timeTaken: true, isCorrect: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const flagged = suspiciousAttempts
    .map((attempt: any) => {
      const answers = attempt.answers ?? [];
      const totalTime = answers.reduce((s: number, a: any) => s + (a.timeTaken ?? 60), 0);
      const avgTimeSec = answers.length > 0 ? totalTime / answers.length : 999;
      const correctRate = answers.length > 0
        ? answers.filter((a: any) => a.isCorrect).length / answers.length
        : 0;
      const isRapid = avgTimeSec < 5 && answers.length > 3;
      const isAnomaly = correctRate > 0.95 && avgTimeSec < 8 && answers.length > 5;
      if (!isRapid && !isAnomaly) return null;
      return {
        attemptId: attempt.id,
        userId: attempt.userId,
        userName: attempt.user?.name ?? 'Unknown',
        userEmail: attempt.user?.email ?? '',
        assignmentId: attempt.assignmentId,
        assignmentTitle: assignmentMap[attempt.assignmentId] ?? 'Unknown',
        avgTimeSec: Math.round(avgTimeSec),
        correctRate: Math.round(correctRate * 100),
        totalQuestions: answers.length,
        flags: [
          ...(isRapid ? ['rapid_guessing'] : []),
          ...(isAnomaly ? ['high_anomaly'] : []),
        ],
        createdAt: attempt.createdAt,
      };
    })
    .filter(Boolean);
  sendSuccess(res, flagged);
});

// ========================
// Reports & Export
// ========================

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const assignments = await prisma.assignment.findMany({
    where: courseId ? { courseId } : {},
    include: {
      course: { select: { name: true } },
      attempts: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  const rows: string[] = ['Student,Email,Assignment,Course,Score,TotalPoints,Status,SubmittedAt'];
  for (const a of assignments) {
    for (const attempt of (a.attempts ?? [])) {
      rows.push([
        attempt.user?.name ?? '', attempt.user?.email ?? '',
        a.title, (a as any).course?.name ?? '',
        attempt.score ?? '', a.totalPoints ?? '',
        attempt.completedAt ? 'submitted' : 'in_progress',
        attempt.completedAt ? new Date(attempt.completedAt).toISOString() : '',
      ].map(String).join(','));
    }
  }
  const csv = rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=intellicampus-report.csv');
  res.send(csv);
});

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
