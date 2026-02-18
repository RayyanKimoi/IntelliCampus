import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export class AssessmentService {
  /**
   * Create an assignment
   */
  async createAssignment(data: {
    courseId: string;
    teacherId: string;
    title: string;
    description?: string;
    dueDate: string;
    strictMode?: boolean;
  }) {
    const assignment = await prisma.assignment.create({
      data: {
        courseId: data.courseId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description || '',
        dueDate: new Date(data.dueDate),
        strictMode: data.strictMode || false,
      },
    });
    logger.info('AssessmentService', `Assignment created: ${assignment.title}`);
    return assignment;
  }

  /**
   * Get assignments for a course
   */
  async getCourseAssignments(courseId: string) {
    return prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            questions: true,
            studentAttempts: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get assignment with questions
   */
  async getAssignmentById(assignmentId: string) {
    return prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        questions: true,
        _count: {
          select: { studentAttempts: true },
        },
      },
    });
  }

  /**
   * Add a question to an assignment
   */
  async addQuestion(data: {
    assignmentId?: string;
    topicId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    difficultyLevel?: string;
  }) {
    return prisma.question.create({
      data: {
        assignmentId: data.assignmentId,
        topicId: data.topicId,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        difficultyLevel: data.difficultyLevel || 'beginner',
      },
    });
  }

  /**
   * Start an assignment attempt
   */
  async startAttempt(assignmentId: string, studentId: string) {
    // Check if already has an active attempt
    const existing = await prisma.studentAttempt.findFirst({
      where: {
        assignmentId,
        studentId,
        submittedAt: null,
      },
    });

    if (existing) return existing;

    return prisma.studentAttempt.create({
      data: {
        assignmentId,
        studentId,
      },
    });
  }

  /**
   * Submit an answer for an attempt
   */
  async submitAnswer(data: {
    attemptId: string;
    questionId: string;
    selectedOption: string;
    timeTaken: number;
  }) {
    // Get the question to check correctness
    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
    });

    if (!question) throw new Error('Question not found');

    const isCorrect = data.selectedOption === question.correctOption;

    return prisma.studentAnswer.create({
      data: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        selectedOption: data.selectedOption,
        isCorrect,
        timeTaken: data.timeTaken,
      },
    });
  }

  /**
   * Submit/complete an attempt
   */
  async submitAttempt(attemptId: string) {
    // Calculate score
    const answers = await prisma.studentAnswer.findMany({
      where: { attemptId },
    });

    const totalQuestions = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const attempt = await prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        submittedAt: new Date(),
      },
      include: {
        studentAnswers: {
          include: { question: true },
        },
      },
    });

    logger.info('AssessmentService', `Attempt submitted: ${attemptId}, Score: ${score}`);
    return attempt;
  }

  /**
   * Get student's attempts for an assignment
   */
  async getStudentAttempts(assignmentId: string, studentId: string) {
    return prisma.studentAttempt.findMany({
      where: { assignmentId, studentId },
      include: {
        studentAnswers: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get all student results for an assignment (teacher view)
   */
  async getAssignmentResults(assignmentId: string) {
    return prisma.studentAttempt.findMany({
      where: {
        assignmentId,
        submittedAt: { not: null },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });
  }

  /**
   * Get questions by topic (for quizzes, gamification)
   */
  async getQuestionsByTopic(topicId: string, limit = 10) {
    return prisma.question.findMany({
      where: { topicId },
      take: limit,
      orderBy: { difficultyLevel: 'asc' },
    });
  }

  /**
   * Get student assignments with due dates
   */
  async getStudentAssignments(studentId: string) {
    // Get courses the student might be enrolled in
    // For now, return all assignments (enrollment system to be built)
    return prisma.assignment.findMany({
      include: {
        course: true,
        _count: {
          select: { questions: true },
        },
        studentAttempts: {
          where: { studentId },
          select: {
            id: true,
            score: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}

export const assessmentService = new AssessmentService();
