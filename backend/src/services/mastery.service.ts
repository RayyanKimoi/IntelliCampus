import { prisma } from '../config/db';
import { MASTERY } from '@intellicampus/shared';
import { logger } from '../utils/logger';

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
}

export const masteryService = new MasteryService();
