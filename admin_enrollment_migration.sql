-- ============================================================
-- IntelliCampus: Evaluation & Results Migration
-- Run this in Supabase SQL Editor (or via prisma migrate dev
-- after stopping the dev server).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. course_enrollments
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "course_enrollments" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "course_id"   TEXT        NOT NULL,
  "student_id"  TEXT        NOT NULL,
  "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "course_enrollments_course_id_student_id_key" UNIQUE ("course_id", "student_id"),
  CONSTRAINT "course_enrollments_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "course_enrollments_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "course_enrollments_course_id_idx"   ON "course_enrollments"("course_id");
CREATE INDEX IF NOT EXISTS "course_enrollments_student_id_idx"  ON "course_enrollments"("student_id");

-- ────────────────────────────────────────────────────────────
-- 2. student_evaluations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "student_evaluations" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "student_id"  TEXT        NOT NULL,
  "course_id"   TEXT        NOT NULL,
  "score"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "feedback"    TEXT        NOT NULL DEFAULT '',
  "graded_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "student_evaluations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_evaluations_student_id_course_id_key" UNIQUE ("student_id", "course_id"),
  CONSTRAINT "student_evaluations_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "student_evaluations_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "student_evaluations_course_id_idx"   ON "student_evaluations"("course_id");
CREATE INDEX IF NOT EXISTS "student_evaluations_student_id_idx"  ON "student_evaluations"("student_id");

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_student_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_evaluations_updated_at_trigger ON "student_evaluations";
CREATE TRIGGER student_evaluations_updated_at_trigger
  BEFORE UPDATE ON "student_evaluations"
  FOR EACH ROW EXECUTE FUNCTION update_student_evaluations_updated_at();

-- ────────────────────────────────────────────────────────────
-- 3. Auto-enroll all existing students in all existing courses
--    (idempotent — safe to re-run)
-- ────────────────────────────────────────────────────────────
INSERT INTO "course_enrollments" ("course_id", "student_id")
SELECT c.id, u.id
FROM "courses" c
CROSS JOIN "users" u
WHERE u.role = 'student'
ON CONFLICT ("course_id", "student_id") DO NOTHING;
