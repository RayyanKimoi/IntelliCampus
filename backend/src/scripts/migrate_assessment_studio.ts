/**
 * Assessment Studio migration script
 * Run with: cd backend && npx tsx src/scripts/migrate_assessment_studio.ts
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../frontend/.env') });

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "chapter_id" TEXT`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'assignment'`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "submission_types" JSONB`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "rubric" JSONB`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "assignment_document_url" TEXT`,
  `ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "evaluation_points" INTEGER`,
  `CREATE INDEX IF NOT EXISTS "assignments_chapter_id_idx" ON "assignments"("chapter_id")`,
  `ALTER TABLE "questions" ALTER COLUMN "topic_id" DROP NOT NULL`,
  `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "explanation" TEXT`,
  `ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "answers" JSONB`,
  `ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "submission_file_url" TEXT`,
];

async function run() {
  console.log('Starting Assessment Studio migration...');
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('OK:', stmt.slice(0, 70));
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('does not exist')) {
        console.log('SKIP (already applied):', stmt.slice(0, 70));
      } else {
        console.error('ERR:', e.message, '\n  SQL:', stmt);
      }
    }
  }
  console.log('\nMigration complete!');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
