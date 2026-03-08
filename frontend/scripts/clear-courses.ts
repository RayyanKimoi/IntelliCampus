// Clear all courses from the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCourses() {
  console.log('🗑️  Clearing all courses and related data...');
  
  // Delete in correct order due to foreign key constraints
  // Start with the most dependent tables
  await prisma.question.deleteMany(); // Questions reference topics
  await prisma.topic.deleteMany(); // Topics reference subjects
  await prisma.subject.deleteMany(); // Subjects reference courses
  await prisma.assignment.deleteMany(); // Assignments reference courses
  await prisma.aISession.deleteMany(); // AI sessions reference courses
  await prisma.teacherInsight.deleteMany(); // Teacher insights reference courses
  await prisma.teacherCourseAssignment.deleteMany(); // Teacher assignments reference courses
  await prisma.chapterContent.deleteMany(); // Chapter content references chapters
  await prisma.chapter.deleteMany(); // Chapters reference courses
  await prisma.course.deleteMany(); // Finally delete courses
  
  console.log('✅ All courses and related data cleared!');
}

clearCourses()
  .catch((e) => {
    console.error('❌ Error clearing courses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
