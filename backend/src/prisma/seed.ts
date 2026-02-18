import { PrismaClient, UserRole, AIMode, MessageSender, ResponseType, ActivityType, XPSource, DifficultyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Institution
  const institution = await prisma.institution.upsert({
    where: { domain: 'intellicampus.edu' },
    update: {},
    create: {
      name: 'IntelliCampus University',
      domain: 'intellicampus.edu',
    },
  });

  console.log(`🏫 Institution created: ${institution.name}`);

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: { passwordHash }, // Ensure password is set
    create: {
      name: 'Admin User',
      email: 'admin@campus.edu',
      passwordHash,
      role: UserRole.admin,
      institutionId: institution.id,
      profile: {
        create: {
          bio: 'System Administrator',
        },
      },
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Professor Turing',
      email: 'teacher@campus.edu',
      passwordHash,
      role: UserRole.teacher,
      institutionId: institution.id,
      profile: {
        create: {
          department: 'Computer Science',
          bio: 'Professor of Algorithms and AI',
        },
      },
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Alice Student',
      email: 'student@campus.edu',
      passwordHash,
      role: UserRole.student,
      institutionId: institution.id,
      profile: {
        create: {
          yearOfStudy: 1,
          department: 'Computer Science',
          bio: 'Eager to learn!',
        },
      },
      accessibilitySettings: {
        create: {
          focusMode: true,
        },
      },
    },
  });

  console.log('👥 Users seeded (Admin, Teacher, Student)');

  // 3. Course Structure
  const course = await prisma.course.upsert({
    where: { id: 'cs101-seed' }, // Using a fixed ID for idempotency if name isn't unique constraint (it isn't)
    update: {},
    create: {
      id: 'cs101-seed',
      name: 'Computer Science 101',
      description: 'Introduction to Computer Science and Programming',
      institutionId: institution.id,
      createdBy: teacher.id,
    },
  });

  const subject = await prisma.subject.upsert({
    where: { id: 'algo-seed' },
    update: {},
    create: {
      id: 'algo-seed',
      name: 'Algorithms',
      description: 'Fundamental algorithms and data structures',
      courseId: course.id,
    },
  });

  const topic = await prisma.topic.upsert({
    where: { id: 'sorting-seed' },
    update: {},
    create: {
      id: 'sorting-seed',
      name: 'Sorting Algorithms',
      description: 'Bubble sort, Merge sort, Quick sort, and their complexities.',
      difficultyLevel: DifficultyLevel.intermediate,
      subjectId: subject.id,
      orderIndex: 1,
    },
  });

  console.log('📚 Course structure seeded: CS101 -> Algorithms -> Sorting Algorithms');

  // 4. Content
  const content = await prisma.curriculumContent.upsert({
    where: { id: 'sorting-content-seed' },
    update: {},
    create: {
      id: 'sorting-content-seed',
      title: 'Introduction to Sorting',
      contentText: `# Sorting Algorithms
      
Sorting is a fundamental operation in computer science. It involves arranging data in a specific order.

## Common Algorithms
1. **Bubble Sort**: Simple but inefficient (O(n^2)).
2. **Merge Sort**: Divide and conquer (O(n log n)).
3. **Quick Sort**: Fast in practice (O(n log n) avg).
      `,
      topicId: topic.id,
      uploadedBy: teacher.id,
    },
  });

  console.log('📄 Content seeded');

  // 4.1 Questions (for Quizzes & Boss Battles)
  const questionsCount = await prisma.question.count({ where: { topicId: topic.id } });
  if (questionsCount === 0) {
    await prisma.question.createMany({
      data: [
        {
          topicId: topic.id,
          questionText: 'What is the worst-case time complexity of Bubble Sort?',
          optionA: 'O(n)',
          optionB: 'O(n log n)',
          optionC: 'O(n^2)',
          optionD: 'O(1)',
          correctOption: 'C',
          difficultyLevel: DifficultyLevel.beginner,
        },
        {
          topicId: topic.id,
          questionText: 'Which algorithm uses a divide and conquer strategy?',
          optionA: 'Bubble Sort',
          optionB: 'Merge Sort',
          optionC: 'Selection Sort',
          optionD: 'Insertion Sort',
          correctOption: 'B',
          difficultyLevel: DifficultyLevel.intermediate,
        },
        {
          topicId: topic.id,
          questionText: 'In Quick Sort, what is the element used to partition the array called?',
          optionA: 'Divider',
          optionB: 'Pivot',
          optionC: 'Anchor',
          optionD: 'Splitter',
          correctOption: 'B',
          difficultyLevel: DifficultyLevel.intermediate,
        },
        {
          topicId: topic.id,
          questionText: 'What is the average case complexity of Quick Sort?',
          optionA: 'O(n)',
          optionB: 'O(n log n)',
          optionC: 'O(n^2)',
          optionD: 'O(log n)',
          correctOption: 'B',
          difficultyLevel: DifficultyLevel.advanced,
        },
        {
          topicId: topic.id,
          questionText: 'Which sorting algorithm is stable?',
          optionA: 'Quick Sort',
          optionB: 'Merge Sort',
          optionC: 'Heap Sort',
          optionD: 'Selection Sort',
          correctOption: 'B',
          difficultyLevel: DifficultyLevel.advanced,
        },
      ],
    });
    console.log('❓ Questions seeded for Sorting Algorithms');
  }

  // 5. Activity Data

  // Student XP
  await prisma.studentXP.upsert({
    where: { userId: student.id },
    update: { totalXp: 1500, level: 5, streakDays: 3 },
    create: {
      userId: student.id,
      totalXp: 1500,
      level: 5,
      streakDays: 3,
    },
  });

  // XP Logs (Create a few recent ones)
  const xpLogsCount = await prisma.xPLog.count({ where: { userId: student.id } });
  if (xpLogsCount === 0) {
    await prisma.xPLog.createMany({
      data: [
        { userId: student.id, source: XPSource.quiz, xpAmount: 50, createdAt: new Date(Date.now() - 86400000) }, // 1 day ago
        { userId: student.id, source: XPSource.practice, xpAmount: 20, createdAt: new Date(Date.now() - 43200000) }, // 12 hours ago
        { userId: student.id, source: XPSource.streak, xpAmount: 100, createdAt: new Date() },
      ],
    });
  }

  // AI Sessions
  const sessionsCount = await prisma.aISession.count({ where: { userId: student.id } });
  if (sessionsCount === 0) {
    const session = await prisma.aISession.create({
      data: {
        userId: student.id,
        courseId: course.id,
        topicId: topic.id,
        mode: AIMode.learning,
        messages: {
          create: [
            {
              sender: MessageSender.student,
              messageText: 'Explain Quick Sort to me like I am 5.',
              responseType: ResponseType.explanation,
            },
            {
              sender: MessageSender.ai,
              messageText: 'Imagine you have a messy room...',
              responseType: ResponseType.explanation,
            },
          ],
        },
      },
    });
  }

  // Performance Logs (for charts)
  const perfLogsCount = await prisma.performanceLog.count({ where: { userId: student.id } });
  if (perfLogsCount === 0) {
    await prisma.performanceLog.createMany({
      data: [
        {
          userId: student.id,
          topicId: topic.id,
          activityType: ActivityType.quiz,
          score: 85,
          accuracy: 0.9,
          timeSpent: 120,
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
        },
        {
          userId: student.id,
          topicId: topic.id,
          activityType: ActivityType.flashcard,
          score: 60,
          accuracy: 0.7,
          timeSpent: 300,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          userId: student.id,
          topicId: topic.id,
          activityType: ActivityType.quiz,
          score: 95,
          accuracy: 0.98,
          timeSpent: 100,
          createdAt: new Date(),
        },
      ],
    });
  }

  // Weak Topic Flag
  const weakTopic = await prisma.weakTopicFlag.findFirst({ where: { userId: student.id, topicId: topic.id } });
  if (!weakTopic) {
    await prisma.weakTopicFlag.create({
      data: {
        userId: student.id,
        topicId: topic.id,
        weaknessScore: 0.75, // Moderate weakness initially detected
      },
    });
  }

  console.log('🎮 Activity data seeded (XP, Sessions, Performance, Flags)');
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
