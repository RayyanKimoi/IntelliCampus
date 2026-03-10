/**
 * Seed the final curriculum dataset for the AI tutor RAG pipeline.
 * Creates 4 courses with 5 chapters each (20 chapters total).
 * Teachers will upload ChapterContent (PDFs / videos) manually via the UI.
 *
 * Run: npx tsx scripts/seedFinalCurriculum.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSES: {
  name: string;
  description: string;
  chapters: { name: string; description: string }[];
}[] = [
  {
    name: 'Data Structures',
    description:
      'Fundamental data structures including arrays, linked lists, trees, and graphs used in software development.',
    chapters: [
      {
        name: 'Introduction to Data Structures',
        description: 'Overview of data structures, abstract data types, and why they matter.',
      },
      {
        name: 'Arrays and Linked Lists',
        description: 'Static vs dynamic allocation, singly and doubly linked lists, and basic operations.',
      },
      {
        name: 'Stacks and Queues',
        description: 'LIFO and FIFO structures, implementation strategies, and real-world applications.',
      },
      {
        name: 'Trees and Binary Search Trees',
        description: 'Tree terminology, BST operations, balanced trees, and traversal algorithms.',
      },
      {
        name: 'Graph Basics',
        description: 'Graph representations, BFS, DFS, and common graph problems.',
      },
    ],
  },
  {
    name: 'Analysis of Algorithms',
    description:
      'Techniques for designing efficient algorithms and analysing their time and space complexity.',
    chapters: [
      {
        name: 'Algorithm Analysis and Complexity',
        description: 'Best, worst, and average case analysis; recurrence relations.',
      },
      {
        name: 'Asymptotic Notation',
        description: 'Big-O, Big-Omega, and Big-Theta notation with examples.',
      },
      {
        name: 'Divide and Conquer Algorithms',
        description: 'Merge sort, quick sort, binary search, and the master theorem.',
      },
      {
        name: 'Greedy Algorithms',
        description: "Greedy strategy, activity selection, Huffman encoding, and Kruskal's algorithm.",
      },
      {
        name: 'Dynamic Programming',
        description: 'Memoisation vs tabulation, knapsack, LCS, and matrix chain multiplication.',
      },
    ],
  },
  {
    name: 'Computer Networks',
    description:
      'Core networking concepts covering protocols, models, routing, and security fundamentals.',
    chapters: [
      {
        name: 'Introduction to Computer Networks',
        description: 'Network types, topologies, transmission media, and basic terminology.',
      },
      {
        name: 'OSI Model and TCP/IP',
        description: 'Seven-layer OSI model, TCP/IP stack, and how layers interact.',
      },
      {
        name: 'Network Protocols',
        description: 'HTTP, FTP, DNS, DHCP, and transport-layer protocols (TCP vs UDP).',
      },
      {
        name: 'Routing and Switching',
        description: 'IP addressing, subnetting, static and dynamic routing, VLANs.',
      },
      {
        name: 'Network Security Basics',
        description: 'Firewalls, encryption, TLS/SSL, common attacks, and mitigation techniques.',
      },
    ],
  },
  {
    name: 'Operating Systems',
    description:
      'Principles of modern operating systems including process management, memory, and file systems.',
    chapters: [
      {
        name: 'Introduction to Operating Systems',
        description: 'OS roles, system calls, kernel vs user space, and OS types.',
      },
      {
        name: 'Process Management',
        description: 'Process lifecycle, PCB, context switching, inter-process communication.',
      },
      {
        name: 'Memory Management',
        description: 'Paging, segmentation, virtual memory, and page replacement algorithms.',
      },
      {
        name: 'File Systems',
        description: 'File abstractions, directory structures, FAT, inode-based systems, and journaling.',
      },
      {
        name: 'Deadlocks and Scheduling',
        description: 'Deadlock conditions, detection and prevention, CPU scheduling algorithms.',
      },
    ],
  },
];

async function seedFinalCurriculum() {
  console.log('🌱 Seeding final curriculum...\n');

  // Resolve institution and creator
  const institution = await prisma.institution.findFirst();
  if (!institution) {
    console.error('❌ No institution found. Please create one before running this script.');
    process.exit(1);
  }

  const creator = await prisma.user.findFirst({
    where: { role: { in: ['teacher', 'admin'] } },
  });
  if (!creator) {
    console.error('❌ No teacher or admin user found. Please create one first.');
    process.exit(1);
  }

  console.log(`   Institution : ${institution.name} (${institution.id})`);
  console.log(`   Created by  : ${creator.name} <${creator.email}> [${creator.role}]\n`);

  let totalChapters = 0;

  for (const courseData of COURSES) {
    const course = await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        institutionId: institution.id,
        createdBy: creator.id,
      },
    });

    console.log(`📚 Course created: "${course.name}" (${course.id})`);

    for (let i = 0; i < courseData.chapters.length; i++) {
      const chapter = courseData.chapters[i];
      await prisma.chapter.create({
        data: {
          courseId: course.id,
          name: chapter.name,
          description: chapter.description,
          orderIndex: i,
        },
      });
      console.log(`   ✓ Chapter ${i + 1}: ${chapter.name}`);
      totalChapters++;
    }

    console.log();
  }

  // Auto-assign all courses to every teacher in the institution
  console.log('🔗 Assigning courses to teachers...');
  const allCourses = await prisma.course.findMany({ select: { id: true } });
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher', institutionId: institution.id },
    select: { id: true },
  });
  for (const teacher of teachers) {
    for (const course of allCourses) {
      await prisma.teacherCourseAssignment.upsert({
        where: { teacherId_courseId: { teacherId: teacher.id, courseId: course.id } },
        create: { teacherId: teacher.id, courseId: course.id },
        update: {},
      });
    }
  }
  console.log(`   ✓ Assigned ${allCourses.length} courses to ${teachers.length} teacher(s)\n`);

  // Summary
  const courseCount = await prisma.course.count();
  const chapterCount = await prisma.chapter.count();

  console.log('─────────────────────────────────────');
  console.log(`✅ Seeding complete!`);
  console.log(`   Courses  : ${courseCount}`);
  console.log(`   Chapters : ${chapterCount} (added this run: ${totalChapters})`);
  console.log('─────────────────────────────────────');
}

seedFinalCurriculum()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
