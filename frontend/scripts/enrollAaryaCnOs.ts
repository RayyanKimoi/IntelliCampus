import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findUnique({
    where: { email: 'aarya@gmail.com' },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!student) {
    console.error('❌ User aarya@gmail.com not found.');
    return;
  }
  console.log(`👤 Found: ${student.name} <${student.email}> (role: ${student.role})`);

  const courses = await prisma.course.findMany({
    where: { name: { in: ['Computer Networks', 'Operating Systems'] } },
    select: { id: true, name: true },
  });

  if (courses.length === 0) {
    console.error('❌ CN / OS courses not found in the database.');
    return;
  }
  console.log(`📚 Courses: ${courses.map((c) => c.name).join(', ')}`);

  // Remove any incorrect teacher assignments created earlier
  const deleted = await prisma.teacherCourseAssignment.deleteMany({
    where: {
      teacherId: student.id,
      courseId: { in: courses.map((c) => c.id) },
    },
  });
  if (deleted.count > 0) {
    console.log(`🗑  Removed ${deleted.count} incorrect teacher assignment(s).`);
  }

  // Create student enrollments
  let created = 0;
  let skipped = 0;

  for (const course of courses) {
    try {
      await prisma.courseEnrollment.create({
        data: { studentId: student.id, courseId: course.id },
      });
      console.log(`  ✅ Enrolled in "${course.name}"`);
      created++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        console.log(`  ⚠️  Already enrolled in "${course.name}" — skipped.`);
        skipped++;
      } else {
        throw e;
      }
    }
  }

  console.log(`\nDone. Enrolled: ${created}, Already existed: ${skipped}`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
