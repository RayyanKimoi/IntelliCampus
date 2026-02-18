import openai from '../config/openai';

/**
 * Content moderation to filter inappropriate content
 */
class Moderation {
  /**
   * Check if content is appropriate for academic context
   */
  async check(text: string): Promise<{
    flagged: boolean;
    categories: string[];
  }> {
    try {
      const response = await openai.moderations.create({
        input: text,
      });

      const result = response.results[0];

      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
      };
    } catch (error) {
      // Fail open in case of API issues, log the error
      console.error('[Moderation] Check failed:', error);
      return { flagged: false, categories: [] };
    }
  }

  /**
   * Check if a response is academically appropriate
   */
  async validateResponse(response: string): Promise<boolean> {
    const check = await this.check(response);
    return !check.flagged;
  }
}

export const moderation = new Moderation();
