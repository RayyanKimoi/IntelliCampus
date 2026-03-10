/**
 * Script to auto-grade existing quiz submissions that were submitted but not marked as graded
 * Run with: npx tsx scripts/fix-quiz-grading.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding submitted quiz attempts without gradedAt...');
  
  // Find all submitted attempts that have student answers (MCQ) but no gradedAt
  const attempts = await prisma.studentAttempt.findMany({
    where: {
      submittedAt: { not: null },
      gradedAt: null,
      studentAnswers: {
        some: {}, // Has at least one answer (indicates it's a quiz/MCQ)
      },
    },
    include: {
      studentAnswers: {
        include: {
          question: {
            select: { correctOption: true },
          },
        },
      },
      assignment: {
        select: { title: true, type: true },
      },
    },
  });

  console.log(`📊 Found ${attempts.length} quiz submissions to auto-grade`);

  let updated = 0;
  for (const attempt of attempts) {
    // Calculate score based on correct answers
    const correct = attempt.studentAnswers.filter((a) => a.isCorrect).length;
    const total = attempt.studentAnswers.length;
    const score = total > 0 ? (correct / total) * 100 : 0;

    console.log(`  ✓ Grading "${attempt.assignment.title}" - ${correct}/${total} correct (${score.toFixed(1)}%)`);

    // Update the attempt with score and gradedAt
    await prisma.studentAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        gradedAt: attempt.submittedAt, // Use submission time as graded time
      },
    });

    updated++;
  }

  console.log(`\n✅ Successfully auto-graded ${updated} quiz submissions!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
