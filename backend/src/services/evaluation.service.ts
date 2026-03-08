import { prisma } from '../config/db';

export class EvaluationService {
  /**
   * Return all students enrolled in a course, enriched with mastery and
   * best assignment score from StudentAttempt, plus any existing evaluation.
   */
  async getCourseStudents(courseId: string) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            masteryGraphs: {
              include: {
                topic: {
                  include: {
                    subject: { select: { courseId: true } },
                  },
                },
              },
            },
            studentAttempts: {
              where: {
                assignment: { courseId },
                submittedAt: { not: null },
              },
              select: { score: true },
              orderBy: { score: 'desc' },
            },
          },
        },
      },
    });

    // Pull existing evaluations for this course in one query
    const evaluations = await prisma.studentEvaluation.findMany({
      where: { courseId },
    });
    const evalMap = new Map(evaluations.map((e) => [e.studentId, e]));

    return enrollments.map(({ student }) => {
      // Average mastery across topics that belong to this course
      const relevantMastery = student.masteryGraphs.filter(
        (m) => m.topic.subject.courseId === courseId
      );
      const avgMastery =
        relevantMastery.length > 0
          ? relevantMastery.reduce((sum, m) => sum + m.masteryScore, 0) /
            relevantMastery.length
          : null;

      // Highest assignment score in this course
      const bestAttemptScore =
        student.studentAttempts.length > 0
          ? student.studentAttempts[0].score
          : null;

      const evaluation = evalMap.get(student.id);

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        masteryScore: avgMastery !== null ? Math.round(avgMastery * 10) / 10 : null,
        assignmentScore: bestAttemptScore,
        evaluationScore: evaluation?.score ?? null,
        feedback: evaluation?.feedback ?? null,
        gradedAt: evaluation?.gradedAt ?? null,
      };
    });
  }

  /**
   * Upsert a teacher evaluation for a student in a course.
   */
  async saveEvaluation(data: {
    studentId: string;
    courseId: string;
    score: number;
    feedback?: string;
  }) {
    return prisma.studentEvaluation.upsert({
      where: {
        studentId_courseId: {
          studentId: data.studentId,
          courseId: data.courseId,
        },
      },
      update: {
        score: data.score,
        feedback: data.feedback ?? '',
        gradedAt: new Date(),
      },
      create: {
        studentId: data.studentId,
        courseId: data.courseId,
        score: data.score,
        feedback: data.feedback ?? '',
      },
    });
  }

  /**
   * Return the count of students enrolled in a course.
   */
  async getEnrollmentCount(courseId: string): Promise<number> {
    return prisma.courseEnrollment.count({ where: { courseId } });
  }
}

export const evaluationService = new EvaluationService();
