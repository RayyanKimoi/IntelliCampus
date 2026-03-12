import groq, { groqConfig } from '../config/groq';
import { retriever } from '../rag/retriever';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AssignmentEvaluationInput {
  submissionText: string;       // Concatenated student submission (text + code)
  assignmentTitle: string;
  assignmentDescription: string;
  evaluationPoints?: string;    // Teacher-defined evaluation key points
  courseId?: string;
  chapterId?: string;
}

export interface AssignmentEvaluationOutput {
  score: number;                // 0–100
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  feedback: string;
  weakTopics: string[];         // Extracted topic tags for ConceptMastery
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert academic evaluator for a university learning platform.
You evaluate student assignment submissions objectively and constructively.

Your evaluation must follow these rules:
1. Score the submission fairly from 0-100 based on correctness, completeness, and clarity.
2. Identify specific strengths in the submission (what the student did well).
3. Identify specific weaknesses (what was incorrect, incomplete, or unclear).
4. List missing concepts or topics the student failed to address.
5. Provide constructive, specific feedback the student can act on.
6. Extract weak topic tags (2-4 words each) that represent areas the student needs to strengthen.
7. Be objective — base all judgments on the provided curriculum context and assignment requirements.
8. Return ONLY a valid JSON object — no markdown, no commentary, no code fences.`;

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateAssignment(
  input: AssignmentEvaluationInput
): Promise<AssignmentEvaluationOutput> {
  const {
    submissionText,
    assignmentTitle,
    assignmentDescription,
    evaluationPoints = '',
    courseId = '',
    chapterId = '',
  } = input;

  if (!submissionText?.trim()) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['No submission content provided.'],
      missingConcepts: ['Complete assignment submission required'],
      feedback: 'No submission content was found to evaluate. Please ensure you have submitted your work.',
      weakTopics: [],
    };
  }

  // ── Step 1: Retrieve relevant curriculum chunks ──────────────────────────
  const retrievalQuery = `${assignmentTitle} ${assignmentDescription} ${evaluationPoints}`.trim();
  const MIN_SCORE = 0.3;

  let chunks = await retriever.retrieve(
    retrievalQuery,
    { topicId: chapterId, courseId },
    6,
    MIN_SCORE
  );

  if (chunks.length < 2 && courseId) {
    chunks = await retriever.retrieve(retrievalQuery, { courseId }, 6, MIN_SCORE);
  }

  if (chunks.length < 2 && chapterId) {
    const alt = await retriever.retrieve(retrievalQuery, { courseId: chapterId }, 6, MIN_SCORE);
    if (alt.length > chunks.length) chunks = alt;
  }

  // ── Step 2: Build context ─────────────────────────────────────────────────
  const curriculumContext = chunks.length > 0
    ? chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.text}`).join('\n\n---\n\n')
    : 'No specific curriculum content available for this assignment.';

  // Truncate submission if too long
  const maxSubmissionLength = 3000;
  const truncatedSubmission =
    submissionText.length > maxSubmissionLength
      ? submissionText.slice(0, maxSubmissionLength) + '\n... [truncated]'
      : submissionText;

  // ── Step 3: Build user prompt ─────────────────────────────────────────────
  const userPrompt = `ASSIGNMENT TITLE: ${assignmentTitle}

ASSIGNMENT DESCRIPTION: ${assignmentDescription}
${evaluationPoints.trim() ? `\nEVALUATION KEY POINTS:\n${evaluationPoints}` : ''}

CURRICULUM CONTEXT (use to assess correctness):
${curriculumContext}

STUDENT SUBMISSION:
${truncatedSubmission}

INSTRUCTIONS:
- Evaluate the submission based on the assignment requirements and curriculum context.
- Assign a score from 0 to 100.
- Identify 2-5 specific strengths.
- Identify 2-5 specific weaknesses or errors.
- List 1-4 missing concepts or topics the student failed to address.
- Write 3-5 sentences of constructive feedback.
- Extract 1-5 weak topic tags (short labels, 2-4 words each) representing areas needing improvement.

Return a JSON object in this EXACT format:
{
  "score": 75,
  "strengths": ["Clear explanation of concept X", "Correct implementation of Y"],
  "weaknesses": ["Missing analysis of Z", "Incorrect definition of W"],
  "missingConcepts": ["Loop invariants", "Big-O notation"],
  "feedback": "Your submission demonstrates a good understanding of the basic concepts. However, you need to work on...",
  "weakTopics": ["loop invariants", "complexity analysis"]
}

Return ONLY valid JSON. No text before or after the JSON object.`;

  // ── Step 4: Call Groq LLM ─────────────────────────────────────────────────
  const completion = await groq.chat.completions.create({
    model: groqConfig.defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1024,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const rawText = completion.choices[0]?.message?.content?.trim() ?? '';

  // ── Step 5: Parse and validate ────────────────────────────────────────────
  let parsed: AssignmentEvaluationOutput;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM returned non-JSON response for assignment evaluation.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  // Validate and normalise fields
  const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
  const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [];
  const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [];
  const missingConcepts = Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts.map(String) : [];
  const feedback = typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '';
  const weakTopics = Array.isArray(parsed.weakTopics) ? parsed.weakTopics.map(String) : [];

  return { score, strengths, weaknesses, missingConcepts, feedback, weakTopics };
}
