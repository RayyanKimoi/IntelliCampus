import { getIndex, pineconeConfig } from '../config/pinecone';

/**
 * Vector store management utilities
 */
class VectorStore {
  /**
   * Delete all vectors for a specific topic
   */
  async deleteTopicVectors(topicId: string): Promise<void> {
    const index = getIndex();
    await index.namespace(pineconeConfig.namespace).deleteMany({
      filter: { topicId: { $eq: topicId } },
    });
  }

  /**
   * Delete all vectors for a course
   */
  async deleteCourseVectors(courseId: string): Promise<void> {
    const index = getIndex();
    await index.namespace(pineconeConfig.namespace).deleteMany({
      filter: { courseId: { $eq: courseId } },
    });
  }

  /**
   * Get stats for the vector store
   */
  async getStats(): Promise<any> {
    const index = getIndex();
    const stats = await index.describeIndexStats();
    return stats;
  }

  /**
   * Check if vectors exist for a topic
   */
  async hasVectors(topicId: string): Promise<boolean> {
    const index = getIndex();
    // Query with a dummy vector to check existence
    const results = await index.namespace(pineconeConfig.namespace).query({
      vector: new Array(1536).fill(0), // dimension for text-embedding-3-small
      topK: 1,
      filter: { topicId: { $eq: topicId } },
    });

    return (results.matches?.length || 0) > 0;
  }
}

export const vectorStore = new VectorStore();
