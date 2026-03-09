-- Assessment Studio: add new fields to assignments, questions, student_attempts

-- Add chapter reference and extra fields to assignments
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "chapter_id" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'assignment';
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "is_published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "submission_types" JSONB;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "rubric" JSONB;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "assignment_document_url" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "evaluation_points" INTEGER;

-- FK for chapter_id
ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_chapter_id_fkey"
  FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "assignments_chapter_id_idx" ON "assignments"("chapter_id");

-- Make topic_id nullable on questions (for chapter-based quiz questions)
ALTER TABLE "questions" ALTER COLUMN "topic_id" DROP NOT NULL;

-- Add explanation field to questions
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "explanation" TEXT;

-- Add answers and file submission to student_attempts
ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "answers" JSONB;
ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "submission_file_url" TEXT;
