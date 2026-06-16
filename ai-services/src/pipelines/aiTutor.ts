import groq, { groqConfig } from '../config/groq';
import { generateEmbedding } from '../rag/embeddings';
import { retrieveRelevantChunks } from '../rag/retriever';
import { checkCache, storeCache } from '../cache/semanticCache';

export interface AiTutorInput {
  question: string;
  /** Optional: narrow retrieval to a specific course */
  courseId?: string;
}

export interface AiTutorLatency {
  total_ms: number;
  embedding_ms: number;
  cache_check_ms: number;
  retrieval_ms: number;
  context_build_ms: number;
  llm_ms: number;
  cache_store_ms: number;
}

export interface AiTutorOutput {
  answer: string;
  fromCache: boolean;
  sources: Array<{ text: string; score: number }>;
  latency?: AiTutorLatency;
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
  const _totalStart = performance.now();

  console.log(`[AiTutor] Tutor query: "${question.slice(0, 150)}"`);

  // Step 1: Generate query embedding
  const _embedStart = performance.now();
  const queryEmbedding = await generateEmbedding(question);
  const embedding_ms = Math.round(performance.now() - _embedStart);

  // Step 2-3: Check semantic cache
  const _cacheCheckStart = performance.now();
  const cached = await checkCache(queryEmbedding);
  const cache_check_ms = Math.round(performance.now() - _cacheCheckStart);

  if (cached) {
    const total_ms = Math.round(performance.now() - _totalStart);
    console.log(JSON.stringify({ stage: 'ai_tutor_pipeline', result: 'cache_hit', total_ms, embedding_ms, cache_check_ms }));
    return {
      answer: cached,
      fromCache: true,
      sources: [],
      latency: { total_ms, embedding_ms, cache_check_ms, retrieval_ms: 0, context_build_ms: 0, llm_ms: 0, cache_store_ms: 0 },
    };
  }

  // Step 4: Retrieve relevant chunks from Pinecone
  const _retrievalStart = performance.now();
  const chunks = await retrieveRelevantChunks(question);
  const retrieval_ms = Math.round(performance.now() - _retrievalStart);

  console.log(`[AiTutor] Retrieved matches: ${chunks.length}`);
  if (chunks.length === 0) {
    console.warn('[AiTutor] WARNING: Pinecone retrieval returned no chunks — LLM will have no context');
  }

  // Step 5: Build prompt with retrieved context
  const _contextStart = performance.now();
  const context = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n')
    : 'No relevant course content found.';

  const userPrompt = `Context from course material:\n${context}\n\nStudent question: ${question}`;
  const context_build_ms = Math.round(performance.now() - _contextStart);

  // Step 6: Call Groq chat completion
  console.log('[AiTutor] Groq generation started');
  const _llmStart = performance.now();
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
  const llm_ms = Math.round(performance.now() - _llmStart);

  const answer = completion.choices[0]?.message?.content?.trim() ?? '';
  console.log(JSON.stringify({ stage: 'llm_inference', latency_ms: llm_ms, model: groqConfig.defaultModel, answer_chars: answer.length }));

  // Step 7: Store in semantic cache
  const _cacheStoreStart = performance.now();
  await storeCache(queryEmbedding, answer);
  const cache_store_ms = Math.round(performance.now() - _cacheStoreStart);

  const total_ms = Math.round(performance.now() - _totalStart);
  const latency: AiTutorLatency = { total_ms, embedding_ms, cache_check_ms, retrieval_ms, context_build_ms, llm_ms, cache_store_ms };
  console.log(JSON.stringify({ stage: 'ai_tutor_pipeline', result: 'live', ...latency }));

  // Step 8: Return answer with source metadata
  return {
    answer,
    fromCache: false,
    sources: chunks.map((c) => ({ text: c.text, score: c.score })),
    latency,
  };
}
