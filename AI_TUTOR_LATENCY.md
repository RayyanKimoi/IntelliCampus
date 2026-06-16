# AI Tutor Latency Analysis Report
**IntelliCampus — RAG Pipeline Performance Report**  
Generated: March 12, 2026

---

## 1. Architecture Overview

The AI Tutor is a **3-tier distributed system** connecting the student browser through two intermediate service layers to three external AI providers.

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDENT BROWSER                                                 │
│  React 19 / Next.js 15 App Router                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP POST /api/ai/tutor
                             │ (or /api/ai/chat)
┌────────────────────────────▼────────────────────────────────────┐
│  NEXT.JS FRONTEND  (port 3000)                                   │
│  frontend/src/app/api/ai/tutor/route.ts                          │
│  • Auth check (JWT)                                              │
│  • Input validation                                              │
│  • Proxy to AI Services                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP POST http://localhost:5000/tutor
                             │ (or /query for backend path)
┌────────────────────────────▼────────────────────────────────────┐
│  AI SERVICES  (Express, port 5000)                               │
│  ai-services/src/index.ts                                         │
│  ai-services/src/pipelines/aiTutor.ts      ← primary /tutor      │
│  ai-services/src/pipelines/learningPipeline.ts  ← /query         │
└──────┬─────────────────┬─────────────────────┬───────────────────┘
       │                 │                     │
┌──────▼──────┐  ┌───────▼───────┐  ┌─────────▼──────────┐
│  HUGGING    │  │   PINECONE    │  │    GROQ / OPENAI   │
│  FACE API   │  │  VECTOR DB    │  │    LLM INFERENCE   │
│ (Embeddings)│  │  (Retrieval)  │  │  (Text generation) │
└─────────────┘  └───────────────┘  └────────────────────┘
       ▲                                      
┌──────┴──────┐                               
│    REDIS    │                               
│   (Cache)   │                               
└─────────────┘                               
```

### Two Active Paths to the AI Tutor

| Path | Entry | Pipeline | LLM |
|------|-------|----------|-----|
| **Primary** | `POST /api/ai/tutor` (Frontend) → `/tutor` (AI Svc) | `aiTutor.ts` | Groq Llama-3.3-70b-versatile |
| **Alternate** | `POST /api/ai/chat` (Frontend) → Backend → `/query` (AI Svc) | `learningPipeline.ts` | OpenAI GPT-4o-mini |

---

## 2. Pipeline Call Flow

### Primary Path: `/api/ai/tutor` → `askTutor()`

```
Student submits question
        │
        ▼  [~5–20ms]
Next.js route.ts
  • JWT auth check
  • JSON parse + validate
        │
        ▼  [network + processing]
Express POST /tutor
        │
        ▼  [100–400ms]  ← STEP 1
generateEmbedding(question)
  HuggingFace Inference API
  Model: BAAI/bge-small-en-v1.5
  Output: 384-dim float vector
        │
        ▼  [30–500ms+]  ← STEP 2  (scales with cache size)
checkCache(queryEmbedding)
  redis.keys('scache:*')       ← 1 network call
  for each key:
    redis.get(key)             ← N sequential network calls
    cosineSimilarity()         ← in-process JS
  threshold: 0.92 cosine sim
        │
        ├── CACHE HIT → return immediately (total ~150–600ms)
        │
        ▼  [CACHE MISS]
        │
        ▼  [100–400ms]  ← STEP 3
retrieveRelevantChunks(question)
  → generateEmbedding(question)  ← 2nd HF API call (unfiltered)
  → pinecone.query({ topK: 5 })
  → filter by minScore
        │
        ▼  [<5ms]  ← STEP 4
Build context string
  chunks.map(c => c.text).join('\n\n')
        │
        ▼  [300–2000ms]  ← STEP 5  ← DOMINANT STAGE
groq.chat.completions.create()
  Model:      llama-3.3-70b-versatile
  max_tokens: 1024
  temperature: 0.7
        │
        ▼  [5–30ms]  ← STEP 6
storeCache(queryEmbedding, answer)
  redis.set(key, JSON(entry), 'EX', 86400)
        │
        ▼
Return { answer, fromCache, sources, latency }
```

### Alternate Path: `/api/ai/chat` → `learningPipeline.process()`

```
Student submits chat message
        │
        ▼
Next.js /api/ai/chat  →  Backend (port 4000)
  • Zod validation
  • DB: find/create AISession
  • DB: save student message
  • DB: read AIPolicySettings
        │
        ▼
backend/services/ai.service.ts.generateResponse()
  → POST http://localhost:5000/query
        │
        ▼  [100–400ms]
retriever.retrieveWithFallback(query, topicId, courseId)
  Attempt 1: retrieve(query, {topicId})
    → generateEmbedding()  [HF API]
    → pinecone.query()
  If <2 results:
  Attempt 2: retrieve(query, {courseId})
    → generateEmbedding()  [HF API AGAIN]
    → pinecone.query()
  Merge + deduplicate + sort
        │
        ▼  [<5ms]
Build prompt (governedPrompt or hintModePrompt)
        │
        ▼  [300–1500ms]
openai.chat.completions.create()
  Model: gpt-4o-mini, max_tokens: 1024
        │
        ▼  [50–200ms]  ← EXTRA COST vs primary path
openai.moderations.create()
  Validates every LLM response
        │
        ▼
responseParser.clean() + extractConcepts() + structureResponse()
        │
        ▼
Return + DB: save AI message, conceptInteraction
```

---

## 3. Latency Measurements (Estimated Baselines)

> Values below are based on code analysis and typical API performance characteristics.
> Run the instrumented server and collect actual logs for empirical data.

### Primary Path (`/tutor` → `askTutor`)

| Stage | Function/Location | Estimated Latency | Notes |
|-------|-------------------|-------------------|-------|
| **Frontend auth + parse** | `route.ts` | 5–20ms | JWT decode + JSON parse |
| **Network: Frontend → AI Svc** | HTTP localhost | 1–5ms | Local network |
| **Embedding generation** | `generateEmbedding()` → HuggingFace | 100–400ms | External API call |
| **Cache scan (keys)** | `redis.keys('scache:*')` | 5–50ms | Grows with cache size |
| **Cache fetch (GET × N)** | Sequential `redis.get()` | 10–200ms | O(N) calls |
| **Cosine similarity** | In-process JS | <1ms | Pure computation |
| **RAG: embedding (2nd call)** | `generateEmbedding()` → HuggingFace | 100–400ms | Duplicate call on cache miss |
| **RAG: Pinecone query** | `pinecone.query({ topK: 5 })` | 100–300ms | External vector DB |
| **Context assembly** | `chunks.map().join()` | <1ms | In-process |
| **LLM inference** | Groq `llama-3.3-70b-versatile` | 300–2000ms | **Dominant stage** |
| **Cache store** | `redis.set()` | 5–30ms | Fire-and-await |
| | | | |
| **TOTAL (cache miss)** | | **~800–3400ms** | |
| **TOTAL (cache hit)** | | **~150–600ms** | |

### Alternate Path (`/query` → `learningPipeline`)

| Stage | Estimated Latency | Notes |
|-------|-------------------|-------|
| Backend DB operations (3–5 queries) | 20–100ms | Prisma + PostgreSQL |
| Network hops (Frontend → Backend → AI Svc) | 2–10ms | Two localhost hops |
| Retrieval (up to 2× HF + Pinecone) | 200–800ms | Double on fallback |
| LLM inference (OpenAI GPT-4o-mini) | 300–1500ms | |
| **OpenAI moderation call** | 50–200ms | Extra cost vs primary |
| Response parsing | <5ms | In-process |
| DB write (message + interaction) | 10–30ms | |
| **TOTAL** | **~600–2700ms** | Slower due to extra hops + moderation |

---

## 4. Bottleneck Analysis

### Bottleneck #1 — LLM Inference (Primary Bottleneck, ~50–70% of total)

**Stage:** Groq `llama-3.3-70b-versatile` / OpenAI `gpt-4o-mini`  
**File:** `ai-services/src/pipelines/aiTutor.ts` (line ~67), `ai-services/src/llm/generateResponse.ts`  
**Why:** Large language model inference is compute-bound on remote GPU hardware. A 70B parameter model generates tokens sequentially. At 1024 max_tokens with ~40 tokens/sec, inference alone takes 300–2000ms. Network round-trip to Groq's inference endpoint adds latency on top.

### Bottleneck #2 — Double Embedding Generation (Structural Waste)

**Stage:** HuggingFace `BAAI/bge-small-en-v1.5`  
**Files:** `aiTutor.ts` calls `generateEmbedding()` on line 42, then `retrieveRelevantChunks()` calls it again at `retriever.ts`  
**Why:** The `askTutor` function generates an embedding for the cache check (Step 1), and then `retrieveRelevantChunks` → `retriever.retrieve()` generates a **second identical embedding** for the same query text. This doubles the HuggingFace API cost for every cache miss.

### Bottleneck #3 — O(N) Sequential Redis Cache Scan

**Stage:** Semantic cache check  
**File:** `ai-services/src/cache/semanticCache.ts`  
**Why:** `checkCache()` calls `redis.keys('scache:*')` to get all keys, then issues a **separate sequential `redis.get()` for each entry**. With N cached entries, this is N+1 Redis round-trips. Each round-trip is ~1–5ms, so with 100 entries this stage alone adds 100–500ms. The `redis.keys()` command itself blocks the Redis server for a scan.

### Bottleneck #4 — Fallback Retrieval Doubling (learningPipeline)

**Stage:** `retriever.retrieveWithFallback()`  
**File:** `ai-services/src/rag/retriever.ts`  
**Why:** If topic-level retrieval returns fewer than 2 chunks, the pipeline runs a full second retrieval at course level — another HuggingFace embed + Pinecone query (200–800ms extra). This happens frequently when content is sparse or topic IDs don't match ingested metadata.

### Bottleneck #5 — OpenAI Moderation (learningPipeline only)

**Stage:** Post-generation safety check  
**File:** `ai-services/src/llm/moderation.ts`  
**Why:** Every response on the `/query` path is sent to `openai.moderations.create()` before being returned. This adds 50–200ms unconditionally and is a sequential blocking call.

---

## 5. Bottleneck Summary Diagram

```
           Time →
           │
 0ms ──────┤ Auth + parse (5-20ms)
           │
 20ms ─────┤ Embedding #1: HuggingFace (100-400ms)           ◄ HF latency
           │
420ms ─────┤ Cache scan: Redis keys + N×GET (10-250ms)       ◄ O(N) Redis
           │
670ms ─────┤ Embedding #2: HuggingFace (100-400ms)           ◄ DUPLICATE
           │
1070ms ────┤ Pinecone vector query (100-300ms)               ◄ Pinecone RTT
           │
1370ms ────┤ Context build (<5ms)
           │
1375ms ────┤ ████████████  LLM Inference (300-2000ms)  ████  ◄ DOMINANT
           │
3375ms ────┤ Cache write (5-30ms)
           │
3405ms ────┤ DONE
           │
```

---

## 6. Optimization Strategies

### O1 — Eliminate Duplicate Embedding (High Impact, Easy)

**Problem:** `askTutor()` generates embedding for cache check, then `retrieveRelevantChunks()` generates it again.  
**Fix:** Pass the pre-generated embedding to `retrieveRelevantChunks` (or `retriever.retrieve`) so it skips regeneration.

```typescript
// ai-services/src/rag/retriever.ts
// Add overload to accept pre-computed embedding
async retrieve(
  queryOrEmbedding: string | number[],
  filters?, topK?, minScore?
) {
  const queryEmbedding = Array.isArray(queryOrEmbedding)
    ? queryOrEmbedding                    // reuse existing embedding
    : await generateEmbedding(queryOrEmbedding);
  // ... rest unchanged
}
```

**Estimated saving:** 100–400ms per request (one full HuggingFace round-trip eliminated).

---

### O2 — Fix Redis Cache: Use HGETALL or Batch Mget (High Impact, Easy)

**Problem:** `checkCache()` issues N sequential `redis.get()` calls — one per cached entry.  
**Fix:** Use `redis.mget(...keys)` to fetch all values in a **single round-trip**.

```typescript
// ai-services/src/cache/semanticCache.ts
export async function checkCache(queryEmbedding: number[]): Promise<string | null> {
  const keys = await redis.keys(`${KEY_PREFIX}*`);
  if (keys.length === 0) return null;

  // Single round-trip instead of N sequential GETs
  const raws = await redis.mget(...keys);
  // ... iterate raws, parse, compute cosine similarity
}
```

**Estimated saving:** 50–400ms (eliminates N-1 Redis round-trips).

Consider also switching from `redis.keys()` (blocking server scan) to `redis.scan()` for large datasets.

---

### O3 — Stream LLM Responses (High Perceived-Latency Impact)

**Problem:** The LLM generates 300–2000ms of tokens before the student sees anything.  
**Fix:** Enable Groq/OpenAI streaming and pipe chunks to the client as Server-Sent Events (SSE).

```typescript
// ai-services/src/pipelines/aiTutor.ts
const stream = await groq.chat.completions.create({
  model: groqConfig.defaultModel,
  messages: [...],
  max_tokens: groqConfig.maxTokens,
  stream: true,           // ← enable streaming
});

// In Express route (index.ts):
res.setHeader('Content-Type', 'text/event-stream');
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? '';
  if (text) res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
}
res.end();
```

**User experience:** First token arrives in ~200ms instead of waiting 1–2s for full response. Dramatically reduces perceived latency even if total compute time is unchanged.

---

### O4 — Reduce LLM Context / Max Tokens

**Problem:** `max_tokens: 1024` forces the model to potentially generate 1024 full tokens even for short answers.  
**Fix:** Set max_tokens dynamically based on question complexity, or reduce default to 512.

```typescript
// Groq Llama-3.3-70b at ~40 tok/sec:
// 512 tokens  → ~13s max theoretical (in practice 300-800ms)
// 1024 tokens → ~26s max theoretical
const max_tokens = question.length < 100 ? 512 : 1024;
```

**Estimated saving:** Up to 50% reduction in worst-case LLM time for shorter questions.

---

### O5 — Use a Smaller/Faster LLM for Simple Questions

**Problem:** `llama-3.3-70b-versatile` is a 70B parameter model — large and slower.  
**Fix:** Route simple factual questions to `llama-3.1-8b-instant` (Groq's fastest model) and reserve the 70B for complex, multi-step reasoning.

```typescript
const model = isSimpleQuery(question)
  ? 'llama-3.1-8b-instant'        // ~5× faster
  : 'llama-3.3-70b-versatile';    // high quality
```

**Estimated saving:** 60–80% reduction in LLM latency for simple queries.

---

### O6 — Cache Embeddings Per Query (Avoid Repeated HF Calls)

**Problem:** The same or similar questions re-trigger HuggingFace API calls.  
**Fix:** Cache query embeddings in Redis with a short TTL (e.g. 5 minutes) keyed by query text hash. The semantic cache already stores embeddings per cached answer — extend its lookup to also cache the embedding itself.

```typescript
const queryHash = crypto.createHash('sha256').update(question).digest('hex').slice(0, 16);
const embeddingCacheKey = `embed:${queryHash}`;
const cached = await redis.get(embeddingCacheKey);
const queryEmbedding = cached
  ? JSON.parse(cached)
  : await generateEmbedding(question);
if (!cached) redis.set(embeddingCacheKey, JSON.stringify(queryEmbedding), 'EX', 300);
```

**Estimated saving:** 100–400ms when same question is repeated within 5 minutes.

---

### O7 — Reduce Pinecone topK

**Problem:** `topK: 5` fetches 5 chunks even though context quality rarely improves beyond 3.  
**Fix:** Reduce to `topK: 3` (defined in `shared` constants as `RAG.TOP_K_RESULTS`). Fewer chunks = smaller prompt = faster LLM processing.

**Estimated saving:** 5–10% LLM speed improvement from reduced prompt length.

---

### O8 — Run Moderation Async (learningPipeline)

**Problem:** `moderation.validateResponse()` blocks the response return by 50–200ms.  
**Fix:** Fire moderations check asynchronously after returning the response; flag only persistently unsafe users.

```typescript
// After returning response:
moderation.validateResponse(llmResponse.text).then(isClean => {
  if (!isClean) logSafetyViolation(userId, llmResponse.text);
});
```

**Estimated saving:** 50–200ms on the `/query` path.

---

## 7. Instrumentation Added

The following files were instrumented with non-intrusive `performance.now()` timers that emit structured JSON log lines:

| File | What is measured |
|------|-----------------|
| [ai-services/src/rag/embeddings.ts](ai-services/src/rag/embeddings.ts) | `stage: "embedding_hf_api"` — HuggingFace API call duration |
| [ai-services/src/rag/retriever.ts](ai-services/src/rag/retriever.ts) | `stage: "vector_search"` — Pinecone query duration; `stage: "retriever_embedding"` |
| [ai-services/src/cache/semanticCache.ts](ai-services/src/cache/semanticCache.ts) | `stage: "cache_keys_scan"` — Redis KEYS; `stage: "cache_check"` — total + per-GET time |
| [ai-services/src/pipelines/aiTutor.ts](ai-services/src/pipelines/aiTutor.ts) | `stage: "llm_inference"` + `stage: "ai_tutor_pipeline"` — full breakdown |
| [ai-services/src/pipelines/learningPipeline.ts](ai-services/src/pipelines/learningPipeline.ts) | `stage: "learning_pipeline"` — retrieval + LLM + moderation |
| [ai-services/src/index.ts](ai-services/src/index.ts) | `stage: "tutor_route_total"` — E2E Express handler |
| [frontend/src/app/api/ai/tutor/route.ts](frontend/src/app/api/ai/tutor/route.ts) | `stage: "frontend_api_tutor"` — E2E frontend proxy |

### Sample Log Output (cache miss)

```json
{ "stage": "embedding_hf_api",    "latency_ms": 187,  "model": "BAAI/bge-small-en-v1.5", "dims": 384 }
{ "stage": "cache_keys_scan",     "latency_ms": 12,   "key_count": 24 }
{ "stage": "cache_check",         "latency_ms": 143,  "get_total_ms": 131, "entries_checked": 24, "hit": false, "best_score": 0.871 }
{ "stage": "embedding_hf_api",    "latency_ms": 201,  "model": "BAAI/bge-small-en-v1.5", "dims": 384 }
{ "stage": "retriever_embedding", "latency_ms": 201 }
{ "stage": "vector_search",       "latency_ms": 218,  "raw_matches": 5, "filters": null }
{ "stage": "llm_inference",       "latency_ms": 1240, "model": "llama-3.3-70b-versatile", "answer_chars": 847 }
{ "stage": "ai_tutor_pipeline",   "result": "live",   "total_ms": 2018, "embedding_ms": 187, "cache_check_ms": 155, "retrieval_ms": 432, "context_build_ms": 1, "llm_ms": 1240, "cache_store_ms": 3 }
{ "stage": "tutor_route_total",   "latency_ms": 2022, "pipeline_ms": 2018, "api_overhead_ms": 4 }
{ "stage": "frontend_api_tutor",  "total_ms": 2031,   "ai_service_ms": 2025, "network_overhead_ms": 6, "from_cache": false }
```

### Response Payload (with latency metadata)

```json
{
  "success": true,
  "data": {
    "answer": "...",
    "fromCache": false,
    "sources": [...]
  },
  "latency": {
    "total": 2022,
    "embedding": 187,
    "retrieval": 432,
    "cache_check": 155,
    "context_build": 1,
    "llm": 1240,
    "cache_store": 3,
    "api_overhead": 4
  },
  "_timing": {
    "frontend_total_ms": 2031,
    "ai_service_ms": 2025
  }
}
```

---

## 8. Priority Optimization Roadmap

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 **P1** | Reuse pre-computed embedding in `retrieveRelevantChunks` (O1) | Low | -100–400ms |
| 🔴 **P1** | Replace sequential `redis.get()` with `redis.mget()` (O2) | Low | -50–400ms |
| 🟠 **P2** | Enable LLM response streaming (O3) | Medium | UX: perceived -500ms+ |
| 🟠 **P2** | Reduce `max_tokens` to 512 for short questions (O4) | Low | -10–50% LLM time |
| 🟡 **P3** | Route simple questions to `llama-3.1-8b-instant` (O5) | Medium | -60–80% LLM time |
| 🟡 **P3** | Cache query embeddings in Redis short-TTL (O6) | Low | -100–400ms on repeat |
| 🟢 **P4** | Reduce Pinecone topK from 5 to 3 (O7) | Low | -5–10% LLM time |
| 🟢 **P4** | Run OpenAI moderation async (O8) | Low | -50–200ms (alt path) |

---

## 9. Key Findings Summary

1. **LLM inference is the dominant latency** — 50–70% of total response time. The 70B Groq model generates 300–2000ms of tokens per query at 1024 max_tokens.

2. **Two HuggingFace API calls per request** — `askTutor()` generates an embedding for cache lookup, then `retrieveRelevantChunks()` generates a second identical embedding. This is pure waste eliminated with one line of code.

3. **Redis cache scan is O(N)** — `checkCache()` does N sequential GET calls. With a growing cache, this will become a second significant bottleneck. The fix is `redis.mget()`.

4. **Streaming would transform UX** — Even without reducing total compute time, streaming makes the experience feel ~5× faster by delivering the first word in ~200ms instead of making the user wait 1–2s for the full response.

5. **The learningPipeline has an extra OpenAI moderation overhead** (+50–200ms) and potential double retrieval that the primary `aiTutor` path avoids. For most tutoring use cases, the primary `/tutor` path is both simpler and faster.