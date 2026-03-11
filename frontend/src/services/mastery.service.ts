import { prisma } from '@/lib/prisma';
import { MASTERY } from '@intellicampus/shared';
import { logger } from '@/utils/logger';

export class MasteryService {
  /**
   * Get or create mastery record for user+topic
   */
  async getOrCreateMastery(userId: string, topicId: string) {
    const existing = await prisma.masteryGraph.findUnique({
      where: {
        userId_topicId: { userId, topicId },
      },
    });

    if (existing) return existing;

    return prisma.masteryGraph.create({
      data: {
        userId,
        topicId,
        masteryScore: 0,
        confidenceScore: 0,
        attemptsCount: 0,
        correctCount: 0,
      },
    });
  }

  /**
   * Update mastery after an interaction
   */
  async updateMastery(
    userId: string,
    topicId: string,
    isCorrect: boolean,
    timeSpent: number
  ) {
    const mastery = await this.getOrCreateMastery(userId, topicId);

    const newAttempts = mastery.attemptsCount + 1;
    const newCorrect = mastery.correctCount + (isCorrect ? 1 : 0);

    // Calculate mastery score: weighted accuracy with recency bias
    const accuracy = (newCorrect / newAttempts) * 100;
    const recencyWeight = 0.3;
    const newScore = mastery.masteryScore * (1 - recencyWeight) + accuracy * recencyWeight;
    const clampedScore = Math.min(MASTERY.MAX_SCORE, Math.max(MASTERY.MIN_SCORE, newScore));

    // Confidence: based on number of attempts (more attempts = higher confidence)
    const confidenceScore = Math.min(100, (newAttempts / 20) * 100);

    const updated = await prisma.masteryGraph.update({
      where: {
        userId_topicId: { userId, topicId },
      },
      data: {
        masteryScore: clampedScore,
        confidenceScore,
        attemptsCount: newAttempts,
        correctCount: newCorrect,
      },
    });

    // Check for weakness flag
    if (clampedScore < MASTERY.WEAK_THRESHOLD && newAttempts >= 3) {
      await this.flagWeakTopic(userId, topicId, clampedScore);
    }

    // Log the performance
    await prisma.performanceLog.create({
      data: {
        userId,
        topicId,
        activityType: 'practice',
        score: isCorrect ? 100 : 0,
        accuracy: accuracy,
        timeSpent,
      },
    });

    logger.debug('MasteryService', `Mastery updated for user ${userId}, topic ${topicId}: ${clampedScore.toFixed(1)}`);

    return updated;
  }

  /**
   * Get all mastery records for a student
   */
  async getStudentMastery(userId: string) {
    return prisma.masteryGraph.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            subject: {
              include: { course: true },
            },
          },
        },
      },
      orderBy: { masteryScore: 'asc' },
    });
  }

  /**
   * Get mastery for specific course topics
   */
  async getCourseMastery(userId: string, courseId: string) {
    return prisma.masteryGraph.findMany({
      where: {
        userId,
        topic: {
          subject: {
            courseId,
          },
        },
      },
      include: {
        topic: {
          include: { subject: true },
        },
      },
      orderBy: { masteryScore: 'asc' },
    });
  }

  /**
   * Flag a topic as weak for a student
   */
  private async flagWeakTopic(userId: string, topicId: string, score: number) {
    await prisma.weakTopicFlag.upsert({
      where: {
        id: `${userId}_${topicId}`, // pseudo-unique
      },
      create: {
        userId,
        topicId,
        weaknessScore: score,
      },
      update: {
        weaknessScore: score,
        detectedAt: new Date(),
      },
    });
  }

  /**
   * Get weak topics for a student
   */
  async getWeakTopics(userId: string) {
    return prisma.weakTopicFlag.findMany({
      where: { userId },
      include: {
        topic: {
          include: { subject: true },
        },
      },
      orderBy: { weaknessScore: 'asc' },
    });
  }

  /**
   * Get class mastery overview for teacher
   */
  async getClassMastery(courseId: string) {
    const topics = await prisma.topic.findMany({
      where: {
        subject: { courseId },
      },
      include: {
        masteryGraphs: true,
        subject: true,
      },
    });

    return topics.map((topic) => {
      const scores = topic.masteryGraphs.map((m) => m.masteryScore);
      const avgMastery = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      const weakCount = scores.filter((s) => s < MASTERY.WEAK_THRESHOLD).length;

      return {
        topicId: topic.id,
        topicName: topic.name,
        subjectName: topic.subject.name,
        avgMastery: Math.round(avgMastery * 10) / 10,
        studentCount: scores.length,
        weakStudentCount: weakCount,
      };
    });
  }
  /**
   * Get all TopicMastery records for a student (powers Mastery dashboard).
   * score = (correct / attempts) * 100
   * Weak: score < 70  |  Mastered: score >= 80
   */
  async getStudentTopicMastery(userId: string) {
    return (prisma as any).topicMastery.findMany({
      where: { studentId: userId },
      include: { course: true },
      orderBy: { score: 'asc' },
    });
  }

  /**
   * Upsert TopicMastery records from a quiz result.
   * Aggregates answers by topic then accumulates attempts + correct counts.
   */
  async updateTopicMasteryFromQuiz(
    studentId: string,
    courseId: string,
    answers: Array<{ topic: string; isCorrect: boolean }>
  ) {
    if (!courseId) return [];

    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const ans of answers) {
      const topic = String(ans.topic ?? '').trim();
      if (!topic) continue;
      const entry = topicMap.get(topic) ?? { correct: 0, total: 0 };
      entry.total++;
      if (ans.isCorrect) entry.correct++;
      topicMap.set(topic, entry);
    }

    return Promise.all(
      Array.from(topicMap.entries()).map(async ([topic, { correct, total }]) => {
        const existing = await (prisma as any).topicMastery.findUnique({
          where: { studentId_courseId_topic: { studentId, courseId, topic } },
        });
        const newAttempts = (existing?.attempts ?? 0) + total;
        const newCorrect = (existing?.correct ?? 0) + correct;
        const score = newAttempts > 0 ? (newCorrect / newAttempts) * 100 : 0;

        return (prisma as any).topicMastery.upsert({
          where: { studentId_courseId_topic: { studentId, courseId, topic } },
          create: { studentId, courseId, topic, attempts: newAttempts, correct: newCorrect, score },
          update: { attempts: newAttempts, correct: newCorrect, score },
        });
      })
    );
  }

  /**
   * Update mastery for a concept after a quiz attempt.
   * masteryScore = correct / total (0–1 range).
   * Concepts with masteryScore < 0.5 are flagged as weak.
   */
  async updateMasteryAfterQuiz({
    studentId,
    concept,
    correct,
    total,
  }: {
    studentId: string;
    concept: string;
    correct: number;
    total: number;
  }) {
    if (total === 0) return null;

    const masteryScore = correct / total;
    const isWeak = masteryScore < 0.5;

    // Upsert the ConceptMastery record (one row per student+concept)
    const record = await (prisma as any).conceptMastery.upsert({
      where: {
        studentId_concept: { studentId, concept },
      },
      create: {
        studentId,
        concept,
        masteryScore,
        isWeak,
        correctCount: correct,
        totalCount: total,
      },
      update: {
        // Blend new score with existing: 70% new, 30% history
        masteryScore: {
          set: masteryScore,
        },
        isWeak,
        correctCount: { increment: correct },
        totalCount: { increment: total },
      },
    });

    logger.debug(
      'MasteryService',
      `Concept mastery updated — student: ${studentId}, concept: "${concept}", score: ${(masteryScore * 100).toFixed(1)}%, weak: ${isWeak}`
    );

    return { ...record, masteryScore, isWeak };
  }

  /**
   * Update mastery for all concepts from a quiz attempt in one call.
   * Aggregates answers by concept then calls updateMasteryAfterQuiz per concept.
   */
  async updateMasteryFromQuizResult(
    studentId: string,
    answers: Array<{ concept: string; isCorrect: boolean }>
  ) {
    // Group answers by concept
    const conceptMap = new Map<string, { correct: number; total: number }>();
    for (const ans of answers) {
      const entry = conceptMap.get(ans.concept) ?? { correct: 0, total: 0 };
      entry.total++;
      if (ans.isCorrect) entry.correct++;
      conceptMap.set(ans.concept, entry);
    }

    const results = await Promise.all(
      Array.from(conceptMap.entries()).map(([concept, { correct, total }]) =>
        this.updateMasteryAfterQuiz({ studentId, concept, correct, total })
      )
    );

    return results.filter(Boolean);
  }

}

export const masteryService = new MasteryService();
