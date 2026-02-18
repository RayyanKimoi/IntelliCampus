import { RetrievedChunk } from '../rag/retriever';

interface GovernedPromptInput {
  query: string;
  context: RetrievedChunk[];
  studentLevel: string;
  masteryScore: number;
  topicName?: string;
}

/**
 * Builds governed prompts that restrict AI to curriculum content only.
 * This is the core intelligence that makes IntelliCampus different from generic AI.
 */
class GovernedPromptBuilder {
  /**
   * Build system prompt for curriculum-bound responses
   */
  buildSystemPrompt(): string {
    return `You are IntelliCampus AI, a governed academic assistant for university students.

CRITICAL RULES:
1. You MUST ONLY use information from the provided curriculum context to answer questions.
2. You MUST NOT generate information outside the curriculum materials.
3. If the curriculum context does not contain relevant information, say so clearly.
4. Provide step-by-step explanations when possible.
5. Encourage critical thinking rather than just giving direct answers.
6. Adapt your language complexity to the student's level.
7. Never fabricate citations, sources, or facts.
8. Be encouraging but academically rigorous.

You are an educational assistant, not a general-purpose chatbot.`;
  }

  /**
   * Build the full governed prompt with curriculum context
   */
  buildPrompt(input: GovernedPromptInput): string {
    const contextText = input.context
      .map((chunk, i) => `[Source ${i + 1}] (Relevance: ${(chunk.score * 100).toFixed(0)}%)\n${chunk.text}`)
      .join('\n\n---\n\n');

    const levelGuidance = this.getLevelGuidance(input.studentLevel, input.masteryScore);

    return `CURRICULUM CONTEXT:
${contextText || 'No specific curriculum content found for this query.'}

---

STUDENT CONTEXT:
- Level: ${input.studentLevel}
- Topic Mastery: ${input.masteryScore}%
- ${levelGuidance}

STUDENT QUESTION:
${input.query}

INSTRUCTIONS:
- Answer ONLY using the curriculum context provided above.
- ${input.masteryScore < 40 ? 'Student is struggling. Use simpler language and more examples.' : ''}
- ${input.masteryScore > 80 ? 'Student has strong understanding. You can use more advanced explanations.' : ''}
- Provide a clear, structured response.
- Include step-by-step reasoning where appropriate.`;
  }

  /**
   * Get guidance based on student level
   */
  private getLevelGuidance(level: string, mastery: number): string {
    if (mastery < 30) {
      return 'This student is a beginner. Use simple language, analogies, and foundational explanations.';
    } else if (mastery < 60) {
      return 'This student has developing understanding. Bridge basic and intermediate concepts.';
    } else if (mastery < 80) {
      return 'This student has good understanding. Can handle moderate complexity.';
    } else {
      return 'This student has strong mastery. Can handle advanced concepts and nuances.';
    }
  }
}

export const governedPrompt = new GovernedPromptBuilder();
