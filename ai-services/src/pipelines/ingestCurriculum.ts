import { chunker } from '../rag/chunker';
import { storeEmbedding, EmbeddingMetadata } from '../rag/vectorStore';

export interface IngestCurriculumInput {
  courseId: string;
  topicId: string;
  chapterTitle: string;
  rawText: string;
}

/**
 * Ingest curriculum content into the vector store.
 *
 * Splits rawText into ~500-char chunks with 100-char overlap, generates
 * embeddings for each chunk, and stores them in Pinecone.
 *
 * @returns Number of chunks stored
 */
export async function ingestCurriculum(
  input: IngestCurriculumInput
): Promise<number> {
  const { courseId, topicId, chapterTitle, rawText } = input;

  if (!rawText.trim()) {
    throw new Error('ingestCurriculum: rawText must not be empty');
  }

  // ~500 tokens ≈ ~1000 characters; overlap ~100 tokens ≈ ~200 characters
  // (uses shared RAG defaults: CHUNK_SIZE=1000, CHUNK_OVERLAP=200)
  const chunks = chunker.chunkText(rawText);

  if (chunks.length === 0) return 0;

  await Promise.all(
    chunks.map((chunk) => {
      const id = `${topicId}_chunk_${chunk.index}_${Date.now()}`;
      return storeEmbedding(id, chunk.text, {
        courseId,
        topicId,
        chapter: chapterTitle,
        text: chunk.text,
      });
    })
  );

  return chunks.length;
}
