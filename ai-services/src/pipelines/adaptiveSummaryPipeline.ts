import groq, { groqConfig } from '../config/groq';
import { retriever } from '../rag/retriever';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdaptiveSummaryInput {
  courseId: string;
  weakConcepts: string[];
}

export interface ConceptSummary {
  concept: string;
  summary: string;
  keyPoints: string[];
  example: string;
  mindmap: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a university academic tutor helping a student who answered quiz questions incorrectly.
Your job is to create a structured study guide for a specific concept the student struggled with.

RULES:
- Write clearly for a student who got it wrong — be direct, concrete, and use examples.
- "summary": 2-3 sentences that clearly explain the concept.
- "keyPoints": 3-5 bullet-point facts to memorise (plain strings, no numbering in them).
- "example": one short, concrete real-world or code example that illustrates the concept.
- "mindmap": a valid Mermaid "graph TD" diagram. Use short node labels (max 5 words each). Use A, B, C... as IDs. Do NOT use parentheses, quotes, or special characters inside node labels.
- Return ONLY a JSON object with exactly these four keys. No markdown fences. No extra text.

Example output format:
{"summary":"Arrays store elements at contiguous memory locations allowing O(1) index access.","keyPoints":["Fixed size allocated at creation","Index access is O(1) time","Insertion at beginning is O(n)","Deletion shifts elements"],"example":"int arr[5] = {1,2,3,4,5}; arr[2] gives 3 in O(1).","mindmap":"graph TD\\n  A[Arrays] --> B[Index Access O1]\\n  A --> C[Fixed Size]\\n  A --> D[Traversal]\\n  B --> E[Random Access]\\n  C --> F[No Dynamic Resize]"}`;

// ─────────────────────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAdaptiveSummary(
  input: AdaptiveSummaryInput
): Promise<ConceptSummary[]> {
  const { courseId, weakConcepts } = input;
  const results: ConceptSummary[] = [];

  for (const concept of weakConcepts) {
    try {
      // ── 1. Retrieve relevant curriculum chunks ──────────────────────────────
      let chunks = await retriever.retrieve(concept, { courseId }, 5, 0.3);

      // Fallback: broaden retrieval without courseId filter
      if (chunks.length < 2) {
        chunks = await retriever.retrieve(concept, {}, 5, 0.25);
      }

      const context =
        chunks.length > 0
          ? chunks
              .map((c: any, i: number) => `[Chunk ${i + 1}]:\n${c.text ?? c.content ?? String(c)}`)
              .join('\n\n')
          : `No specific curriculum content found for "${concept}". Use general academic knowledge.`;

      // ── 2. Build user prompt ────────────────────────────────────────────────
      const userPrompt = `CURRICULUM CONTENT:
${context}

TASK:
The student got quiz questions about "${concept}" wrong.

Generate a JSON study guide with exactly these keys:
- "summary": 2-3 sentence explanation of "${concept}"
- "keyPoints": array of 3-5 strings (key facts to remember)
- "example": one concrete example illustrating "${concept}"
- "mindmap": Mermaid "graph TD" diagram for "${concept}"`;

      // ── 3. Call Groq LLM ──────────────────────────────────────────────────
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

      // ── 4. Parse response ─────────────────────────────────────────────────
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { /* use defaults */ }
        }
      }

      const summary =
        typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : `"${concept}" is an important concept in your course. Review your materials for a detailed explanation.`;

      const keyPoints: string[] = Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints
            .filter((k: unknown): k is string => typeof k === 'string')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : [];

      const example =
        typeof parsed.example === 'string' && parsed.example.trim()
          ? parsed.example.trim()
          : '';

      const mindmap =
        typeof parsed.mindmap === 'string' && parsed.mindmap.includes('graph')
          ? parsed.mindmap.trim()
          : `graph TD\n  A[${concept.replace(/[^a-zA-Z0-9 ]/g, '')}] --> B[Review notes]\n  A --> C[Practice questions]`;

      results.push({ concept, summary, keyPoints, example, mindmap });
    } catch (err: any) {
      console.error(`[AdaptiveSummaryPipeline] Error for concept "${concept}":`, err?.message ?? err);
      // Push a graceful fallback so the loop continues
      results.push({
        concept,
        summary: `Could not generate a summary for "${concept}" right now. Please review your course materials.`,
        keyPoints: [],
        example: '',
        mindmap: `graph TD\n  A[${concept.replace(/[^a-zA-Z0-9 ]/g, '')}] --> B[Review course material]`,
      });
    }
  }

  return results;
}
