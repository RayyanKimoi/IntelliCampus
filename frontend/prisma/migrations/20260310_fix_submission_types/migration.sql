-- Fix schema inconsistency for submission_types column
-- The column was created as JSONB but needs to work with Prisma's Json type
-- This ensures compatibility between database and Prisma schema

-- No changes needed - the column is already JSONB which matches the updated Prisma schema (Json type)
-- This migration is a placeholder to document the schema alignment

-- Verification: submission_types column should be JSONB type
-- Prisma schema: submissionTypes Json? @map("submission_types")
