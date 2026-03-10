// pdf-parse is marked as serverExternalPackages in next.config.js so Node.js
// handles the require directly without webpack bundling.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * Extracts plain text from a PDF buffer.
 * Used after teacher uploads a PDF to prepare content for RAG ingestion.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

/**
 * Extracts plain text from a file buffer based on MIME type.
 * Currently supports PDF; extend here for DOCX/PPTX if needed.
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  // Other types (DOCX, PPTX) require additional libraries — skip for now
  return null;
}
