import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
