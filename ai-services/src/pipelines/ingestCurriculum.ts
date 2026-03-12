import { chunker } from '../rag/chunker';
import { generateEmbeddingBatch } from '../rag/embeddings';
import { getPineconeIndex, pineconeConfig } from '../config/pinecone';

export interface IngestCurriculumInput {
  courseId: string;
  topicId: string;
  chapterTitle: string;
  rawText: string;
}

/** Batch size for HuggingFace embedding API calls — avoids rate-limit failures on large PDFs */
const EMBED_BATCH_SIZE = 32;

/**
 * Ingest curriculum content into the vector store.
 *
 * Splits rawText into ~1000-char chunks with 200-char overlap, generates
 * embeddings in sequential batches (to avoid HuggingFace rate limits),
 * and upserts them into Pinecone.
 *
 * @returns Number of chunks stored
 */
export async function ingestCurriculum(
  input: IngestCurriculumInput
): Promise<number> {
  const { courseId, topicId, chapterTitle, rawText } = input;

  console.log(`[IngestCurriculum] Starting ingestion — courseId: ${courseId}, topicId: ${topicId}, chapterTitle: "${chapterTitle}"`);
  console.log(`[IngestCurriculum] PDF text length: ${rawText.length} chars`);

  if (!rawText.trim()) {
    throw new Error('ingestCurriculum: rawText must not be empty');
  }

  const chunks = chunker.chunkText(rawText);

  console.log(`[IngestCurriculum] Chunks generated: ${chunks.length}`);

  if (chunks.length === 0) {
    console.error('[IngestCurriculum] ERROR: Chunking returned empty array — aborting ingest');
    return 0;
  }

  const index = getPineconeIndex();
  const now = Date.now();
  let totalUpserted = 0;

  // Process in sequential batches to avoid HuggingFace rate limits
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const batchNum = Math.floor(i / EMBED_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / EMBED_BATCH_SIZE);
    console.log(`[IngestCurriculum] Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)…`);

    const embeddings = await generateEmbeddingBatch(batch.map((c) => c.text));

    const vectors = batch.map((chunk, j) => ({
      id: `${topicId}_chunk_${chunk.index}_${now}`,
      values: embeddings[j],
      metadata: {
        courseId,
        topicId,
        chapter: chapterTitle,
        text: chunk.text,
      },
    }));

    await index.namespace(pineconeConfig.namespace).upsert(vectors);
    totalUpserted += vectors.length;
    console.log(`[IngestCurriculum] Upserted batch ${batchNum}/${totalBatches} — total so far: ${totalUpserted}`);
  }

  console.log(`[IngestCurriculum] SUCCESS — ${totalUpserted} chunks stored for topicId: ${topicId}`);
  return totalUpserted;
}
