/**
 * Reset all curriculum-related data from the database.
 * Deletes in dependency order to avoid foreign key conflicts.
 *
 * Run: npx tsx scripts/resetCurriculum.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCurriculum() {
  console.log('🗑️  Starting curriculum database reset...\n');

  // Count before deletion so we can report what was removed
  const [
    chapterContentCount,
    curriculumContentCount,
    chapterCount,
    topicCount,
    subjectCount,
    courseCount,
  ] = await Promise.all([
    prisma.chapterContent.count(),
    prisma.curriculumContent.count(),
    prisma.chapter.count(),
    prisma.topic.count(),
    prisma.subject.count(),
    prisma.course.count(),
  ]);

  // Topics are referenced by many student-activity tables (ai_sessions, mastery_graphs,
  // questions, boss_battles, etc.) with non-nullable FK columns and no onDelete: Cascade.
  // TRUNCATE ... CASCADE is the only safe way to remove all rows atomically without
  // temporarily disabling FK checks one-by-one.
  await prisma.$executeRaw`
    TRUNCATE TABLE
      chapter_content,
      curriculum_content,
      chapters,
      prerequisite_relations,
      topics,
      subjects,
      courses
    CASCADE
  `;

  console.log(`   ✓ Deleted ${chapterContentCount} ChapterContent records`);
  console.log(`   ✓ Deleted ${curriculumContentCount} CurriculumContent records`);
  console.log(`   ✓ Deleted ${chapterCount} Chapter records`);
  console.log(`   ✓ Deleted ${topicCount} Topic records`);
  console.log(`   ✓ Deleted ${subjectCount} Subject records`);
  console.log(`   ✓ Deleted ${courseCount} Course records`);
  console.log('\n✅ Curriculum database reset complete');
}

resetCurriculum()
  .catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
