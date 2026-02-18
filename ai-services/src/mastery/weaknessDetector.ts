import { MASTERY } from '@intellicampus/shared';

interface TopicMasteryData {
  topicId: string;
  masteryScore: number;
  attempts: number;
  correctCount: number;
  recentAccuracy: number;
}

interface WeaknessResult {
  topicId: string;
  weaknessScore: number;
  reason: string;
  recommendation: string;
}

/**
 * Detects weak topics and prerequisite gaps
 */
class WeaknessDetector {
  /**
   * Analyze a set of mastery records and identify weaknesses
   */
  detect(masteryData: TopicMasteryData[]): WeaknessResult[] {
    const weaknesses: WeaknessResult[] = [];

    for (const topic of masteryData) {
      if (topic.masteryScore < MASTERY.WEAK_THRESHOLD) {
        const reason = this.classifyWeakness(topic);
        weaknesses.push({
          topicId: topic.topicId,
          weaknessScore: topic.masteryScore,
          reason,
          recommendation: this.getRecommendation(reason, topic),
        });
      }
    }

    // Sort by severity (lowest mastery first)
    return weaknesses.sort((a, b) => a.weaknessScore - b.weaknessScore);
  }

  /**
   * Classify the type of weakness
   */
  private classifyWeakness(topic: TopicMasteryData): string {
    if (topic.attempts < 3) {
      return 'insufficient_practice';
    }

    const accuracy = topic.correctCount / topic.attempts;

    if (accuracy < 0.3) {
      return 'fundamental_misunderstanding';
    } else if (accuracy < 0.5) {
      return 'conceptual_gap';
    } else if (topic.recentAccuracy < 0.4) {
      return 'declining_performance';
    } else {
      return 'needs_reinforcement';
    }
  }

  /**
   * Generate recommendation based on weakness type
   */
  private getRecommendation(reason: string, topic: TopicMasteryData): string {
    switch (reason) {
      case 'insufficient_practice':
        return 'Practice more with flashcards and sprint quizzes on this topic.';
      case 'fundamental_misunderstanding':
        return 'Revisit the foundational material. Consider reviewing prerequisite topics first.';
      case 'conceptual_gap':
        return 'Review the core concepts. Try using AI learning mode for step-by-step explanations.';
      case 'declining_performance':
        return 'Your recent performance has dropped. Schedule a focused review session.';
      case 'needs_reinforcement':
        return 'You are close! A few more practice sessions should solidify your understanding.';
      default:
        return 'Continue practicing to improve your mastery.';
    }
  }
}

export const weaknessDetector = new WeaknessDetector();
