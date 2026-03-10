/**
 * Verification query — confirms courses and chapters in the database.
 * Run: npx tsx scripts/verifyCurriculum.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const courses = await prisma.course.findMany({
    include: {
      chapters: {
        orderBy: { orderIndex: 'asc' },
        select: { name: true, orderIndex: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const course of courses) {
    console.log(`\n📚 ${course.name}  (${course.chapters.length} chapters)`);
    for (const ch of course.chapters) {
      console.log(`   ${ch.orderIndex + 1}. ${ch.name}`);
    }
  }

  const totalChapters = courses.reduce((sum, c) => sum + c.chapters.length, 0);
  console.log('\n─────────────────────────────────────');
  console.log(`Total courses  : ${courses.length}`);
  console.log(`Total chapters : ${totalChapters}`);
  console.log('─────────────────────────────────────');
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
