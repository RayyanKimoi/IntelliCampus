import { embedder } from './embedder';
import { getIndex, pineconeConfig } from '../config/pinecone';
import { RAG } from '@intellicampus/shared';

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, any>;
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
    topK: number = RAG.TOP_K_RESULTS
  ): Promise<RetrievedChunk[]> {
    // Generate query embedding
    const queryEmbedding = await embedder.embed(query);

    // Build filter
    const filter: Record<string, any> = {};
    if (filters?.topicId) filter.topicId = { $eq: filters.topicId };
    if (filters?.courseId) filter.courseId = { $eq: filters.courseId };

    // Query Pinecone
    const index = getIndex();
    const results = await index.namespace(pineconeConfig.namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    // Filter by minimum relevance score and map to chunks
    return (results.matches || [])
      .filter((match) => (match.score || 0) >= RAG.MIN_RELEVANCE_SCORE)
      .map((match) => ({
        id: match.id,
        text: (match.metadata?.text as string) || '',
        score: match.score || 0,
        metadata: match.metadata || {},
      }));
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
