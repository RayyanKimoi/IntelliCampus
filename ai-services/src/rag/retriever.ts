import { generateEmbedding } from './embeddings';
import { getPineconeIndex, pineconeConfig } from '../config/pinecone';
import { RAG } from '@intellicampus/shared';

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

class Retriever {
  /**
   * Retrieve relevant curriculum chunks for a query
   */
  async retrieve(
    query: string,
    filters?: {
      topicId?: string;
      courseId?: string;
    },
    topK: number = RAG.TOP_K_RESULTS,
    minScore: number = RAG.MIN_RELEVANCE_SCORE
  ): Promise<RetrievedChunk[]> {
    console.log(`[Retriever] Tutor query: "${query.slice(0, 100)}"`);
    console.log(`[Retriever] Using namespace: '${pineconeConfig.namespace}', topK: ${topK}, minScore: ${minScore}`, filters ? `filters: ${JSON.stringify(filters)}` : '');

    // Generate query embedding
    const _embedStart = performance.now();
    const queryEmbedding = await generateEmbedding(query);
    const _embedMs = performance.now() - _embedStart;

    // Build filter
    const filter: Record<string, unknown> = {};
    if (filters?.topicId) filter.topicId = { $eq: filters.topicId };
    if (filters?.courseId) filter.courseId = { $eq: filters.courseId };

    // Query Pinecone
    const index = getPineconeIndex();
    const _pineconeStart = performance.now();
    const results = await index.namespace(pineconeConfig.namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    const _pineconeMs = performance.now() - _pineconeStart;

    const allMatches = results.matches || [];
    console.log(JSON.stringify({ stage: 'vector_search', latency_ms: Math.round(_pineconeMs), raw_matches: allMatches.length, filters: filters ?? null }));
    console.log(JSON.stringify({ stage: 'retriever_embedding', latency_ms: Math.round(_embedMs) }));

    // Filter by minimum relevance score and map to chunks
    const filtered = allMatches
      .filter((match) => (match.score || 0) >= minScore)
      .map((match) => ({
        id: match.id,
        text: (match.metadata?.text as string) || '',
        score: match.score || 0,
        metadata: match.metadata || {},
      }));

    if (filtered.length === 0) {
      console.warn(`[Retriever] WARNING: Pinecone retrieval returned no chunks above minScore=${minScore}. Raw matches: ${allMatches.length}. Top scores: ${allMatches.slice(0, 3).map(m => m.score?.toFixed(3)).join(', ')}`);
    } else {
      console.log(`[Retriever] Retrieved matches: ${filtered.length} (after score filter)`);
    }

    return filtered;
  }

  /**
   * Retrieve with topic context expansion
   * Falls back to course-level search if topic-level returns too few results
   */
  async retrieveWithFallback(
    query: string,
    topicId: string,
    courseId: string
  ): Promise<RetrievedChunk[]> {
    // First, try topic-specific retrieval
    let chunks = await this.retrieve(query, { topicId }, RAG.TOP_K_RESULTS);

    // If insufficient results, expand to course level
    if (chunks.length < 2) {
      const courseChunks = await this.retrieve(
        query,
        { courseId },
        RAG.TOP_K_RESULTS
      );

      // Merge and deduplicate
      const ids = new Set(chunks.map((c) => c.id));
      for (const chunk of courseChunks) {
        if (!ids.has(chunk.id)) {
          chunks.push(chunk);
        }
      }
    }

    // Sort by score
    return chunks.sort((a, b) => b.score - a.score).slice(0, RAG.TOP_K_RESULTS);
  }
}

export const retriever = new Retriever();

/**
 * Retrieve the top 5 most relevant text chunks for a user query.
 *
 * Core RAG entry point used by AI Tutor, quiz generation, and other pipelines.
 */
export async function retrieveRelevantChunks(
  query: string
): Promise<Array<{ text: string; score: number; metadata: Record<string, unknown> }>> {
  return retriever.retrieve(query, undefined, 5);
}
