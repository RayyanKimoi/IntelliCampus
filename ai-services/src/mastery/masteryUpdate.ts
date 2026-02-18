import { MASTERY } from '@intellicampus/shared';

interface MasteryUpdateInput {
  currentScore: number;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
  interactionType: string;
}

/**
 * Mastery score calculation engine
 */
class MasteryUpdateEngine {
  /**
   * Calculate new mastery score using weighted algorithm
   */
  calculateNewScore(input: MasteryUpdateInput): number {
    const { currentScore, isCorrect, timeSpent, attempts, interactionType } = input;

    // Weight based on interaction type
    const typeWeight = this.getTypeWeight(interactionType);

    // Recency bias — recent interactions matter more
    const recencyFactor = Math.min(1, 0.2 + (0.8 / Math.max(1, attempts)));

    // Performance score for this interaction
    const performanceScore = isCorrect ? 100 : 0;

    // Time factor — faster correct answers indicate stronger mastery
    const timeFactor = isCorrect ? Math.max(0.5, 1 - (timeSpent / 120)) : 1;

    // Weighted update
    const update = performanceScore * typeWeight * timeFactor;
    const newScore = currentScore * (1 - recencyFactor) + update * recencyFactor;

    // Clamp to valid range
    return Math.min(MASTERY.MAX_SCORE, Math.max(MASTERY.MIN_SCORE, newScore));
  }

  /**
   * Calculate confidence score based on data quantity
   */
  calculateConfidence(attempts: number, correctCount: number): number {
    if (attempts === 0) return 0;

    const accuracy = correctCount / attempts;
    const dataSufficiency = Math.min(1, attempts / 20); // Need ~20 attempts for full confidence

    return Math.round(accuracy * dataSufficiency * 100);
  }

  /**
   * Weight by interaction type (some activities are stronger signals)
   */
  private getTypeWeight(type: string): number {
    switch (type) {
      case 'quiz':
      case 'assignment':
        return 1.0; // Full weight for formal assessment
      case 'boss_battle':
        return 0.9; // Gamified but still tested
      case 'flashcard':
        return 0.6; // Recognition-based
      case 'doubt':
        return 0.3; // Just asking doesn't strongly indicate mastery
      default:
        return 0.5;
    }
  }
}

export const masteryUpdate = new MasteryUpdateEngine();
