/**
 * Test script for the AI Tutor pipeline
 *
 * Usage (from workspace root):
 *   npx tsx ai-services/src/scripts/testTutor.ts
 *
 * Or from ai-services/:
 *   pnpm tsx src/scripts/testTutor.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Must load env BEFORE any module that throws on missing keys
dotenv.config({ path: path.resolve(__dirname, '../../../frontend/.env') });

const QUESTION = 'What is binary search?';

async function runTest() {
  // Dynamic import ensures env is populated before module-level guards fire
  const { askTutor } = await import('../pipelines/aiTutor');

  console.log('=== AI Tutor Pipeline Test ===\n');

  // ── First call: should go through full RAG pipeline ──────────────────────
  console.log(`Question: "${QUESTION}"`);
  console.log('First call (embedding → Pinecone → Groq)...\n');

  const t1 = Date.now();
  const result1 = await askTutor({ question: QUESTION });
  const elapsed1 = Date.now() - t1;

  console.log(`Answer:\n${result1.answer}\n`);
  console.log(`From cache: ${result1.fromCache}`);
  console.log(`Sources returned: ${result1.sources.length}`);
  console.log(`Time: ${elapsed1}ms\n`);

  // ── Second call: should return instantly from Redis cache ─────────────────
  console.log('Second call (should hit Redis semantic cache)...\n');

  const t2 = Date.now();
  const result2 = await askTutor({ question: QUESTION });
  const elapsed2 = Date.now() - t2;

  console.log(`Answer:\n${result2.answer}\n`);
  console.log(`From cache: ${result2.fromCache}`);
  console.log(`Time: ${elapsed2}ms`);

  if (result2.fromCache) {
    console.log(`\n✓ Cache hit confirmed — ${elapsed1 - elapsed2}ms faster than first call`);
  } else {
    console.log('\n⚠ Cache miss on second call — check Redis connection');
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err.message ?? err);
  process.exit(1);
});
