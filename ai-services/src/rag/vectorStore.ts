import { getPineconeIndex, pineconeConfig } from '../config/pinecone';
import { generateEmbedding } from './embeddings';

export interface EmbeddingMetadata {
  courseId: string;
  topicId: string;
  chapter: string;
  text: string;
  [key: string]: string;
}

/**
 * Store a single text embedding in Pinecone.
 *
 * @param id       Unique vector ID (e.g. `${topicId}_chunk_0`)
 * @param text     The raw text to embed and store
 * @param metadata Metadata saved alongside the vector (courseId, topicId, chapter, text, …)
 */
export async function storeEmbedding(
  id: string,
  text: string,
  metadata: EmbeddingMetadata
): Promise<void> {
  const vector = await generateEmbedding(text);
  console.log(`[VectorStore] Embedding vector size: ${vector.length} for id: ${id}`);
  const index = getPineconeIndex();

  await index.namespace(pineconeConfig.namespace).upsert([
    {
      id,
      values: vector,
      metadata: { ...metadata, text },
    },
  ]);
  console.log(`[VectorStore] Upserted vector — id: ${id}, namespace: ${pineconeConfig.namespace}`);
  console.log('[VectorStore] Sample vector metadata:', JSON.stringify({ courseId: metadata.courseId, topicId: metadata.topicId, chapter: metadata.chapter }));
}

/**
 * Vector store management utilities
 */
class VectorStore {
  /**
   * Delete all vectors for a specific topic
   */
  async deleteTopicVectors(topicId: string): Promise<void> {
    const index = getPineconeIndex();
    await index.namespace(pineconeConfig.namespace).deleteMany({
      filter: { topicId: { $eq: topicId } },
    });
  }

  /**
   * Delete all vectors for a course
   */
  async deleteCourseVectors(courseId: string): Promise<void> {
    const index = getPineconeIndex();
    await index.namespace(pineconeConfig.namespace).deleteMany({
      filter: { courseId: { $eq: courseId } },
    });
  }

  /**
   * Get stats for the vector store
   */
  async getStats(): Promise<unknown> {
    const index = getPineconeIndex();
    return index.describeIndexStats();
  }

  /**
   * Check if vectors exist for a topic
   */
  async hasVectors(topicId: string): Promise<boolean> {
    const index = getPineconeIndex();
    // Query with a dummy vector to check existence (384 dims for BAAI/bge-small-en-v1.5)
    const results = await index.namespace(pineconeConfig.namespace).query({
      vector: new Array(384).fill(0),
      topK: 1,
      filter: { topicId: { $eq: topicId } },
    });

    return (results.matches?.length ?? 0) > 0;
  }
}

export const vectorStore = new VectorStore();
