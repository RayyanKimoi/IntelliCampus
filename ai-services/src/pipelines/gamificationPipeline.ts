import { retriever } from '../rag/retriever';
import { generateResponse } from '../llm/generateResponse';
import { responseParser } from '../llm/responseParser';

interface QuestionGenerationInput {
  topicId: string;
  courseId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  count: number;
  type: 'sprint_quiz' | 'boss_battle' | 'flashcard';
}

interface GeneratedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface FlashcardGeneration {
  front: string;
  back: string;
}

/**
 * Gamification pipeline: generates questions and content for game modes
 */
class GamificationPipeline {
  /**
   * Generate quiz questions from curriculum content
   */
  async generateQuestions(input: QuestionGenerationInput): Promise<GeneratedQuestion[]> {
    // Retrieve curriculum content for the topic
    const chunks = await retriever.retrieve(
      `Key concepts and facts for quiz generation`,
      { topicId: input.topicId, courseId: input.courseId },
      5
    );

    const contextText = chunks.map((c) => c.text).join('\n\n');

    const systemPrompt = `You are an academic quiz generator. Generate multiple choice questions based ONLY on the provided curriculum content.

RULES:
1. Questions must be answerable from the provided content only.
2. All four options must be plausible.
3. Difficulty level: ${input.difficulty}
4. Questions should test understanding, not just memorization.
5. Return valid JSON only.`;

    const userPrompt = `CURRICULUM CONTENT:
${contextText}

Generate ${input.count} multiple choice questions at ${input.difficulty} difficulty level.
Purpose: ${input.type}

Return as a JSON array with this exact format:
[{
  "questionText": "...",
  "optionA": "...",
  "optionB": "...",
  "optionC": "...",
  "optionD": "...",
  "correctOption": "A|B|C|D",
  "explanation": "..."
}]

Return ONLY valid JSON, no other text.`;

    const response = await generateResponse.generate({
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
      return questions.slice(0, input.count);
    } catch (error) {
      console.error('[GamificationPipeline] Failed to parse questions:', error);
      return [];
    }
  }

  /**
   * Generate flashcards from curriculum content
   */
  async generateFlashcards(
    topicId: string,
    courseId: string,
    count = 10
  ): Promise<FlashcardGeneration[]> {
    const chunks = await retriever.retrieve(
      `Key concepts, definitions, and facts`,
      { topicId, courseId },
      5
    );

    const contextText = chunks.map((c) => c.text).join('\n\n');

    const systemPrompt = `You are an academic flashcard generator. Create flashcards from curriculum content.
Each flashcard should have a clear question/concept on the front and a concise answer on the back.
Return valid JSON only.`;

    const userPrompt = `CURRICULUM CONTENT:
${contextText}

Generate ${count} flashcards.

Return as JSON array:
[{"front": "question or concept", "back": "answer or explanation"}]

Return ONLY valid JSON, no other text.`;

    const response = await generateResponse.generate({
      systemPrompt,
      userPrompt,
      maxTokens: 1536,
      temperature: 0.6,
    });

    try {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as FlashcardGeneration[];
    } catch (error) {
      console.error('[GamificationPipeline] Failed to parse flashcards:', error);
      return [];
    }
  }

  /**
   * Generate boss battle narrative
   */
  async generateBossNarrative(topicName: string): Promise<{
    bossName: string;
    bossDescription: string;
    victoryMessage: string;
    defeatMessage: string;
  }> {
    const systemPrompt = `Generate a fun, academic-themed boss character for a learning game. Return JSON only.`;

    const userPrompt = `Create a boss character for the topic: "${topicName}"

The boss should be themed around this academic topic in a fun, game-like way.

Return JSON:
{
  "bossName": "...",
  "bossDescription": "A short, fun description",
  "victoryMessage": "Congratulatory message when student wins",
  "defeatMessage": "Encouraging message when student loses"
}

Return ONLY valid JSON.`;

    const response = await generateResponse.generate({
      systemPrompt,
      userPrompt,
      maxTokens: 256,
      temperature: 0.8,
    });

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          bossName: `The ${topicName} Guardian`,
          bossDescription: `Master of ${topicName}. Defeat them to prove your mastery!`,
          victoryMessage: 'Congratulations! You have conquered this topic!',
          defeatMessage: 'Keep studying! You can defeat this boss next time.',
        };
      }
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        bossName: `The ${topicName} Guardian`,
        bossDescription: `Master of ${topicName}. Defeat them to prove your mastery!`,
        victoryMessage: 'Congratulations! You have conquered this topic!',
        defeatMessage: 'Keep studying! You can defeat this boss next time.',
      };
    }
  }
}

export const gamificationPipeline = new GamificationPipeline();
