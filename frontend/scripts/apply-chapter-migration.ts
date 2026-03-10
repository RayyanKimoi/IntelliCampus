/**
 * Applies the chapterId column migration directly to the database.
 * Run from frontend/: npx tsx scripts/apply-chapter-migration.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking curriculum_content table...');

  // Check if column already exists
  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'curriculum_content'
      AND column_name = 'chapter_id'
  `;

  if (Number(result[0].count) > 0) {
    console.log('✓ chapter_id column already exists — nothing to do');
    return;
  }

  console.log('Adding chapter_id column to curriculum_content...');
  await prisma.$executeRaw`
    ALTER TABLE curriculum_content
    ADD COLUMN chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE
  `;

  console.log('Adding index on chapter_id...');
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS curriculum_content_chapter_id_idx
    ON curriculum_content(chapter_id)
  `;

  // Make topic_id nullable if it isn't already
  await prisma.$executeRaw`
    ALTER TABLE curriculum_content
    ALTER COLUMN topic_id DROP NOT NULL
  `;

  console.log('✓ Migration applied successfully');
}

main()
  .catch((e) => { console.error('Migration failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
