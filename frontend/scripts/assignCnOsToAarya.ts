import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findUnique({
    where: { email: 'aarya@gmail.com' },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!teacher) {
    console.error('❌ User aarya@gmail.com not found.');
    return;
  }
  console.log(`👤 Found user: ${teacher.name} <${teacher.email}> (role: ${teacher.role})`);

  const courses = await prisma.course.findMany({
    where: { name: { in: ['Computer Networks', 'Operating Systems'] } },
    select: { id: true, name: true },
  });

  if (courses.length === 0) {
    console.error('❌ Neither CN nor OS courses found in the database.');
    return;
  }
  console.log(`📚 Courses found: ${courses.map((c) => c.name).join(', ')}`);

  let created = 0;
  let skipped = 0;

  for (const course of courses) {
    try {
      await prisma.teacherCourseAssignment.create({
        data: { teacherId: teacher.id, courseId: course.id },
      });
      console.log(`  ✅ Assigned "${course.name}"`);
      created++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        console.log(`  ⚠️  "${course.name}" already assigned — skipped.`);
        skipped++;
      } else {
        throw e;
      }
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
