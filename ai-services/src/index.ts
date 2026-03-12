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
    // pdf-parse v2 exports a class: new PDFParse({ data: buffer }).getText()
    const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer; verbosity?: number }) => { getText: () => Promise<{ text: string; total: number }> } };
    const fs = require('fs');

    const { filePath, courseId, chapterId, chapterTitle } = req.body;

    console.log(`[IngestFile] Request — filePath: ${filePath}, courseId: ${courseId}`);

    if (!filePath || !courseId) {
      res.status(400).json({ success: false, error: 'filePath and courseId are required' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      console.error(`[IngestFile] ERROR: File not found at path: ${filePath}`);
      res.status(404).json({ success: false, error: `File not found: ${filePath}` });
      return;
    }

    const buffer: Buffer = fs.readFileSync(filePath);
    console.log(`[IngestFile] File read — size: ${buffer.length} bytes`);

    const pdfResult = await new PDFParse({ data: buffer, verbosity: 0 }).getText();
    const rawText: string = pdfResult.text?.trim() ?? '';

    console.log(`[IngestFile] PDF text length: ${rawText.length} chars, estimated pages: ${pdfResult.total}`);

    if (!rawText) {
      console.error('[IngestFile] ERROR: PDF extraction failed — text length is 0');
      res.status(422).json({ success: false, error: 'Could not extract text from PDF' });
      return;
    }

    const chunkCount = await ingestCurriculum({
      courseId,
      topicId: chapterId ?? 'unknown',
      chapterTitle: chapterTitle ?? 'Untitled Chapter',
      rawText,
    });

    console.log(`[IngestFile] SUCCESS — chunkCount: ${chunkCount}, textLength: ${rawText.length}`);
    res.json({ success: true, data: { chunkCount, textLength: rawText.length } });
  } catch (error: any) {
    console.error('[IngestFile] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ingest PDF from a remote URL (e.g. Supabase) — pdf-parse lives in ai-services, not Next.js
app.post('/ingest-url', async (req, res) => {
  try {
    const { ingestCurriculum } = await import('./pipelines/ingestCurriculum');
    // pdf-parse v2 exports a class: new PDFParse({ data: buffer }).getText()
    const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer; verbosity?: number }) => { getText: () => Promise<{ text: string; total: number }> } };

    const { fileUrl, courseId, topicId, chapterTitle } = req.body;

    console.log(`[IngestUrl] Request — fileUrl: ${fileUrl}, courseId: ${courseId}, topicId: ${topicId}`);

    if (!fileUrl || !courseId) {
      res.status(400).json({ success: false, error: 'fileUrl and courseId are required' });
      return;
    }

    // Fetch PDF bytes from the remote URL (Supabase public URL)
    let buffer: Buffer;
    try {
      const fileRes = await fetch(fileUrl as string);
      if (!fileRes.ok) {
        console.error(`[IngestUrl] ERROR: Failed to fetch PDF — HTTP ${fileRes.status}: ${fileUrl}`);
        res.status(422).json({ success: false, error: `Failed to fetch file from URL: HTTP ${fileRes.status}` });
        return;
      }
      buffer = Buffer.from(await fileRes.arrayBuffer());
      console.log(`[IngestUrl] PDF fetched — size: ${buffer.length} bytes`);
    } catch (fetchErr: any) {
      console.error(`[IngestUrl] ERROR: Fetch failed — ${fetchErr.message}`);
      res.status(422).json({ success: false, error: `File fetch error: ${fetchErr.message}` });
      return;
    }

    // Parse PDF text using pdf-parse v2 class API
    const pdfResult = await new PDFParse({ data: buffer, verbosity: 0 }).getText();
    const rawText: string = pdfResult.text?.trim() ?? '';

    console.log(`[IngestUrl] PDF text length: ${rawText.length} chars, pages: ${pdfResult.total}`);

    if (!rawText) {
      console.error('[IngestUrl] ERROR: PDF extraction failed — text length is 0');
      res.status(422).json({ success: false, error: 'Could not extract text from PDF — file may be image-only or encrypted' });
      return;
    }

    const chunkCount = await ingestCurriculum({
      courseId,
      topicId: topicId ?? 'unknown',
      chapterTitle: chapterTitle ?? 'Untitled Chapter',
      rawText,
    });

    console.log(`[IngestUrl] SUCCESS — chunkCount: ${chunkCount}, textLength: ${rawText.length}`);
    res.json({ success: true, data: { chunkCount, textLength: rawText.length } });
  } catch (error: any) {
    console.error('[IngestUrl] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Curriculum ingestion — called after a teacher uploads a PDF
app.post('/ingest', async (req, res) => {
  try {
    const { ingestCurriculum } = await import('./pipelines/ingestCurriculum');

    const { courseId, topicId, chapterId, chapterTitle, rawText } = req.body;

    console.log(`[/ingest] Request — courseId: ${courseId}, topicId: ${topicId ?? chapterId}, rawText length: ${rawText?.length ?? 0}`);

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

    console.log(`[/ingest] SUCCESS — chunkCount: ${chunkCount}`);
    res.json({ success: true, data: { chunkCount } });
  } catch (error: any) {
    console.error('[/ingest] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mindmap generation — converts an AI answer into Mermaid mindmap syntax
app.post('/mindmap', async (req, res) => {
  try {
    const { answer, question } = req.body;

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      res.status(400).json({ success: false, error: 'answer is required' });
      return;
    }

    const { groqConfig } = await import('./config/groq');

    const systemPrompt = `You are an expert educational content visualiser. Your job is to create Mermaid mindmap diagrams about a given topic.
Rules:
- Output ONLY valid Mermaid mindmap syntax — no code fences, no markdown, no extra text.
- Start with: mindmap
- The root node is the main topic in double parentheses: root((Topic Name))
- Keep node labels concise (2-5 words max)
- Maximum depth: 3 levels
- Maximum 20 nodes total
- Use proper 2-space indentation for each level
- Focus on educational subtopics, key concepts, and important details about the topic`;

    // If a user question is provided, use it as the primary topic signal;
    // the answer is supplemental context about what the AI explained.
    const topicHint = question?.trim()
      ? `The student asked about: "${question.trim()}"\n\nThe AI tutor's explanation (use as context):\n${answer.trim()}`
      : `The AI tutor's explanation:\n${answer.trim()}`;

    const userPrompt = `Create a Mermaid mindmap for this educational topic.\n\n${topicHint}\n\nIMPORTANT: The root node must be the main subject/topic (e.g. root((Network Topologies))). Return ONLY valid Mermaid mindmap syntax starting with "mindmap".`;

    const completion = await groqConfig.client.chat.completions.create({
      model: groqConfig.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // Strip accidental code fences
    const chart = raw
      .replace(/^```(?:mermaid)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    if (!chart.startsWith('mindmap')) {
      res.status(502).json({ success: false, error: 'Invalid mindmap output from AI' });
      return;
    }

    res.json({ success: true, chart });
  } catch (error: any) {
    console.error('[/mindmap] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Tutor (RAG + Groq + semantic cache)
app.post('/tutor', async (req, res) => {
  try {
    const { askTutor } = await import('./pipelines/aiTutor');

    const { question, courseId } = req.body;

    console.log(`[/tutor] Request — question: "${String(question ?? '').slice(0, 100)}"`);

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
// Quiz Generation (RAG-based)
// ========================

// Generate quiz questions from chapter curriculum content
app.post('/generate-quiz', async (req, res) => {
  try {
    const { generateQuiz } = await import('./pipelines/quizGenerationPipeline');

    const { courseId, chapterId, numberOfQuestions = 5, difficulty = 'medium' } = req.body;

    if (!courseId || !chapterId) {
      res.status(400).json({ success: false, error: 'courseId and chapterId are required' });
      return;
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    const safeDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';

    const result = await generateQuiz({
      courseId,
      chapterId,
      numberOfQuestions: Math.min(Math.max(1, Number(numberOfQuestions)), 20),
      difficulty: safeDifficulty as 'easy' | 'medium' | 'hard',
    });

    res.json({ success: true, questions: result.questions });
  } catch (error: any) {
    console.error('[/generate-quiz]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// POST /evaluate-assignment (AI Assignment Evaluation)
// ========================
app.post('/evaluate-assignment', async (req, res) => {
  try {
    const { evaluateAssignment } = await import('./pipelines/evaluationPipeline');
    const {
      submissionText,
      assignmentTitle,
      assignmentDescription,
      evaluationPoints,
      courseId,
      chapterId,
    } = req.body;

    if (!submissionText || typeof submissionText !== 'string') {
      return res.status(400).json({ success: false, error: 'submissionText is required' });
    }
    if (!assignmentTitle || typeof assignmentTitle !== 'string') {
      return res.status(400).json({ success: false, error: 'assignmentTitle is required' });
    }

    const result = await evaluateAssignment({
      submissionText: String(submissionText).trim(),
      assignmentTitle: String(assignmentTitle).trim(),
      assignmentDescription: String(assignmentDescription ?? '').trim(),
      evaluationPoints: String(evaluationPoints ?? '').trim(),
      courseId: String(courseId ?? ''),
      chapterId: String(chapterId ?? ''),
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[/evaluate-assignment]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// POST /adaptive-resources
// ========================
app.post('/adaptive-resources', async (req, res) => {
  try {
    const { generateAdaptiveResources } = await import('./pipelines/adaptiveResourcePipeline');
    const { concept, courseId, chapterId } = req.body;

    if (!concept || !courseId || !chapterId) {
      return res.status(400).json({
        success: false,
        error: 'concept, courseId, and chapterId are required',
      });
    }

    const result = await generateAdaptiveResources({
      concept: String(concept).trim(),
      courseId: String(courseId),
      chapterId: String(chapterId),
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[/adaptive-resources]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// POST /generate-adaptive-quiz
// ========================
app.post('/generate-adaptive-quiz', async (req, res) => {
  try {
    const { generateAdaptiveQuiz } = await import('./pipelines/adaptiveQuizPipeline');
    const { courseId = '', chapterId = '', weakConcepts, numberOfQuestions } = req.body;

    if (!Array.isArray(weakConcepts) || weakConcepts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty weakConcepts array is required',
      });
    }

    const clampedCount = Math.min(Math.max(1, Number(numberOfQuestions) || 5), 20);

    const result = await generateAdaptiveQuiz({
      courseId: String(courseId),
      chapterId: String(chapterId),
      weakConcepts: weakConcepts.map((c: any) =>
        typeof c === 'string' ? c.trim() : String(c.concept ?? c).trim()
      ).filter(Boolean),
      numberOfQuestions: clampedCount,
    });

    res.json({ success: true, questions: result.questions });
  } catch (error: any) {
    console.error('[/generate-adaptive-quiz]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// POST /adaptive-summary
// ========================
app.post('/adaptive-summary', async (req, res) => {
  try {
    const { generateAdaptiveSummary } = await import('./pipelines/adaptiveSummaryPipeline');
    const { courseId = '', weakConcepts } = req.body;

    if (!Array.isArray(weakConcepts) || weakConcepts.length === 0) {
      return res.status(400).json({ success: false, error: 'A non-empty weakConcepts array is required' });
    }

    const conceptList: string[] = weakConcepts
      .map((c: any) => (typeof c === 'string' ? c.trim() : String(c.concept ?? c).trim()))
      .filter(Boolean)
      .slice(0, 10); // cap at 10 concepts per request

    if (conceptList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid concept names found in weakConcepts' });
    }

    const data = await generateAdaptiveSummary({ courseId: String(courseId), weakConcepts: conceptList });

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[/adaptive-summary]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================
// ========================
// Cache Management Endpoints
// ========================

/**
 * POST /cache/purge-fallbacks
 * Scans all Redis cache entries and deletes any that contain a fallback
 * "no material" response. Safe to call at any time.
 */
app.post('/cache/purge-fallbacks', async (_req, res) => {
  try {
    const { isFallbackResponse } = await import('./cache/semanticCache');
    const redis = (await import('./cache/semanticCache')).default;

    const keys = await redis.keys('scache:*');
    let deleted = 0;
    let kept = 0;
    const deletedKeys: string[] = [];

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as { response: string };
        if (isFallbackResponse(entry.response)) {
          await redis.del(key);
          deletedKeys.push(key);
          deleted++;
        } else {
          kept++;
        }
      } catch {
        // Corrupt entry — delete it too
        await redis.del(key);
        deleted++;
      }
    }

    console.log(`[Cache] purge-fallbacks — deleted: ${deleted}, kept: ${kept}`);
    res.json({ success: true, deleted, kept, deletedKeys });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /cache
 * Clears cache entries by filter. Body params (all optional):
 *   - all: true          → wipe entire scache:* namespace
 *   - pattern: string    → delete keys matching this substring in the response text
 *   - fallbacksOnly: true → same as POST /cache/purge-fallbacks
 */
app.delete('/cache', async (req, res) => {
  try {
    const { isFallbackResponse } = await import('./cache/semanticCache');
    const redis = (await import('./cache/semanticCache')).default;
    const { all, pattern, fallbacksOnly } = req.body as {
      all?: boolean;
      pattern?: string;
      fallbacksOnly?: boolean;
    };

    const keys = await redis.keys('scache:*');
    let deleted = 0;
    let kept = 0;

    if (all) {
      // Wipe entire cache
      if (keys.length > 0) await redis.del(...keys);
      deleted = keys.length;
      console.log(`[Cache] DELETE all — wiped ${deleted} entries`);
    } else {
      for (const key of keys) {
        const raw = await redis.get(key);
        if (!raw) continue;
        let shouldDelete = false;
        try {
          const entry = JSON.parse(raw) as { response: string };
          if (fallbacksOnly && isFallbackResponse(entry.response)) shouldDelete = true;
          if (pattern && entry.response.toLowerCase().includes(pattern.toLowerCase())) shouldDelete = true;
        } catch {
          shouldDelete = true; // corrupt — remove
        }
        if (shouldDelete) {
          await redis.del(key);
          deleted++;
        } else {
          kept++;
        }
      }
      console.log(`[Cache] DELETE filtered — deleted: ${deleted}, kept: ${kept}`);
    }

    res.json({ success: true, deleted, kept, totalScanned: keys.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /cache/stats
 * Returns counts of total entries, fallback entries, and valid entries.
 */
app.get('/cache/stats', async (_req, res) => {
  try {
    const { isFallbackResponse } = await import('./cache/semanticCache');
    const redis = (await import('./cache/semanticCache')).default;

    const keys = await redis.keys('scache:*');
    let fallbacks = 0;
    let valid = 0;
    let corrupt = 0;

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as { response: string };
        if (isFallbackResponse(entry.response)) fallbacks++;
        else valid++;
      } catch {
        corrupt++;
      }
    }

    res.json({ success: true, total: keys.length, valid, fallbacks, corrupt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================
// GET /debug/rag — RAG Diagnostic Endpoint
// ========================
app.get('/debug/rag', async (_req, res) => {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    fileUpload: 'N/A (check frontend logs)',
    pdfExtraction: 'N/A (check /ingest logs)',
    chunking: 'N/A (check /ingest logs)',
    embeddings: 'unknown',
    pineconeUpsert: 'unknown',
    pineconeVectorCount: 0,
    namespaces: {},
    testQueryMatches: 0,
    tutorRetrieval: 'unknown',
    groqGeneration: 'unknown',
  };

  // Step 1: Pinecone stats
  try {
    const { getPineconeIndex, pineconeConfig } = await import('./config/pinecone');
    const index = getPineconeIndex();
    const stats = await index.describeIndexStats();
    const totalVectors = stats.totalRecordCount ?? 0;
    const namespaces = stats.namespaces ?? {};
    report.pineconeVectorCount = totalVectors;
    report.namespaces = namespaces;
    report.pineconeUpsert = totalVectors > 0 ? 'OK' : 'FAIL — no vectors found';
    console.log(`[DebugRAG] Pinecone Stats \u2014 Index: ${pineconeConfig.indexName}, Vectors: ${totalVectors}, Namespaces: ${JSON.stringify(namespaces)}`);
  } catch (err: any) {
    report.pineconeUpsert = `FAIL — ${err.message}`;
    console.error('[DebugRAG] Pinecone stats error:', err.message);
  }

  // Step 2: Test embedding generation
  const testQuery = 'What is a stack?';
  try {
    const { generateEmbedding } = await import('./rag/embeddings');
    const vec = await generateEmbedding(testQuery);
    report.embeddings = `OK — vector size: ${vec.length}`;
    console.log(`[DebugRAG] Embedding OK \u2014 size: ${vec.length}`);
  } catch (err: any) {
    report.embeddings = `FAIL — ${err.message}`;
    console.error('[DebugRAG] Embedding error:', err.message);
  }

  // Step 3a: Raw Pinecone query (bypasses score filter) to see actual scores
  try {
    const { getPineconeIndex, pineconeConfig } = await import('./config/pinecone');
    const { generateEmbedding } = await import('./rag/embeddings');
    const queryVec = await generateEmbedding(testQuery);
    const idx = getPineconeIndex();
    const rawResults = await idx.namespace(pineconeConfig.namespace).query({
      vector: queryVec,
      topK: 5,
      includeMetadata: true,
    });
    const rawMatches = rawResults.matches || [];
    report.rawPineconeMatches = rawMatches.length;
    report.rawPineconeScores = rawMatches.map(m => ({ id: m.id, score: m.score }));
    console.log(`[DebugRAG] Raw Pinecone query — ${rawMatches.length} matches. Scores: ${rawMatches.map(m => m.score?.toFixed(4)).join(', ')}`);
  } catch (err: any) {
    report.rawPineconeMatches = `FAIL — ${(err as Error).message}`;
    console.error('[DebugRAG] Raw Pinecone query error:', (err as Error).message);
  }

  // Step 3b: Test retrieval through retriever (with score filter)
  try {
    const { retrieveRelevantChunks } = await import('./rag/retriever');
    const matches = await retrieveRelevantChunks(testQuery);
    report.testQueryMatches = matches.length;
    report.tutorRetrieval = matches.length > 0 ? 'OK' : 'FAIL — 0 matches returned';
    report.sampleChunks = matches.slice(0, 2).map((m) => ({ score: m.score, text: m.text.slice(0, 150) }));
    console.log(`[DebugRAG] Test query "${testQuery}" \u2014 matches: ${matches.length}`);
  } catch (err: any) {
    report.tutorRetrieval = `FAIL — ${err.message}`;
    console.error('[DebugRAG] Retrieval error:', err.message);
  }

  // Step 4: Test Groq LLM (lightweight ping)
  try {
    const { default: groq, groqConfig } = await import('./config/groq');
    const completion = await groq.chat.completions.create({
      model: groqConfig.defaultModel,
      messages: [{ role: 'user', content: 'Reply with: OK' }],
      max_tokens: 5,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? '';
    report.groqGeneration = reply ? 'OK' : 'FAIL — empty response';
    console.log(`[DebugRAG] Groq ping reply: "${reply}"`);
  } catch (err: any) {
    report.groqGeneration = `FAIL — ${err.message}`;
    console.error('[DebugRAG] Groq error:', err.message);
  }

  // Final diagnostic summary
  console.log('\n========= RAG Diagnostic Report =========');
  console.log('File upload:          ', report.fileUpload);
  console.log('PDF extraction:       ', report.pdfExtraction);
  console.log('Chunking:             ', report.chunking);
  console.log('Embeddings:           ', report.embeddings);
  console.log('Pinecone upsert:      ', report.pineconeUpsert);
  console.log('Pinecone vector count:', report.pineconeVectorCount);
  console.log('Tutor retrieval:      ', report.tutorRetrieval);
  console.log('Groq generation:      ', report.groqGeneration);
  console.log('=========================================\n');

  res.json({ success: true, diagnostics: report });
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
