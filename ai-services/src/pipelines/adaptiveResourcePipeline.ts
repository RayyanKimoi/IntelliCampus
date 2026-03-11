import groq, { groqConfig } from '../config/groq';
import { retriever } from '../rag/retriever';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdaptiveResourceInput {
  concept: string;
  courseId: string;
  chapterId: string;
}

export interface AdaptiveResourceOutput {
  explanation: string;
  mindmap: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert academic tutor for a university learning platform.
A student has struggled with a specific concept in their quiz. Your job is to:
1. Provide a clear, simplified explanation of the concept using the curriculum content provided.
2. Generate a Mermaid flowchart diagram that visually maps the concept and its relationships.

RULES:
- Write the explanation for a student who got it wrong — be clear, concrete, and use examples where helpful.
- Keep the explanation focused: 3-6 sentences maximum.
- The mindmap must be valid Mermaid syntax using "graph TD" (top-down flowchart).
- Use short node labels (max 5 words each). Use A, B, C... as node IDs.
- Do NOT use parentheses, quotes, or special characters inside node labels.
- Return ONLY a JSON object with keys "explanation" and "mindmap". No markdown fences. No extra text.

Example format:
{"explanation":"...","mindmap":"graph TD\\n  A[Main Concept] --> B[Sub-topic 1]\\n  A --> C[Sub-topic 2]\\n  B --> D[Detail]"}`;

// ─────────────────────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAdaptiveResources(
  input: AdaptiveResourceInput
): Promise<AdaptiveResourceOutput> {
  const { concept, courseId, chapterId } = input;

  // ── 1. Retrieve relevant chunks for this concept from Pinecone ──────────────
  const MIN_SCORE = 0.3;
  let chunks = await retriever.retrieve(concept, { topicId: chapterId, courseId }, 6, MIN_SCORE);

  // Fallback: broaden to course-level if not enough context
  if (chunks.length < 2) {
    chunks = await retriever.retrieve(concept, { courseId }, 6, MIN_SCORE);
  }

  // If still nothing, generate from general concept knowledge with a warning
  const context =
    chunks.length > 0
      ? chunks.map((c: any, i: number) => `[Chunk ${i + 1}]:\n${c.text ?? c.content ?? c}`).join('\n\n')
      : `No specific curriculum content found. Explain the concept "${concept}" using general academic knowledge.`;

  // ── 2. Build user prompt ────────────────────────────────────────────────────
  const userPrompt = `CURRICULUM CONTENT:
${context}

TASK:
The student struggled with the concept: "${concept}"

Generate:
1. A simplified explanation of "${concept}" based on the curriculum content above.
2. A Mermaid "graph TD" diagram showing the key components and relationships of "${concept}".

Return a single JSON object with exactly two keys: "explanation" and "mindmap".`;

  // ── 3. Call Groq LLM ────────────────────────────────────────────────────────
  const response = await groq.chat.completions.create({
    model: groqConfig.defaultModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '';

  // ── 4. Parse and validate response ─────────────────────────────────────────
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Attempt to extract JSON from surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('LLM returned non-JSON response for adaptive resources');
    }
    parsed = JSON.parse(match[0]);
  }

  const explanation = typeof parsed.explanation === 'string' && parsed.explanation.trim()
    ? parsed.explanation.trim()
    : `This topic covers "${concept}". Review your course materials for a detailed explanation.`;

  const mindmap = typeof parsed.mindmap === 'string' && parsed.mindmap.includes('graph')
    ? parsed.mindmap.trim()
    : `graph TD\n  A[${concept}] --> B[Review course material]\n  A --> C[Ask your instructor]`;

  return { explanation, mindmap };
}
