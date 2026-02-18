import openai, { openaiConfig } from '../config/openai';
import { getIndex, pineconeConfig } from '../config/pinecone';
import { TextChunk } from './chunker';

interface EmbeddingMetadata {
  topicId: string;
  courseId: string;
  [key: string]: string;
}

class Embedder {
  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: openaiConfig.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
      model: openaiConfig.embeddingModel,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }

  /**
   * Embed chunks and store in Pinecone
   */
  async embedAndStore(
    chunks: TextChunk[],
    metadata: EmbeddingMetadata
  ): Promise<string[]> {
    if (chunks.length === 0) return [];

    const texts = chunks.map((c) => c.text);
    const embeddings = await this.embedBatch(texts);

    const index = getIndex();
    const vectors = chunks.map((chunk, i) => ({
      id: `${metadata.topicId}_chunk_${chunk.index}_${Date.now()}`,
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        chunkIndex: chunk.index,
        ...metadata,
      },
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.namespace(pineconeConfig.namespace).upsert(batch);
    }

    return vectors.map((v) => v.id);
  }
}

export const embedder = new Embedder();
