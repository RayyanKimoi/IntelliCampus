import groq, { groqConfig } from '../config/groq';
import { retriever } from '../rag/retriever';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuizGenerationInput {
  courseId: string;
  chapterId: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  concept: string;
}

export interface QuizGenerationOutput {
  questions: GeneratedQuizQuestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty guidance included in the prompt
// ─────────────────────────────────────────────────────────────────────────────

const DIFFICULTY_GUIDANCE: Record<QuizGenerationInput['difficulty'], string> = {
  easy: 'Questions should test recall of basic facts, definitions, and straightforward concepts. Avoid multi-step reasoning.',
  medium: 'Questions should test understanding and application of concepts. Include some reasoning steps but keep distractors clearly distinct.',
  hard: 'Questions should test deep understanding, analysis, and synthesis. Use subtly wrong distractors that require careful reasoning to eliminate.',
};

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert academic quiz generator for a university learning platform.
Your task is to generate multiple-choice questions STRICTLY based on the curriculum content provided to you.

ABSOLUTE RULES:
1. Every question MUST be answerable from the provided curriculum content only.
2. Do NOT invent facts, definitions, or examples not present in the context.
3. Each question must have exactly 4 options.
4. The correctAnswer field must exactly match one of the 4 options.
5. The explanation must reference the relevant part of the curriculum.
6. The concept field must be a short topic label (2-5 words) derived from the content.
7. Return ONLY a valid JSON object — no markdown, no commentary, no code fences.`;

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline function
// ─────────────────────────────────────────────────────────────────────────────

export async function generateQuiz(
  input: QuizGenerationInput
): Promise<QuizGenerationOutput> {
  const { courseId, chapterId, numberOfQuestions, difficulty } = input;

  // ── Step 1: Retrieve curriculum chunks scoped to this chapter ─────────────
  // Attempt 1: chapter-scoped (chapterId stored as topicId in Pinecone metadata)
  const MIN_SCORE = 0.3;
  let chunks = await retriever.retrieve(
    'Key concepts, definitions, and important facts for quiz generation',
    { topicId: chapterId, courseId },
    8,
    MIN_SCORE
  );

  // Attempt 2: course-scoped only
  if (chunks.length < 2) {
    chunks = await retriever.retrieve(
      'Key concepts, definitions, and important facts for quiz generation',
      { courseId },
      8,
      MIN_SCORE
    );
  }

  // Attempt 3: chapterId used as courseId (handles content ingested with different field mapping)
  if (chunks.length < 2) {
    const alt = await retriever.retrieve(
      'Key concepts, definitions, and important facts for quiz generation',
      { courseId: chapterId },
      6,
      MIN_SCORE
    );
    if (alt.length > chunks.length) chunks = alt;
  }

  // Attempt 4: fully unfiltered semantic search (last resort — works regardless of metadata structure)
  if (chunks.length < 2) {
    const broad = await retriever.retrieve(
      'Key concepts, definitions, and important facts for quiz generation',
      undefined,
      8,
      MIN_SCORE
    );
    if (broad.length > chunks.length) chunks = broad;
  }

  if (chunks.length === 0) {
    throw new Error(
      'No curriculum content found in the vector store. Please ingest the chapter materials first using the teacher dashboard.'
    );
  }

  // ── Step 2: Build context string ──────────────────────────────────────────
  const contextText = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
    .join('\n\n---\n\n');

  // ── Step 3: Build user prompt ─────────────────────────────────────────────
  const userPrompt = `CURRICULUM CONTENT:
${contextText}

INSTRUCTIONS:
- Generate exactly ${numberOfQuestions} multiple-choice questions.
- Difficulty level: ${difficulty.toUpperCase()}
- ${DIFFICULTY_GUIDANCE[difficulty]}
- Each question must relate to a distinct concept from the curriculum content above.
- Distribute questions across different chunks/topics where possible.

Return a JSON object in this exact format (no extra keys, no markdown):
{
  "questions": [
    {
      "question": "Full question text here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text",
      "explanation": "Brief explanation referencing the curriculum content.",
      "concept": "Short concept label"
    }
  ]
}

Return ONLY valid JSON. Do not include any text before or after the JSON object.`;

  // ── Step 4: Call Groq LLM ─────────────────────────────────────────────────
  const completion = await groq.chat.completions.create({
    model: groqConfig.defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: Math.min(4096, numberOfQuestions * 350 + 256),
    temperature: 0.5, // Slightly lower for factual accuracy
    response_format: { type: 'json_object' },
  });

  const rawText = completion.choices[0]?.message?.content?.trim() ?? '';

  // ── Step 5: Parse and validate the JSON response ──────────────────────────
  let parsed: { questions: GeneratedQuizQuestion[] };

  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Attempt to extract JSON object if extra text crept in
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM returned non-JSON response for quiz generation.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
    throw new Error('LLM returned an empty questions array.');
  }

  // ── Step 6: Validate and normalise each question ──────────────────────────
  const validated: GeneratedQuizQuestion[] = parsed.questions
    .filter((q) => {
      return (
        typeof q.question === 'string' && q.question.trim() &&
        Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctAnswer === 'string' &&
        q.options.includes(q.correctAnswer)
      );
    })
    .slice(0, numberOfQuestions)
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o: string) => String(o).trim()) as [string, string, string, string],
      correctAnswer: String(q.correctAnswer).trim(),
      explanation: String(q.explanation || '').trim(),
      concept: String(q.concept || chapterId).trim(),
    }));

  if (validated.length === 0) {
    throw new Error('All generated questions failed validation. Please retry or check curriculum content.');
  }

  return { questions: validated };
}
