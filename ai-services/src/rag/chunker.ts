import { RAG } from '@intellicampus/shared';

export interface TextChunk {
  text: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

class Chunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize = RAG.CHUNK_SIZE, chunkOverlap = RAG.CHUNK_OVERLAP) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Split text into overlapping chunks
   */
  chunkText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];

    if (!text || text.length === 0) return chunks;

    // Clean the text
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // First try to split by paragraphs/sections
    const paragraphs = cleanedText.split(/\n\n+/);

    let currentChunk = '';
    let chunkIndex = 0;
    let startChar = 0;

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
          metadata: {
            startChar,
            endChar: startChar + currentChunk.length,
          },
        });

        // Apply overlap: keep last N characters
        const overlapText = currentChunk.slice(-this.chunkOverlap);
        startChar = startChar + currentChunk.length - overlapText.length;
        currentChunk = overlapText;
        chunkIndex++;
      }

      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          startChar,
          endChar: startChar + currentChunk.length,
        },
      });
    }

    return chunks;
  }

  /**
   * Chunk by sentences (alternative strategy)
   */
  chunkBySentences(text: string, sentencesPerChunk = 5): TextChunk[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: TextChunk[] = [];
    let charOffset = 0;

    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
      const chunkText = chunkSentences.join(' ').trim();

      chunks.push({
        text: chunkText,
        index: chunks.length,
        metadata: {
          startChar: charOffset,
          endChar: charOffset + chunkText.length,
        },
      });

      charOffset += chunkText.length;
    }

    return chunks;
  }
}

export const chunker = new Chunker();
