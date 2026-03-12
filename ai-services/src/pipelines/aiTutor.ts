import groq, { groqConfig } from '../config/groq';
import { generateEmbedding } from '../rag/embeddings';
import { retrieveRelevantChunks } from '../rag/retriever';
import { checkCache, storeCache } from '../cache/semanticCache';

export interface AiTutorInput {
  question: string;
  /** Optional: narrow retrieval to a specific course */
  courseId?: string;
}

export interface AiTutorOutput {
  answer: string;
  fromCache: boolean;
  sources: Array<{ text: string; score: number }>;
}

const SYSTEM_PROMPT = `You are an AI tutor for a university learning platform.
Answer the student's question using ONLY the course content provided in the context below.
If the context does not contain enough information to answer, say:
"I don't have enough course material on this topic yet. Please ask your instructor."
Be clear, concise, and educational. Do not fabricate facts.`;

/**
 * AI Tutor pipeline:
 * question → embedding → cache check → RAG retrieval → Groq LLM → cache store → answer
 */
export async function askTutor(input: AiTutorInput): Promise<AiTutorOutput> {
  const { question } = input;

  console.log(`[AiTutor] Tutor query: "${question.slice(0, 150)}"`);

  // Step 1: Generate query embedding
  const queryEmbedding = await generateEmbedding(question);

  // Step 2-3: Check semantic cache
  const cached = await checkCache(queryEmbedding);
  if (cached) {
    console.log('[AiTutor] Cache hit — returning cached answer');
    return { answer: cached, fromCache: true, sources: [] };
  }

  // Step 4: Retrieve relevant chunks from Pinecone
  const chunks = await retrieveRelevantChunks(question);

  console.log(`[AiTutor] Retrieved matches: ${chunks.length}`);
  if (chunks.length === 0) {
    console.warn('[AiTutor] WARNING: Pinecone retrieval returned no chunks — LLM will have no context');
  }

  // Step 5: Build prompt with retrieved context
  const context = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n')
    : 'No relevant course content found.';

  const userPrompt = `Context from course material:\n${context}\n\nStudent question: ${question}`;

  // Step 6: Call Groq chat completion
  console.log('[AiTutor] Groq generation started');
  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: groqConfig.defaultModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: groqConfig.maxTokens,
      temperature: groqConfig.temperature,
    });
  } catch (error: any) {
    console.error('[AiTutor] Groq API error:', error?.message ?? error);
    throw error;
  }

  const answer = completion.choices[0]?.message?.content?.trim() ?? '';
  console.log(`[AiTutor] Groq generation complete — answer length: ${answer.length} chars`);

  // Step 7: Store in semantic cache
  await storeCache(queryEmbedding, answer);

  // Step 8: Return answer with source metadata
  return {
    answer,
    fromCache: false,
    sources: chunks.map((c) => ({ text: c.text, score: c.score })),
  };
}
