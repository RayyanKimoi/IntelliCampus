-- Add integrity monitoring columns to student_attempts table
-- These columns track violation count and attempt status for the integrity monitoring system

ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "violations" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "student_attempts" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
