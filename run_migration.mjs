import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load dotenv from frontend
const dotenv = require('dotenv');
dotenv.config({ path: './frontend/.env' });

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'assignment';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_types JSONB;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric JSONB;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_document_url TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS evaluation_points INTEGER;
ALTER TABLE questions ALTER COLUMN topic_id DROP NOT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE student_attempts ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE student_attempts ADD COLUMN IF NOT EXISTS submission_file_url TEXT;
CREATE INDEX IF NOT EXISTS idx_assignments_chapter_id ON assignments(chapter_id);
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        console.log('OK:', stmt.substring(0, 60));
      } catch (e) {
        console.warn('WARN:', e.message);
      }
    }
    console.log('Migration complete!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
