/**
 * Assigns all existing courses to every teacher in the institution.
 * Run this after seeding courses if teachers see "No Courses Assigned".
 *
 * Run: npx tsx scripts/assignCoursesToTeacher.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignCoursesToTeachers() {
  console.log('🔗 Assigning courses to teachers...\n');

  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: 'teacher' }, select: { id: true, name: true, email: true } }),
  ]);

  if (courses.length === 0) {
    console.log('⚠️  No courses found. Run seedFinalCurriculum.ts first.');
    return;
  }
  if (teachers.length === 0) {
    console.log('⚠️  No teacher users found. Please create a teacher account first.');
    return;
  }

  console.log(`   Courses  : ${courses.map((c) => c.name).join(', ')}`);
  console.log(`   Teachers : ${teachers.map((t) => `${t.name} <${t.email}>`).join(', ')}\n`);

  let created = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    for (const course of courses) {
      try {
        await prisma.teacherCourseAssignment.create({
          data: { teacherId: teacher.id, courseId: course.id },
        });
        created++;
      } catch (e: any) {
        // P2002 = unique constraint violation (already assigned)
        if (e?.code === 'P2002') {
          skipped++;
        } else {
          throw e;
        }
      }
    }
  }

  console.log(`✅ Done! Created ${created} assignments, skipped ${skipped} (already existed).`);
}

assignCoursesToTeachers()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
