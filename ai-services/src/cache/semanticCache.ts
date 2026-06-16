import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing required environment variable: REDIS_URL');
}

// Accept either a full redis URL (redis://user:pass@host:port) or a plain host:port
// If a plain host:port is supplied, prefix it with the redis:// scheme so ioredis
// can parse it correctly. This makes it easier to accept values like
// "redis-16122.c84.us-east-1-2.ec2.cloud.redislabs.com:16122".
let normalizedRedisUrl = redisUrl;
if (!/^rediss?:\/\//i.test(redisUrl)) {
  normalizedRedisUrl = `redis://${redisUrl}`;
}

const redis = new Redis(normalizedRedisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
});

/** TTL for cached responses: 24 hours */
const CACHE_TTL_SECONDS = 86_400;

/** Cosine similarity threshold — entries below this are considered different questions */
const SIMILARITY_THRESHOLD = 0.92;

/** Redis key prefix for semantic cache entries */
const KEY_PREFIX = 'scache:';

interface CacheEntry {
  embedding: number[];
  response: string;
}

// ---------------------------------------------------------------------------
// Fallback-response detection
// ---------------------------------------------------------------------------

/**
 * Substrings that indicate a "no material found" fallback response.
 * These must NEVER be cached — they are transient and will become wrong
 * as soon as new course content is ingested.
 */
const FALLBACK_PHRASES = [
  "i don't have enough course material",
  "i do not have enough course material",
  "please ask your instructor",
  "not enough information to answer",
  "no relevant course content",
  "no course material",
];

export function isFallbackResponse(response: string): boolean {
  const lower = response.toLowerCase();
  return FALLBACK_PHRASES.some((phrase) => lower.includes(phrase));
}

// ---------------------------------------------------------------------------
// Cosine similarity helper
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a semantically similar question has already been answered.
 *
 * Scans all cache entries and returns the stored response for the closest
 * match above SIMILARITY_THRESHOLD, or null if no match is found.
 * Cached fallback responses are silently skipped — they are stale by definition.
 */
export async function checkCache(queryEmbedding: number[]): Promise<string | null> {
  try {
    const _cacheStart = performance.now();
    const _keysStart = performance.now();
    const keys = await redis.keys(`${KEY_PREFIX}*`);
    const _keysMs = performance.now() - _keysStart;
    console.log(JSON.stringify({ stage: 'cache_keys_scan', latency_ms: Math.round(_keysMs), key_count: keys.length }));

    if (keys.length === 0) return null;

    let bestScore = -1;
    let bestResponse: string | null = null;
    let _getTotal = 0;

    for (const key of keys) {
      const _getStart = performance.now();
      const raw = await redis.get(key);
      _getTotal += performance.now() - _getStart;
      if (!raw) continue;

      let entry: CacheEntry;
      try {
        entry = JSON.parse(raw) as CacheEntry;
      } catch {
        continue;
      }

      if (isFallbackResponse(entry.response)) {
        console.log(`[Cache] Skipping stale fallback cache entry: ${key}`);
        await redis.del(key).catch(() => {});
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestResponse = entry.response;
      }
    }

    const _cacheMs = performance.now() - _cacheStart;
    console.log(JSON.stringify({ stage: 'cache_check', latency_ms: Math.round(_cacheMs), get_total_ms: Math.round(_getTotal), entries_checked: keys.length, hit: bestScore >= SIMILARITY_THRESHOLD, best_score: Math.round(bestScore * 1000) / 1000 }));

    return bestScore >= SIMILARITY_THRESHOLD ? bestResponse : null;
  } catch (error: any) {
    console.warn('[Cache] Redis unavailable, skipping semantic cache read:', error?.message ?? error);
    return null;
  }
}

/**
 * Store a question embedding and its AI response in the cache.
 *
 * Fallback/"not enough material" responses are never stored — they are
 * transient and would become wrong once new content is ingested.
 *
 * Uses a hash of the embedding's first 8 values as part of the key to avoid
 * storing identical vectors twice. TTL is set to 24 hours.
 */
export async function storeCache(
  queryEmbedding: number[],
  response: string
): Promise<void> {
  if (isFallbackResponse(response)) {
    console.log('[Cache] Skipping cache storage — response is a fallback (no material found)');
    return;
  }

  // Derive a short key fingerprint from the embedding
  const fingerprint = queryEmbedding
    .slice(0, 8)
    .map((v) => Math.round(v * 1e6))
    .join('_');

  const key = `${KEY_PREFIX}${fingerprint}_${Date.now()}`;
  const entry: CacheEntry = { embedding: queryEmbedding, response };

  try {
    await redis.set(key, JSON.stringify(entry), 'EX', CACHE_TTL_SECONDS);
  } catch (error: any) {
    console.warn('[Cache] Redis unavailable, skipping semantic cache write:', error?.message ?? error);
  }
}

export default redis;
