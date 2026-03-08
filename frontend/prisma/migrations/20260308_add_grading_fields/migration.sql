-- Add grading fields to student_attempts table
ALTER TABLE "student_attempts" 
ADD COLUMN IF NOT EXISTS "graded_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "graded_by" TEXT,
ADD COLUMN IF NOT EXISTS "teacher_comment" TEXT,
ADD COLUMN IF NOT EXISTS "rubric_scores" JSONB;

-- Create index on graded_by for faster lookups
CREATE INDEX IF NOT EXISTS "student_attempts_graded_by_idx" ON "student_attempts"("graded_by");

-- Add foreign key constraint for graded_by
ALTER TABLE "student_attempts"
ADD CONSTRAINT "student_attempts_graded_by_fkey" 
FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
