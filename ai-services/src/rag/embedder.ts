import openai, { openaiConfig } from '../config/openai';
import { getPineconeIndex, pineconeConfig } from '../config/pinecone';
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

    console.log(`[Embedder] Generated ${embeddings.length} embeddings, vector size: ${embeddings[0]?.length ?? 0}`);

    const index = getPineconeIndex();
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
    console.log(`[Embedder] Upserting ${vectors.length} vectors into namespace '${pineconeConfig.namespace}'`);
    if (vectors.length > 0) {
      console.log('[Embedder] Sample vector metadata:', JSON.stringify(vectors[0].metadata));
    }
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.namespace(pineconeConfig.namespace).upsert(batch);
      console.log(`[Embedder] Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} vectors)`);
    }
    console.log(`[Embedder] Upsert completed — total vectors: ${vectors.length}`);

    return vectors.map((v) => v.id);
  }
}

export const embedder = new Embedder();
