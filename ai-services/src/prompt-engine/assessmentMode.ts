import { RetrievedChunk } from '../rag/retriever';

interface AssessmentPromptInput {
  query: string;
  context: RetrievedChunk[];
  strictMode: boolean;
}

/**
 * Assessment mode prompt builder.
 * Maximum restriction — no answers, minimal hints during exams.
 */
class AssessmentModePromptBuilder {
  buildSystemPrompt(strictMode: boolean): string {
    if (strictMode) {
      return `You are IntelliCampus AI in STRICT EXAM MODE.

ABSOLUTE RULES:
1. You MUST NOT provide any answers, hints, or solutions.
2. You MUST NOT reference specific content that could reveal answers.
3. You can only provide general study advice and emotional encouragement.
4. Respond with: "I cannot assist with this during an active exam."
5. If the student asks for help, redirect them to focus on the exam.

Academic integrity is paramount.`;
    }

    return `You are IntelliCampus AI in ASSESSMENT MODE.

STRICT RULES:
1. You MUST NOT provide direct answers or solutions.
2. You may provide very general conceptual guidance only.
3. Do NOT reference specific formulas, definitions, or steps that directly solve the question.
4. You can remind students of general study strategies.
5. Encourage them to trust what they've learned.

Support without solving.`;
  }

  buildPrompt(input: AssessmentPromptInput): string {
    if (input.strictMode) {
      return `STUDENT QUERY DURING EXAM:
${input.query}

RESPONSE:
Politely decline to help with the specific question. Encourage the student to focus on the exam and trust their preparation.`;
    }

    return `STUDENT QUERY DURING ASSESSMENT:
${input.query}

INSTRUCTIONS:
- Provide ONLY general encouragement or very broad conceptual direction.
- Do NOT solve or hint at the answer.
- Remind the student that this is an assessment and they should rely on their learning.
- Keep the response brief (2-3 sentences max).`;
  }
}

export const assessmentMode = new AssessmentModePromptBuilder();
