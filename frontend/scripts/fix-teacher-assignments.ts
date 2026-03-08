// Fix teacher course assignments
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAssignments() {
  console.log('🔧 Fixing teacher course assignments...');
  
  // Get the teacher
  const teacher = await prisma.user.findFirst({
    where: { email: 'teacher@campus.edu' },
  });

  if (!teacher) {
    console.error('❌ Teacher not found!');
    return;
  }

  console.log(`Found teacher: ${teacher.email} (ID: ${teacher.id})`);

  // Get all courses
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses`);

  // Delete existing assignments
  await prisma.teacherCourseAssignment.deleteMany({
    where: { teacherId: teacher.id },
  });

  // Create new assignments for all courses
  for (const course of courses) {
    await prisma.teacherCourseAssignment.create({
      data: {
        teacherId: teacher.id,
        courseId: course.id,
      },
    });
    console.log(`  ✅ Assigned: ${course.name}`);
  }

  console.log('✅ All courses assigned to teacher!');
}

fixAssignments()
  .catch((e) => {
    console.error('❌ Error fixing assignments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
