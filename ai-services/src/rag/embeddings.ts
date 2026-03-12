import { HfInference } from '@huggingface/inference';

const apiKey = process.env.HUGGINGFACE_API_KEY;

if (!apiKey) {
  throw new Error('Missing required environment variable: HUGGINGFACE_API_KEY');
}

const hf = new HfInference(apiKey);

const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';

/**
 * Generates an embedding vector for the given text using Hugging Face's
 * BAAI/bge-small-en-v1.5 model via the feature-extraction API.
 *
 * Used by all RAG pipelines (ingestion, retrieval, AI Tutor, quiz generation).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('generateEmbedding: input text must not be empty');
  }

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    });

    // featureExtraction returns number[] | number[][] depending on input shape
    if (Array.isArray(result) && typeof result[0] === 'number') {
      const vec = result as number[];
      console.log(`[Embeddings] Generated embedding — model: ${EMBEDDING_MODEL}, dims: ${vec.length}`);
      return vec;
    }
    // Some models return [[...]] for a single input
    if (Array.isArray(result) && Array.isArray(result[0])) {
      const vec = (result as number[][])[0];
      console.log(`[Embeddings] Generated embedding — model: ${EMBEDDING_MODEL}, dims: ${vec.length}`);
      return vec;
    }

    throw new Error('Unexpected embedding response shape from Hugging Face API');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Embeddings] ERROR: Embedding generation failed — ${message}`);
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}

/**
 * Generates embeddings for a batch of texts in a single HuggingFace API call.
 * Handles all tensor shapes the API may return:
 *   - number[][]   (batch × dims)   → return as-is
 *   - number[][][] (batch × tokens × dims) → mean-pool over token dimension
 * Falls back to sequential single calls if shape remains unexpected.
 */
export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: texts,
    });

    const arr = result as unknown;

    // Case 1: number[][] — already mean-pooled batch (batch × dims)
    if (
      Array.isArray(arr) &&
      arr.length === texts.length &&
      Array.isArray(arr[0]) &&
      typeof (arr as number[][])[0][0] === 'number'
    ) {
      const vecs = arr as number[][];
      console.log(`[Embeddings] Batch embedded ${vecs.length} texts, dims: ${vecs[0]?.length ?? 0}`);
      return vecs;
    }

    // Case 2: number[][][] — per-token embeddings (batch × tokens × dims)
    // Mean-pool across the token dimension
    if (
      Array.isArray(arr) &&
      arr.length === texts.length &&
      Array.isArray(arr[0]) &&
      Array.isArray((arr as number[][][])[0][0])
    ) {
      const tokenEmbeddings = arr as number[][][];
      const vecs = tokenEmbeddings.map((tokenVecs) => {
        const dims = tokenVecs[0].length;
        const mean = new Array(dims).fill(0);
        for (const tv of tokenVecs) {
          for (let d = 0; d < dims; d++) mean[d] += tv[d];
        }
        return mean.map((v) => v / tokenVecs.length);
      });
      console.log(`[Embeddings] Batch embedded (mean-pooled) ${vecs.length} texts, dims: ${vecs[0]?.length ?? 0}`);
      return vecs;
    }

    // Fallback: unexpected shape — generate one-by-one
    console.warn('[Embeddings] Batch API returned unexpected shape — falling back to sequential single calls');
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await generateEmbedding(text));
    }
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Embeddings] ERROR: Batch embedding failed — ${message}`);
    // Fallback to sequential on any API error
    console.warn('[Embeddings] Falling back to sequential embedding due to batch error');
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await generateEmbedding(text));
    }
    return results;
  }
}
