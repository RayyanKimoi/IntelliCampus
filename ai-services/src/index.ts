import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Resolve to frontend/.env (contains all shared credentials)
dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env') });

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========================
// Health Check
// ========================
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'IntelliCampus AI Services',
    timestamp: new Date().toISOString(),
  });
});

// ========================
// RAG Pipeline Endpoints
// ========================

// Embed curriculum content
app.post('/embed', async (req, res) => {
  try {
    const { embedder } = await import('./rag/embedder');
    const { chunker } = await import('./rag/chunker');

    const { content, topicId, courseId, metadata } = req.body;

    // Chunk the content
    const chunks = chunker.chunkText(content);

    // Generate embeddings and store
    const embeddingIds = await embedder.embedAndStore(chunks, {
      topicId,
      courseId,
      ...metadata,
    });

    res.json({ success: true, data: { embeddingIds, chunkCount: chunks.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Query RAG pipeline
app.post('/query', async (req, res) => {
  try {
    const { learningPipeline } = await import('./pipelines/learningPipeline');

    const { query, topicId, courseId, mode, studentLevel, masteryScore } = req.body;

    const response = await learningPipeline.process({
      query,
      topicId,
      courseId,
      mode: mode || 'learning',
      studentLevel: studentLevel || 'beginner',
      masteryScore: masteryScore || 0,
    });

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assessment query (hint-only mode)
app.post('/assessment-query', async (req, res) => {
  try {
    const { assessmentPipeline } = await import('./pipelines/assessmentPipeline');

    const { query, topicId, courseId, strictMode } = req.body;

    const response = await assessmentPipeline.process({
      query,
      topicId,
      courseId,
      strictMode: strictMode || false,
    });

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Voice endpoints
app.post('/voice/stt', async (req, res) => {
  try {
    const { speechToText } = await import('./voice/speechToText');
    const { audioData, language } = req.body;
    const text = await speechToText.transcribe(audioData, language);
    res.json({ success: true, data: { text } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/voice/tts', async (req, res) => {
  try {
    const { textToSpeechService } = await import('./voice/textToSpeech');
    const { text } = req.body;
    const audioUrl = await textToSpeechService.synthesize(text);
    res.json({ success: true, data: { audioUrl } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Curriculum ingestion from a file path — avoids PDF parsing issues in Next.js webpack
app.post('/ingest-file', async (req, res) => {
  try {
    const { ingestCurriculum } = await import('./pipelines/ingestCurriculum');
    const { PDFParse } = require('pdf-parse');
    const fs = require('fs');

    const { filePath, courseId, chapterId, chapterTitle } = req.body;

    if (!filePath || !courseId) {
      res.status(400).json({ success: false, error: 'filePath and courseId are required' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: `File not found: ${filePath}` });
      return;
    }

    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const pdfResult = await parser.getText();
    const rawText: string = pdfResult.text?.trim() ?? '';

    if (!rawText) {
      res.status(422).json({ success: false, error: 'Could not extract text from PDF' });
      return;
    }

    const chunkCount = await ingestCurriculum({
      courseId,
      topicId: chapterId ?? 'unknown',
      chapterTitle: chapterTitle ?? 'Untitled Chapter',
      rawText,
    });

    res.json({ success: true, data: { chunkCount, textLength: rawText.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Curriculum ingestion — called after a teacher uploads a PDF
app.post('/ingest', async (req, res) => {
  try {
    const { ingestCurriculum } = await import('./pipelines/ingestCurriculum');

    const { courseId, topicId, chapterId, chapterTitle, rawText } = req.body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      res.status(400).json({ success: false, error: 'rawText is required' });
      return;
    }
    if (!courseId) {
      res.status(400).json({ success: false, error: 'courseId is required' });
      return;
    }

    const chunkCount = await ingestCurriculum({
      courseId,
      topicId: topicId ?? chapterId ?? 'unknown',
      chapterTitle: chapterTitle ?? 'Untitled Chapter',
      rawText: rawText.trim(),
    });

    res.json({ success: true, data: { chunkCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Tutor (RAG + Groq + semantic cache)
app.post('/tutor', async (req, res) => {
  try {
    const { askTutor } = await import('./pipelines/aiTutor');

    const { question, courseId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ success: false, error: 'question is required' });
      return;
    }

    const result = await askTutor({ question: question.trim(), courseId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║      IntelliCampus AI Services           ║
  ║──────────────────────────────────────────║
  ║  Port:    ${String(PORT).padEnd(30)}║
  ║  RAG:     Ready                          ║
  ║  LLM:     OpenAI / Gemini               ║
  ║  Voice:   STT + TTS                      ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
