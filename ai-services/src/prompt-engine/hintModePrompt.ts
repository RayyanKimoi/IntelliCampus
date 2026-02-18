import { RetrievedChunk } from '../rag/retriever';

interface HintPromptInput {
  query: string;
  context: RetrievedChunk[];
  topicName?: string;
}

/**
 * Hint-mode prompt builder for practice sessions.
 * Provides guided hints without revealing full answers.
 */
class HintModePromptBuilder {
  buildSystemPrompt(): string {
    return `You are IntelliCampus AI in HINT MODE.

CRITICAL RULES:
1. You MUST NOT provide direct answers.
2. Instead, guide the student with progressive hints.
3. Start with general direction, then provide more specific hints if needed.
4. Encourage the student to think through the problem.
5. Reference curriculum concepts that are relevant.
6. Use Socratic questioning to guide understanding.
7. If the student is stuck, provide a partial framework they can complete.

You are helping students learn, not giving them answers.`;
  }

  buildPrompt(input: HintPromptInput): string {
    const contextText = input.context
      .map((chunk, i) => `[Source ${i + 1}]\n${chunk.text}`)
      .join('\n\n---\n\n');

    return `CURRICULUM CONTEXT (for your reference only, DO NOT reveal directly):
${contextText || 'No specific content available.'}

STUDENT QUESTION:
${input.query}

INSTRUCTIONS:
- Provide a HINT, not an answer.
- Guide the student toward the answer using questions and partial information.
- Reference relevant concepts from the curriculum.
- Structure your hint in levels:
  * Level 1: General direction
  * Level 2: Key concept to consider
  * Level 3: Partial framework (if needed)`;
  }
}

export const hintModePrompt = new HintModePromptBuilder();
