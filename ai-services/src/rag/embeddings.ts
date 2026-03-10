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
      return result as number[];
    }
    // Some models return [[...]] for a single input
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return (result as number[][])[0];
    }

    throw new Error('Unexpected embedding response shape from Hugging Face API');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}
