-- ============================================================
-- IntelliCampus — Student Seed & Enrollment Migration
-- Compatible with Supabase PostgreSQL
-- Run this entire script in the Supabase SQL Editor.
-- It is fully idempotent — safe to run more than once.
-- ============================================================


-- ============================================================
-- SECTION 0: Ensure a demo Institution exists
--   Uses the first existing institution if one is already
--   present, otherwise creates a placeholder.
-- ============================================================

INSERT INTO "institutions" ("id", "name", "domain")
VALUES ('inst_demo', 'IntelliCampus Demo', 'intellicampus.demo')
ON CONFLICT ("domain") DO NOTHING;

-- If no institution named inst_demo was inserted (another row won
-- the conflict), we still need a valid id for the rows below.
-- We will reference it by a stable CTE in every subsequent insert.

-- ============================================================
-- SECTION 1: Ensure a demo Teacher user exists
--   (courses.created_by must reference a real user)
-- ============================================================

INSERT INTO "users" (
  "id", "name", "email", "password_hash",
  "role", "institution_id", "created_at", "updated_at"
)
VALUES (
  'teacher_demo_01',
  'Demo Teacher',
  'teacher.demo@intellicampus.demo',
  -- bcrypt hash of "DemoPass@123" (cost 10) — change before production
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'teacher',
  -- Use inst_demo if it exists, otherwise fall back to first available institution
  COALESCE(
    (SELECT "id" FROM "institutions" WHERE "id" = 'inst_demo'),
    (SELECT "id" FROM "institutions" ORDER BY "created_at" LIMIT 1)
  ),
  now(),
  now()
)
ON CONFLICT ("email") DO NOTHING;


-- ============================================================
-- SECTION 2: Insert 6 Student Users
-- ============================================================

INSERT INTO "users" (
  "id", "name", "email", "password_hash",
  "role", "institution_id", "created_at", "updated_at"
)
SELECT
  v."id", v."name", v."email",
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'student',
  COALESCE(
    (SELECT "id" FROM "institutions" WHERE "id" = 'inst_demo'),
    (SELECT "id" FROM "institutions" ORDER BY "created_at" LIMIT 1)
  ),
  now(),
  now()
FROM (VALUES
  ('std_101', 'Rohan Mehta',   'rohan.mehta@intellicampus.demo'),
  ('std_102', 'Sneha Kapoor',  'sneha.kapoor@intellicampus.demo'),
  ('std_103', 'Arjun Nair',    'arjun.nair@intellicampus.demo'),
  ('std_104', 'Meera Joshi',   'meera.joshi@intellicampus.demo'),
  ('std_105', 'Kabir Sharma',  'kabir.sharma@intellicampus.demo'),
  ('std_106', 'Ananya Verma',  'ananya.verma@intellicampus.demo')
) AS v("id", "name", "email")
ON CONFLICT ("email") DO NOTHING;


-- ============================================================
-- SECTION 3: Insert Courses
--   courses.created_by must reference an existing user.
--   We use teacher_demo_01 (inserted above), or fall back to
--   the first teacher already in the database.
-- ============================================================

INSERT INTO "courses" (
  "id", "name", "description",
  "institution_id", "created_by", "created_at"
)
SELECT
  v."id", v."name", v."description",
  COALESCE(
    (SELECT "id" FROM "institutions" WHERE "id" = 'inst_demo'),
    (SELECT "id" FROM "institutions" ORDER BY "created_at" LIMIT 1)
  ),
  COALESCE(
    (SELECT "id" FROM "users" WHERE "id" = 'teacher_demo_01'),
    (SELECT "id" FROM "users" WHERE "role" = 'teacher' ORDER BY "created_at" LIMIT 1)
  ),
  now()
FROM (VALUES
  ('cs101',  'Computer Science 101',            'Introduction to computer science fundamentals.'),
  ('web101', 'Web Development Fundamentals',    'HTML, CSS, JavaScript and modern frameworks.'),
  ('dsa101', 'Data Structures & Algorithms',    'Core data structures and algorithm design.')
) AS v("id", "name", "description")
ON CONFLICT ("id") DO NOTHING;


-- ============================================================
-- SECTION 4: Course Enrollments
--   Enroll specific students in specific courses.
--   The UNIQUE constraint on (course_id, student_id) means
--   repeated runs are safe with ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO "course_enrollments" ("course_id", "student_id")
VALUES
  -- Computer Science 101
  ('cs101',  'std_101'),   -- Rohan Mehta
  ('cs101',  'std_102'),   -- Sneha Kapoor
  ('cs101',  'std_103'),   -- Arjun Nair

  -- Web Development Fundamentals
  ('web101', 'std_104'),   -- Meera Joshi
  ('web101', 'std_105'),   -- Kabir Sharma

  -- Data Structures & Algorithms
  ('dsa101', 'std_106'),   -- Ananya Verma
  ('dsa101', 'std_101'),   -- Rohan Mehta  (also in CS101)
  ('dsa101', 'std_102')    -- Sneha Kapoor (also in CS101)
ON CONFLICT ("course_id", "student_id") DO NOTHING;


-- ============================================================
-- SECTION 5: Sample Student Evaluations
-- ============================================================

INSERT INTO "student_evaluations" (
  "student_id", "course_id", "score", "feedback", "graded_at", "updated_at"
)
VALUES
  -- Computer Science 101 evaluations
  ('std_101', 'cs101',  85, 'Good understanding of fundamentals',       now(), now()),
  ('std_102', 'cs101',  78, 'Needs improvement in algorithms',          now(), now()),
  ('std_103', 'cs101',  90, 'Excellent analytical thinking',            now(), now()),

  -- Web Development Fundamentals evaluations
  ('std_104', 'web101', 82, 'Strong grasp of HTML and CSS',             now(), now()),
  ('std_105', 'web101', 92, 'Excellent frontend skills',                now(), now()),

  -- Data Structures & Algorithms evaluations
  ('std_106', 'dsa101', 88, 'Great understanding of tree structures',   now(), now()),
  ('std_101', 'dsa101', 75, 'Needs more practice on dynamic programming', now(), now()),
  ('std_102', 'dsa101', 80, 'Good progress on sorting algorithms',      now(), now())
ON CONFLICT ("student_id", "course_id") DO NOTHING;


-- ============================================================
-- SECTION 6: Verification Queries
--   Run these individually after the inserts to confirm data.
-- ============================================================

-- 6a. Student count per course
SELECT
  c."id"    AS course_id,
  c."name"  AS course_name,
  COUNT(ce."student_id") AS student_count
FROM "courses" c
LEFT JOIN "course_enrollments" ce ON ce."course_id" = c."id"
GROUP BY c."id", c."name"
ORDER BY c."name";


-- 6b. Full student list per course
SELECT
  ce."course_id"  AS course_id,
  c."name"        AS course_name,
  u."id"          AS student_id,
  u."name"        AS student_name,
  u."email"       AS student_email
FROM "course_enrollments" ce
JOIN "users"   u ON u."id" = ce."student_id"
JOIN "courses" c ON c."id" = ce."course_id"
ORDER BY c."name", u."name";


-- 6c. Evaluations with student and course info
SELECT
  u."name"       AS student_name,
  c."name"       AS course_name,
  se."score",
  se."feedback",
  se."graded_at"
FROM "student_evaluations" se
JOIN "users"   u ON u."id" = se."student_id"
JOIN "courses" c ON c."id" = se."course_id"
ORDER BY c."name", u."name";
