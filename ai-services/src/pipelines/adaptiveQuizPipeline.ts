import groq, { groqConfig } from '../config/groq';
import { retriever } from '../rag/retriever';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdaptiveQuizInput {
  courseId: string;
  chapterId: string;
  weakConcepts: string[];
  numberOfQuestions: number;
}

export interface AdaptiveQuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  concept: string;
}

export interface AdaptiveQuizOutput {
  questions: AdaptiveQuizQuestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert adaptive quiz generator for a university learning platform.
A student has already attempted a quiz and struggled with specific concepts.
Your task is to generate targeted multiple-choice questions that help the student master those weak concepts.

ABSOLUTE RULES:
1. Every question MUST directly target one of the provided weak concepts.
2. Questions should reinforce understanding — not simply re-test the same fact.
3. Each question must have exactly 4 options.
4. The correctAnswer field must exactly match one of the 4 options (character-for-character).
5. The explanation must clarify WHY the answer is correct and address common misconceptions.
6. The concept field must match one of the weak concepts provided.
7. Distribute questions evenly across all weak concepts where possible.
8. Return ONLY a JSON object with a "questions" array. No markdown fences. No extra text.

Format per question:
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A. ...",
  "explanation": "...",
  "concept": "..."
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAdaptiveQuiz(
  input: AdaptiveQuizInput
): Promise<AdaptiveQuizOutput> {
  const { courseId, chapterId, weakConcepts, numberOfQuestions } = input;

  if (weakConcepts.length === 0) {
    throw new Error('No weak concepts provided for adaptive quiz generation');
  }

  // ── 1. Retrieve curriculum chunks for each weak concept ───────────────────
  const conceptChunks = await Promise.all(
    weakConcepts.map(async (concept) => {
      const MIN_SCORE = 0.3;
      // Build filters only when non-empty values are provided
      const hasChapter = Boolean(chapterId);
      const hasCourse = Boolean(courseId);

      // Attempt 1: chapter + course scoped
      if (hasChapter && hasCourse) {
        const chunks = await retriever.retrieve(concept, { topicId: chapterId, courseId }, 4, MIN_SCORE);
        if (chunks.length > 0) return { concept, chunks };
      }
      // Attempt 2: course scoped only
      if (hasCourse) {
        const chunks = await retriever.retrieve(concept, { courseId }, 4, MIN_SCORE);
        if (chunks.length > 0) return { concept, chunks };
      }
      // Attempt 3: no filter — semantic search across entire index
      const chunks = await retriever.retrieve(concept, undefined, 4, MIN_SCORE);
      return { concept, chunks };
    })
  );

  // Build combined context, labelled per concept
  const contextParts = conceptChunks
    .filter(({ chunks }) => chunks.length > 0)
    .map(({ concept, chunks }) => {
      const text = chunks
        .map((c: any, i: number) => `  [${i + 1}] ${c.text ?? c.content ?? c}`)
        .join('\n');
      return `### Concept: "${concept}"\n${text}`;
    });

  const context =
    contextParts.length > 0
      ? contextParts.join('\n\n')
      : `No specific curriculum content found. Generate questions about: ${weakConcepts.join(', ')}`;

  // ── 2. Build user prompt ────────────────────────────────────────────────────
  const conceptList = weakConcepts.map((c) => `- ${c}`).join('\n');
  const userPrompt = `CURRICULUM CONTENT:
${context}

WEAK CONCEPTS THE STUDENT STRUGGLED WITH:
${conceptList}

TASK:
Generate exactly ${numberOfQuestions} adaptive multiple-choice questions targeting the weak concepts above.
Distribute questions across all concepts as evenly as possible.
Focus on reinforcing understanding and correcting misconceptions.

Return a JSON object: { "questions": [ ...${numberOfQuestions} question objects... ] }`;

  // ── 3. Call Groq LLM ────────────────────────────────────────────────────────
  const maxTokens = Math.min(4096, numberOfQuestions * 400 + 256);

  const response = await groq.chat.completions.create({
    model: groqConfig.defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '';

  // ── 4. Parse + validate ─────────────────────────────────────────────────────
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('LLM returned non-JSON response for adaptive quiz');
    }
    parsed = JSON.parse(match[0]);
  }

  const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];

  // Validate: correctAnswer must exist in options[]
  const validQuestions = rawQuestions.filter((q: any) => {
    return (
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctAnswer === 'string' &&
      q.options.some((opt: string) => opt.trim() === q.correctAnswer.trim())
    );
  });

  if (validQuestions.length === 0) {
    throw new Error('LLM returned no valid adaptive quiz questions');
  }

  const questions: AdaptiveQuizQuestion[] = validQuestions
    .slice(0, numberOfQuestions)
    .map((q: any) => ({
      question: String(q.question).trim(),
      options: q.options.map((o: string) => String(o).trim()) as [string, string, string, string],
      correctAnswer: String(q.correctAnswer).trim(),
      explanation: String(q.explanation ?? '').trim(),
      concept: String(q.concept ?? weakConcepts[0]).trim(),
    }));

  return { questions };
}
