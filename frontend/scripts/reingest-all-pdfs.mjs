/**
 * reingest-all-pdfs.mjs
 *
 * Queries the database for all chapters that have PDF content and
 * re-ingests each PDF into Pinecone via the ai-services /ingest-url endpoint.
 *
 * Usage (from /frontend):
 *   node scripts/reingest-all-pdfs.mjs
 *
 * Or to target only a specific course:
 *   node scripts/reingest-all-pdfs.mjs --course <courseId>
 *
 * Requirements:
 *   - frontend/.env must contain DATABASE_URL and AI_SERVICE_URL
 *   - ai-services must be running on port 5000
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
const envPath = path.resolve(__dirname, '../.env');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';

// Parse optional --course flag
const courseArg = process.argv.indexOf('--course');
const filterCourseId = courseArg !== -1 ? process.argv[courseArg + 1] : null;

async function main() {
  console.log('\n=== IntelliCampus PDF Re-ingestion Script ===');
  console.log(`AI Service URL : ${AI_SERVICE_URL}`);
  if (filterCourseId) console.log(`Filtering to course: ${filterCourseId}`);
  console.log('');

  // Verify ai-services is reachable
  try {
    const ping = await fetch(`${AI_SERVICE_URL}/health`).catch(() => null);
    if (!ping || !ping.ok) {
      // try a known endpoint
      const alt = await fetch(`${AI_SERVICE_URL}/debug/rag`).catch(() => null);
      if (!alt || !alt.ok) {
        console.error('ERROR: ai-services is not reachable at', AI_SERVICE_URL);
        console.error('Make sure `pnpm dev` is running in the ai-services directory.');
        process.exit(1);
      }
    }
    console.log('✓ ai-services reachable\n');
  } catch {
    // continue anyway, error will surface on first ingest call
  }

  // Fetch all chapters with PDF content
  // ChapterContent.fileType stores 'pdf' or 'application/pdf' — filter for both
  const chapters = await prisma.chapter.findMany({
    where: {
      ...(filterCourseId ? { courseId: filterCourseId } : {}),
      content: {
        some: { fileType: { in: ['pdf', 'application/pdf'] } },
      },
    },
    include: {
      content: {
        where: { fileType: { in: ['pdf', 'application/pdf'] } },
        select: { id: true, title: true, fileUrl: true },
      },
      course: { select: { id: true, name: true } },
    },
  });

  if (chapters.length === 0) {
    console.log('No chapters found with PDF content.');
    process.exit(0);
  }

  console.log(`Found ${chapters.length} chapter(s) with PDF content:\n`);
  for (const ch of chapters) {
    const courseTitle = ch.course?.name ?? ch.courseId;
    console.log(`  [${ch.id}] "${ch.name}" — Course: ${courseTitle} (${ch.content.length} PDF(s))`);
  }
  console.log('');

  let totalChunks = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const chapter of chapters) {
    const courseTitle = chapter.course?.name ?? chapter.courseId;
    console.log(`\n--- Chapter: "${chapter.name}" (${courseTitle}) ---`);

    for (const item of chapter.content) {
      if (!item.fileUrl) {
        console.warn(`  SKIP "${item.title}" — no fileUrl`);
        totalFailed++;
        continue;
      }

      process.stdout.write(`  Ingesting "${item.title}" ... `);

      try {
        const isRemoteUrl = item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://');

        let res, data;

        if (isRemoteUrl) {
          // Supabase / remote URL — use /ingest-url
          res = await fetch(`${AI_SERVICE_URL}/ingest-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl: item.fileUrl,
              courseId: chapter.courseId,
              topicId: chapter.id,
              chapterTitle: chapter.name,
            }),
          });
        } else {
          // Local path (e.g. /uploads/...) — resolve to absolute and use /ingest-file
          const absolutePath = path.resolve(__dirname, '..', 'public', item.fileUrl.replace(/^\//, ''));
          res = await fetch(`${AI_SERVICE_URL}/ingest-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: absolutePath,
              courseId: chapter.courseId,
              chapterId: chapter.id,
              chapterTitle: chapter.name,
            }),
          });
        }

        data = await res.json();

        if (!res.ok || !data.success) {
          console.log(`FAILED — ${data.error ?? res.statusText}`);
          totalFailed++;
        } else {
          const chunks = data.data?.chunkCount ?? 0;
          console.log(`OK — ${chunks} chunks`);
          totalChunks += chunks;
          totalSuccess++;
        }
      } catch (err) {
        console.log(`ERROR — ${err.message}`);
        totalFailed++;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Succeeded : ${totalSuccess} PDF(s)`);
  console.log(`  Failed    : ${totalFailed} PDF(s)`);
  console.log(`  Total chunks upserted: ${totalChunks}`);
  console.log('');

  if (totalSuccess > 0) {
    console.log('Done. Run GET http://localhost:5000/debug/rag to verify vector count increased.');
  }
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
