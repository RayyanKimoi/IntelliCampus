import { PrismaClient, UserRole, AIMode, MessageSender, ResponseType, ActivityType, XPSource, DifficultyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── 1. Institution ──────────────────────────────────────────
  const institution = await prisma.institution.upsert({
    where: { domain: 'intellicampus.edu' },
    update: {},
    create: { name: 'IntelliCampus University', domain: 'intellicampus.edu' },
  });
  console.log(`🏫 Institution: ${institution.name}`);

  // ── 2. Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Admin User', email: 'admin@campus.edu', passwordHash,
      role: UserRole.admin, institutionId: institution.id,
      profile: { create: { bio: 'System Administrator' } },
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Professor Turing', email: 'teacher@campus.edu', passwordHash,
      role: UserRole.teacher, institutionId: institution.id,
      profile: { create: { department: 'Computer Science', bio: 'Professor of Algorithms and AI' } },
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Dr. Ada Lovelace', email: 'teacher2@campus.edu', passwordHash,
      role: UserRole.teacher, institutionId: institution.id,
      profile: { create: { department: 'Mathematics', bio: 'Professor of Discrete Mathematics' } },
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Alice Student', email: 'student@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 2, department: 'Computer Science', bio: 'Eager to learn!' } },
      accessibilitySettings: { create: { focusMode: true } },
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'bob@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Bob Kumar', email: 'bob@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 2, department: 'Computer Science', bio: 'Future engineer!' } },
      accessibilitySettings: { create: {} },
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'carol@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'Carol Mendes', email: 'carol@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 1, department: 'Computer Science', bio: 'Loves algorithms!' } },
      accessibilitySettings: { create: {} },
    },
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'david@campus.edu' },
    update: { passwordHash },
    create: {
      name: 'David Osei', email: 'david@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 3, department: 'Computer Science', bio: 'Senior yearling!' } },
      accessibilitySettings: { create: {} },
    },
  });

  console.log('👥 Users seeded (2 teachers, 4 students, 1 admin)');

  // ── 3. Course Structure ─────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { id: 'cs101-seed' },
    update: {},
    create: {
      id: 'cs101-seed', name: 'Computer Science 101',
      description: 'Introduction to Computer Science and Programming',
      institutionId: institution.id, createdBy: teacher.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'math201-seed' },
    update: {},
    create: {
      id: 'math201-seed', name: 'Discrete Mathematics',
      description: 'Logic, sets, graphs and combinatorics',
      institutionId: institution.id, createdBy: teacher2.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 'cs201-seed' },
    update: {},
    create: {
      id: 'cs201-seed', name: 'Data Structures & Algorithms',
      description: 'Advanced data structures, complexity and algorithm design',
      institutionId: institution.id, createdBy: teacher.id,
    },
  });

  // Subjects
  const subject = await prisma.subject.upsert({
    where: { id: 'algo-seed' },
    update: {},
    create: { id: 'algo-seed', name: 'Algorithms', description: 'Fundamental algorithms and data structures', courseId: course.id },
  });

  const subject2 = await prisma.subject.upsert({
    where: { id: 'oop-seed' },
    update: {},
    create: { id: 'oop-seed', name: 'Object-Oriented Programming', description: 'Classes, interfaces, design patterns', courseId: course.id },
  });

  const subject3 = await prisma.subject.upsert({
    where: { id: 'graph-seed' },
    update: {},
    create: { id: 'graph-seed', name: 'Graph Theory', description: 'Graphs, trees and traversal algorithms', courseId: course2.id },
  });

  const subject4 = await prisma.subject.upsert({
    where: { id: 'trees-seed' },
    update: {},
    create: { id: 'trees-seed', name: 'Trees & Heaps', description: 'Binary trees, BSTs, heaps and tries', courseId: course3.id },
  });

  // Topics
  const topic = await prisma.topic.upsert({
    where: { id: 'sorting-seed' },
    update: {},
    create: {
      id: 'sorting-seed', name: 'Sorting Algorithms',
      description: 'Bubble sort, Merge sort, Quick sort, and their complexities.',
      difficultyLevel: DifficultyLevel.intermediate,
      subjectId: subject.id, orderIndex: 1,
    },
  });

  const topic2 = await prisma.topic.upsert({
    where: { id: 'searching-seed' },
    update: {},
    create: {
      id: 'searching-seed', name: 'Searching Algorithms',
      description: 'Linear search, Binary search and their complexities.',
      difficultyLevel: DifficultyLevel.beginner,
      subjectId: subject.id, orderIndex: 2,
    },
  });

  const topic3 = await prisma.topic.upsert({
    where: { id: 'polymorphism-seed' },
    update: {},
    create: {
      id: 'polymorphism-seed', name: 'Polymorphism',
      description: 'Method overriding, overloading and dynamic dispatch.',
      difficultyLevel: DifficultyLevel.intermediate,
      subjectId: subject2.id, orderIndex: 1,
    },
  });

  const topic4 = await prisma.topic.upsert({
    where: { id: 'bfs-dfs-seed' },
    update: {},
    create: {
      id: 'bfs-dfs-seed', name: 'BFS & DFS',
      description: 'Breadth-first and depth-first graph traversal.',
      difficultyLevel: DifficultyLevel.advanced,
      subjectId: subject3.id, orderIndex: 1,
    },
  });

  const topic5 = await prisma.topic.upsert({
    where: { id: 'bst-seed' },
    update: {},
    create: {
      id: 'bst-seed', name: 'Binary Search Trees',
      description: 'BST insertion, deletion, search and balancing.',
      difficultyLevel: DifficultyLevel.intermediate,
      subjectId: subject4.id, orderIndex: 1,
    },
  });

  console.log('📚 Courses, subjects and topics seeded');

  // ── 4. Content ──────────────────────────────────────────────
  const contentItems = [
    {
      id: 'sorting-content-seed', title: 'Introduction to Sorting', topicId: topic.id,
      contentText: '# Sorting Algorithms\n\nSorting is fundamental in CS.\n\n## Algorithms\n1. **Bubble Sort** O(n²)\n2. **Merge Sort** O(n log n)\n3. **Quick Sort** O(n log n) avg',
    },
    {
      id: 'searching-content-seed', title: 'Search Techniques', topicId: topic2.id,
      contentText: '# Searching\n\n## Linear Search O(n)\n## Binary Search O(log n)\nRequires sorted array.',
    },
    {
      id: 'oop-content-seed', title: 'Polymorphism Deep Dive', topicId: topic3.id,
      contentText: '# Polymorphism\n\nAllows objects to be treated as instances of their parent class.\n\n## Types\n- Compile-time (overloading)\n- Runtime (overriding)',
    },
    {
      id: 'bfs-content-seed', title: 'Graph Traversal Methods', topicId: topic4.id,
      contentText: '# BFS & DFS\n\n**BFS** uses a queue. Finds shortest path in unweighted graph.\n**DFS** uses a stack. Good for topological sort.',
    },
    {
      id: 'bst-content-seed', title: 'BST Operations', topicId: topic5.id,
      contentText: '# Binary Search Trees\n\nLeft < Root < Right.\n\n## Operations\n- Insert: O(log n) avg\n- Delete: O(log n) avg\n- Search: O(log n) avg',
    },
  ];
  for (const c of contentItems) {
    await prisma.curriculumContent.upsert({
      where: { id: c.id }, update: {},
      create: { ...c, uploadedBy: teacher.id },
    });
  }
  console.log('📄 Content seeded');

  // ── 5. Questions ────────────────────────────────────────────
  const questionsCount = await prisma.question.count({ where: { topicId: topic.id } });
  if (questionsCount === 0) {
    await prisma.question.createMany({
      data: [
        { topicId: topic.id, questionText: 'What is the worst-case complexity of Bubble Sort?', optionA: 'O(n)', optionB: 'O(n log n)', optionC: 'O(n²)', optionD: 'O(1)', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
        { topicId: topic.id, questionText: 'Which algorithm uses divide and conquer?', optionA: 'Bubble Sort', optionB: 'Merge Sort', optionC: 'Selection Sort', optionD: 'Insertion Sort', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
        { topicId: topic.id, questionText: 'What is the pivot element in Quick Sort?', optionA: 'Divider', optionB: 'Median', optionC: 'Pivot', optionD: 'Splitter', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
        { topicId: topic.id, questionText: 'Average complexity of Quick Sort?', optionA: 'O(n)', optionB: 'O(n log n)', optionC: 'O(n²)', optionD: 'O(log n)', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
        { topicId: topic.id, questionText: 'Which sorting algorithm is stable?', optionA: 'Quick Sort', optionB: 'Merge Sort', optionC: 'Heap Sort', optionD: 'Selection Sort', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
        { topicId: topic2.id, questionText: 'Binary search requires the array to be?', optionA: 'Reversed', optionB: 'Unsorted', optionC: 'Sorted', optionD: 'Even-sized', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
        { topicId: topic2.id, questionText: 'Complexity of binary search?', optionA: 'O(n)', optionB: 'O(log n)', optionC: 'O(n²)', optionD: 'O(1)', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
        { topicId: topic3.id, questionText: 'Method overriding is an example of?', optionA: 'Encapsulation', optionB: 'Compile-time polymorphism', optionC: 'Runtime polymorphism', optionD: 'Abstraction', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
        { topicId: topic4.id, questionText: 'BFS uses which data structure?', optionA: 'Stack', optionB: 'Queue', optionC: 'Heap', optionD: 'Tree', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
        { topicId: topic5.id, questionText: 'In a BST, left child is always?', optionA: 'Greater than root', optionB: 'Equal to root', optionC: 'Less than root', optionD: 'None of the above', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
      ],
    });
    console.log('❓ Questions seeded (10 questions across 5 topics)');
  }

  // ── 6. Assignments ──────────────────────────────────────────
  const assignment1 = await prisma.assignment.upsert({
    where: { id: 'asn-sorting-seed' },
    update: {},
    create: {
      id: 'asn-sorting-seed', title: 'Sorting Algorithms Quiz',
      description: 'Test your knowledge of sorting algorithms and their complexities.',
      type: 'quiz', courseId: course.id, teacherId: teacher.id,
      dueDate: new Date(Date.now() + 7 * 86400000), totalPoints: 50, isPublished: true,
    },
  });

  const assignment2 = await prisma.assignment.upsert({
    where: { id: 'asn-searching-seed' },
    update: {},
    create: {
      id: 'asn-searching-seed', title: 'Searching Algorithms Assignment',
      description: 'Binary and linear search problems.',
      type: 'assignment', courseId: course.id, teacherId: teacher.id,
      dueDate: new Date(Date.now() + 14 * 86400000), totalPoints: 40, isPublished: true,
    },
  });

  const assignment3 = await prisma.assignment.upsert({
    where: { id: 'asn-oop-seed' },
    update: {},
    create: {
      id: 'asn-oop-seed', title: 'OOP Concepts Quiz',
      description: 'Polymorphism, inheritance and encapsulation.',
      type: 'quiz', courseId: course.id, teacherId: teacher2.id,
      dueDate: new Date(Date.now() + 10 * 86400000), totalPoints: 30, isPublished: true,
    },
  });

  const assignment4 = await prisma.assignment.upsert({
    where: { id: 'asn-graphs-seed' },
    update: {},
    create: {
      id: 'asn-graphs-seed', title: 'Graph Traversal Exam',
      description: 'BFS, DFS and shortest-path problems.',
      type: 'exam', courseId: course2.id, teacherId: teacher2.id,
      dueDate: new Date(Date.now() + 21 * 86400000), totalPoints: 100, isPublished: true,
    },
  });

  const assignment5 = await prisma.assignment.upsert({
    where: { id: 'asn-bst-seed' },
    update: {},
    create: {
      id: 'asn-bst-seed', title: 'BST Implementation Project',
      description: 'Implement insert, delete and search for a BST.',
      type: 'project', courseId: course3.id, teacherId: teacher.id,
      dueDate: new Date(Date.now() + 30 * 86400000), totalPoints: 100, isPublished: false,
    },
  });

  console.log('📋 Assignments seeded (4 published, 1 draft)');

  // ── 7. Student Attempts & Submissions ───────────────────────
  const attemptDefs = [
    // student - assignment1
    { id: 'att-alice-sort', userId: student.id, assignmentId: assignment1.id, score: 85, completedAt: new Date(Date.now() - 3 * 86400000), teacherComment: 'Good understanding of merge sort!', gradedAt: new Date(Date.now() - 2 * 86400000) },
    // student2 - assignment1
    { id: 'att-bob-sort', userId: student2.id, assignmentId: assignment1.id, score: 60, completedAt: new Date(Date.now() - 2 * 86400000), teacherComment: 'Review quicksort complexity.', gradedAt: new Date(Date.now() - 86400000) },
    // student3 - assignment1
    { id: 'att-carol-sort', userId: student3.id, assignmentId: assignment1.id, score: 95, completedAt: new Date(Date.now() - 86400000), teacherComment: 'Excellent work!', gradedAt: new Date(Date.now() - 3600000) },
    // student4 - assignment1 (suspicious timing)
    { id: 'att-david-sort', userId: student4.id, assignmentId: assignment1.id, score: 100, completedAt: new Date(Date.now() - 43200000), teacherComment: null, gradedAt: null },
    // student - assignment2
    { id: 'att-alice-search', userId: student.id, assignmentId: assignment2.id, score: 78, completedAt: new Date(Date.now() - 86400000), teacherComment: 'Binary search was correct.', gradedAt: new Date(Date.now() - 3600000) },
    // student2 - assignment3
    { id: 'att-bob-oop', userId: student2.id, assignmentId: assignment3.id, score: 72, completedAt: new Date(Date.now() - 5 * 86400000), teacherComment: null, gradedAt: null },
    // student - assignment3 (in progress / not submitted yet)
    { id: 'att-alice-oop', userId: student.id, assignmentId: assignment3.id, score: null, completedAt: null, teacherComment: null, gradedAt: null },
    // student3 - assignment4
    { id: 'att-carol-graph', userId: student3.id, assignmentId: assignment4.id, score: 88, completedAt: new Date(Date.now() - 4 * 86400000), teacherComment: 'Great BFS explanation.', gradedAt: new Date(Date.now() - 3 * 86400000) },
  ];

  for (const a of attemptDefs) {
    await prisma.studentAttempt.upsert({
      where: { id: a.id }, update: {},
      create: {
        id: a.id, userId: a.userId, assignmentId: a.assignmentId,
        score: a.score, completedAt: a.completedAt,
        teacherComment: a.teacherComment, gradedAt: a.gradedAt,
      },
    });
  }

  // Answers with timing for integrity testing (david is suspiciously fast)
  const attDavidId = 'att-david-sort';
  const davAnswersCount = await prisma.studentAnswer.count({ where: { attemptId: attDavidId } });
  if (davAnswersCount === 0) {
    const questions = await prisma.question.findMany({ where: { topicId: topic.id }, take: 5 });
    await prisma.studentAnswer.createMany({
      data: questions.map((q) => ({
        attemptId: attDavidId, questionId: q.id,
        selectedOption: q.correctOption, isCorrect: true,
        timeTaken: 2, // 2 seconds per question — suspicious
      })),
    });
  }

  console.log('✍️ Student attempts and answers seeded');

  // ── 8. Student XP & Gamification ────────────────────────────
  const xpDefs = [
    { userId: student.id, totalXp: 3200, level: 8, streakDays: 7 },
    { userId: student2.id, totalXp: 1800, level: 5, streakDays: 3 },
    { userId: student3.id, totalXp: 4500, level: 11, streakDays: 14 },
    { userId: student4.id, totalXp: 2100, level: 6, streakDays: 1 },
  ];
  for (const x of xpDefs) {
    await prisma.studentXP.upsert({
      where: { userId: x.userId }, update: { totalXp: x.totalXp, level: x.level, streakDays: x.streakDays },
      create: x,
    });
  }

  // XP Logs
  const xpLogsCount = await prisma.xPLog.count({ where: { userId: student.id } });
  if (xpLogsCount === 0) {
    await prisma.xPLog.createMany({
      data: [
        { userId: student.id, source: XPSource.quiz, xpAmount: 150, createdAt: new Date(Date.now() - 6 * 86400000) },
        { userId: student.id, source: XPSource.practice, xpAmount: 40, createdAt: new Date(Date.now() - 4 * 86400000) },
        { userId: student.id, source: XPSource.streak, xpAmount: 100, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student.id, source: XPSource.quiz, xpAmount: 200, createdAt: new Date(Date.now() - 86400000) },
        { userId: student.id, source: XPSource.practice, xpAmount: 60, createdAt: new Date() },
        { userId: student2.id, source: XPSource.quiz, xpAmount: 100, createdAt: new Date(Date.now() - 86400000) },
        { userId: student3.id, source: XPSource.streak, xpAmount: 200, createdAt: new Date() },
        { userId: student4.id, source: XPSource.quiz, xpAmount: 50, createdAt: new Date() },
      ],
    });
  }
  console.log('🎮 XP and gamification seeded');

  // ── 9. Mastery Graphs ────────────────────────────────────────
  const masteryDefs = [
    { userId: student.id, topicId: topic.id, masteryScore: 7.8 },
    { userId: student.id, topicId: topic2.id, masteryScore: 6.5 },
    { userId: student.id, topicId: topic3.id, masteryScore: 5.2 },
    { userId: student.id, topicId: topic4.id, masteryScore: 4.0 },
    { userId: student.id, topicId: topic5.id, masteryScore: 3.5 },
    { userId: student2.id, topicId: topic.id, masteryScore: 5.5 },
    { userId: student2.id, topicId: topic2.id, masteryScore: 7.0 },
    { userId: student3.id, topicId: topic.id, masteryScore: 9.2 },
    { userId: student3.id, topicId: topic3.id, masteryScore: 8.8 },
    { userId: student4.id, topicId: topic4.id, masteryScore: 6.1 },
    { userId: student4.id, topicId: topic5.id, masteryScore: 5.8 },
  ];
  for (const m of masteryDefs) {
    const existing = await prisma.masteryGraph.findFirst({ where: { userId: m.userId, topicId: m.topicId } });
    if (!existing) {
      await prisma.masteryGraph.create({ data: m });
    }
  }
  console.log('🧠 Mastery graphs seeded');

  // ── 10. Performance Logs ─────────────────────────────────────
  const perfLogsCount = await prisma.performanceLog.count({ where: { userId: student.id } });
  if (perfLogsCount === 0) {
    await prisma.performanceLog.createMany({
      data: [
        { userId: student.id, topicId: topic.id, activityType: ActivityType.quiz, score: 65, accuracy: 0.70, timeSpent: 200, createdAt: new Date(Date.now() - 7 * 86400000) },
        { userId: student.id, topicId: topic.id, activityType: ActivityType.flashcard, score: 72, accuracy: 0.75, timeSpent: 300, createdAt: new Date(Date.now() - 5 * 86400000) },
        { userId: student.id, topicId: topic.id, activityType: ActivityType.quiz, score: 80, accuracy: 0.82, timeSpent: 180, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student.id, topicId: topic.id, activityType: ActivityType.quiz, score: 85, accuracy: 0.90, timeSpent: 120, createdAt: new Date(Date.now() - 86400000) },
        { userId: student.id, topicId: topic2.id, activityType: ActivityType.quiz, score: 60, accuracy: 0.65, timeSpent: 150, createdAt: new Date(Date.now() - 4 * 86400000) },
        { userId: student.id, topicId: topic2.id, activityType: ActivityType.quiz, score: 75, accuracy: 0.78, timeSpent: 130, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student.id, topicId: topic3.id, activityType: ActivityType.flashcard, score: 55, accuracy: 0.60, timeSpent: 250, createdAt: new Date(Date.now() - 86400000) },
        { userId: student2.id, topicId: topic.id, activityType: ActivityType.quiz, score: 58, accuracy: 0.60, timeSpent: 220, createdAt: new Date(Date.now() - 86400000) },
        { userId: student3.id, topicId: topic.id, activityType: ActivityType.quiz, score: 95, accuracy: 0.97, timeSpent: 90, createdAt: new Date() },
        { userId: student4.id, topicId: topic4.id, activityType: ActivityType.quiz, score: 70, accuracy: 0.72, timeSpent: 160, createdAt: new Date() },
      ],
    });
  }
  console.log('📊 Performance logs seeded');

  // ── 11. Weak Topic Flags ─────────────────────────────────────
  const weakFlags = [
    { userId: student.id, topicId: topic4.id, weaknessScore: 0.80 },  // Alice weak at BFS/DFS
    { userId: student.id, topicId: topic5.id, weaknessScore: 0.72 },  // Alice weak at BST
    { userId: student2.id, topicId: topic.id, weaknessScore: 0.65 },  // Bob weak at Sorting
    { userId: student4.id, topicId: topic3.id, weaknessScore: 0.70 }, // David weak at OOP
  ];
  for (const f of weakFlags) {
    const existing = await prisma.weakTopicFlag.findFirst({ where: { userId: f.userId, topicId: f.topicId } });
    if (!existing) await prisma.weakTopicFlag.create({ data: f });
  }
  console.log('🚩 Weak topic flags seeded');

  // ── 12. AI Sessions ──────────────────────────────────────────
  const sessionsCount = await prisma.aISession.count({ where: { userId: student.id } });
  if (sessionsCount === 0) {
    await prisma.aISession.create({
      data: {
        userId: student.id, courseId: course.id, topicId: topic.id, mode: AIMode.learning,
        messages: {
          create: [
            { sender: MessageSender.student, messageText: 'Explain Quick Sort to me like I am 5.', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'Imagine you have a messy pile of toys. You pick one toy as a "pivot" and put smaller toys to its left and bigger ones to its right. You keep doing this until everything is in order!', responseType: ResponseType.explanation },
            { sender: MessageSender.student, messageText: 'What is the worst case for Quick Sort?', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'The worst case is O(n²) and happens when the pivot is always the smallest or largest element — like if the array is already sorted.', responseType: ResponseType.explanation },
          ],
        },
      },
    });
  }
  console.log('🤖 AI sessions seeded');

  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────────────────');
  console.log('📌 Login credentials (all passwords: password123)');
  console.log('   admin    → admin@campus.edu');
  console.log('   teacher  → teacher@campus.edu');
  console.log('   teacher2 → teacher2@campus.edu');
  console.log('   student  → student@campus.edu');
  console.log('   student2 → bob@campus.edu');
  console.log('   student3 → carol@campus.edu');
  console.log('   student4 → david@campus.edu');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

