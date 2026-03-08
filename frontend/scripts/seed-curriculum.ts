// Seed script for curriculum data
// Run with: npx tsx scripts/seed-curriculum.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding curriculum data...');

  // Get or create the demo teacher user  
  let teacher = await prisma.user.findFirst({
    where: { email: 'teacher@campus.edu' },
  });

  if (!teacher) {
    console.log('Creating demo teacher...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    // Get or create institution
    let institution = await prisma.institution.findFirst();
    
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          name: 'Demo Campus',
          domain: 'campus.edu',
        },
      });
    }

    teacher = await prisma.user.create({
      data: {
        name: 'Dr. Sarah Chen',
        email: 'teacher@campus.edu',
        passwordHash: hashedPassword,
        role: 'teacher',
        institutionId: institution.id,
      },
    });
  } else {
    console.log(`Found existing teacher: ${teacher.email} (ID: ${teacher.id})`);
  }

  // Get institution
  const institution = await prisma.institution.findUnique({
    where: { id: teacher.institutionId },
  });

  if (!institution) {
    throw new Error('Institution not found');
  }

  // Create courses with chapters and content
  const courses = [
    {
      name: 'Full Stack Web Development',
      description: 'Complete guide to building modern web applications with React, Node.js, and databases',
      chapters: [
        {
          name: 'HTML & CSS Fundamentals',
          description: 'Master the building blocks of web development',
          orderIndex: 1,
          content: [
            {
              title: 'HTML5 Semantic Elements Guide',
              description: 'Learn about modern HTML5 semantic tags and document structure',
              fileUrl: 'https://www.w3schools.com/html/html5_semantic_elements.asp',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'kGW8Al_cga4', // HTML crash course
            },
            {
              title: 'CSS Flexbox Complete Tutorial',
              description: 'Master CSS Flexbox layout with practical examples',
              fileUrl: 'https://www.youtube.com/watch?v=fYq5PXgSsbE',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 2,
              isYouTube: true,
              youtubeId: 'fYq5PXgSsbE',
            },
            {
              title: 'CSS Grid Layout Guide',
              description: 'Complete guide to CSS Grid with examples',
              fileUrl: '/course-materials/css-grid-guide.pdf',
              fileType: 'application/pdf',
              fileSize: 2048000,
              orderIndex: 3,
            },
          ],
        },
        {
          name: 'JavaScript Essentials',
          description: 'Learn modern JavaScript ES6+ features',
          orderIndex: 2,
          content: [
            {
              title: 'JavaScript Fundamentals - Variables & Data Types',
              description: 'Understanding JavaScript variables, data types, and operators',
              fileUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'W6NZfCO5SIk',
            },
            {
              title: 'Functions and Arrow Functions',
              description: 'Master JavaScript functions including arrow functions and callbacks',
              fileUrl: 'https://www.youtube.com/watch?v=gigtS_5KOqo',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 2,
              isYouTube: true,
              youtubeId: 'gigtS_5KOqo',
            },
            {
              title: 'JavaScript ES6+ Features Cheat Sheet',
              description: 'Reference guide for modern JavaScript features',
              fileUrl: '/course-materials/js-es6-cheatsheet.pdf',
              fileType: 'application/pdf',
              fileSize: 1536000,
              orderIndex: 3,
            },
          ],
        },
        {
          name: 'React.js Fundamentals',
          description: 'Build dynamic user interfaces with React',
          orderIndex: 3,
          content: [
            {
              title: 'React Crash Course 2024',
              description: 'Complete React tutorial covering hooks, state management, and more',
              fileUrl: 'https://www.youtube.com/watch?v=LDB4uaJ87e0',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'LDB4uaJ87e0',
            },
            {
              title: 'React Hooks Deep Dive',
              description: 'Master useState, useEffect, useContext, and custom hooks',
              fileUrl: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 2,
              isYouTube: true,
              youtubeId: 'TNhaISOUy6Q',
            },
            {
              title: 'React Best Practices Guide',
              description: 'Industry-standard patterns and practices for React development',
              fileUrl: '/course-materials/react-best-practices.pdf',
              fileType: 'application/pdf',
              fileSize: 3072000,
              orderIndex: 3,
            },
          ],
        },
        {
          name: 'Backend Development with Node.js',
          description: 'Build scalable server-side applications',
          orderIndex: 4,
          content: [
            {
              title: 'Node.js & Express.js Full Course',
              description: 'Complete backend development course with REST APIs',
              fileUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'Oe421EPjeBE',
            },
            {
              title: 'RESTful API Design Best Practices',
              description: 'Learn how to design clean and efficient REST APIs',
              fileUrl: '/course-materials/rest-api-design.pdf',
              fileType: 'application/pdf',
              fileSize: 1843200,
              orderIndex: 2,
            },
          ],
        },
      ],
    },
    {
      name: 'Python Programming Masterclass',
      description: 'From basics to advanced Python programming with real-world projects',
      chapters: [
        {
          name: 'Python Basics',
          description: 'Start your Python journey with fundamentals',
          orderIndex: 1,
          content: [
            {
              title: 'Python for Beginners - Complete Course',
              description: 'Full tutorial covering Python basics from scratch',
              fileUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'rfscVS0vtbw',
            },
            {
              title: 'Python Data Types and Variables',
              description: 'Understanding Python data types, variables, and type conversion',
              fileUrl: '/course-materials/python-data-types.pdf',
              fileType: 'application/pdf',
              fileSize: 1228800,
              orderIndex: 2,
            },
            {
              title: 'Control Flow in Python',
              description: 'Master if statements, loops, and conditional logic',
              fileUrl: 'https://www.youtube.com/watch?v=Z-mjVrh1k34',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 3,
              isYouTube: true,
              youtubeId: 'Z-mjVrh1k34',
            },
          ],
        },
        {
          name: 'Object-Oriented Programming in Python',
          description: 'Master OOP concepts and design patterns',
          orderIndex: 2,
          content: [
            {
              title: 'Python OOP Tutorial - Complete Course',
              description: 'Classes, objects, inheritance, and polymorphism',
              fileUrl: 'https://www.youtube.com/watch?v=Ej_02ICOIgs',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'Ej_02ICOIgs',
            },
            {
              title: 'OOP Design Patterns in Python',
              description: 'Common design patterns with Python examples',
              fileUrl: '/course-materials/python-design-patterns.pdf',
              fileType: 'application/pdf',
              fileSize: 2457600,
              orderIndex: 2,
            },
          ],
        },
        {
          name: 'Data Analysis with Python',
          description: 'Analyze and visualize data using pandas and matplotlib',
          orderIndex: 3,
          content: [
            {
              title: 'Pandas Complete Tutorial',
              description: 'Data manipulation and analysis with pandas library',
              fileUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'vmEHCJofslg',
            },
            {
              title: 'Data Visualization with Matplotlib',
              description: 'Create stunning visualizations with matplotlib',
              fileUrl: 'https://www.youtube.com/watch?v=3Xc3CA655Y4',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 2,
              isYouTube: true,
              youtubeId: '3Xc3CA655Y4',
            },
            {
              title: 'Data Analysis Project Guide',
              description: 'Step-by-step guide to complete data analysis projects',
              fileUrl: '/course-materials/data-analysis-project-guide.pdf',
              fileType: 'application/pdf',
              fileSize: 3481600,
              orderIndex: 3,
            },
          ],
        },
      ],
    },
    {
      name: 'Machine Learning & AI Fundamentals',
      description: 'Introduction to machine learning algorithms and artificial intelligence',
      chapters: [
        {
          name: 'Introduction to Machine Learning',
          description: 'Core concepts and algorithms in machine learning',
          orderIndex: 1,
          content: [
            {
              title: 'Machine Learning Crash Course',
              description: 'Complete introduction to ML concepts and applications',
              fileUrl: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'GwIo3gDZCVQ',
            },
            {
              title: 'Supervised vs Unsupervised Learning',
              description: 'Understanding different types of machine learning',
              fileUrl: '/course-materials/ml-types-explained.pdf',
              fileType: 'application/pdf',
              fileSize: 1638400,
              orderIndex: 2,
            },
          ],
        },
        {
          name: 'Deep Learning with TensorFlow',
          description: 'Build neural networks with TensorFlow and Keras',
          orderIndex: 2,
          content: [
            {
              title: 'TensorFlow 2.0 Complete Course',
              description: 'Build and train neural networks with TensorFlow',
              fileUrl: 'https://www.youtube.com/watch?v=tPYj3fFJGjk',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'tPYj3fFJGjk',
            },
            {
              title: 'Neural Networks Explained',
              description: 'Visual guide to understanding neural network architectures',
              fileUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 2,
              isYouTube: true,
              youtubeId: 'aircAruvnKk',
            },
            {
              title: 'Deep Learning Best Practices',
              description: 'Tips and tricks for training effective neural networks',
              fileUrl: '/course-materials/deep-learning-best-practices.pdf',
              fileType: 'application/pdf',
              fileSize: 2867200,
              orderIndex: 3,
            },
          ],
        },
        {
          name: 'Natural Language Processing',
          description: 'Process and understand human language with AI',
          orderIndex: 3,
          content: [
            {
              title: 'NLP with Python - Complete Tutorial',
              description: 'Text processing, sentiment analysis, and language models',
              fileUrl: 'https://www.youtube.com/watch?v=fNxaJsNG3-s',
              fileType: 'video/youtube',
              fileSize: 0,
              orderIndex: 1,
              isYouTube: true,
              youtubeId: 'fNxaJsNG3-s',
            },
            {
              title: 'Transformers and BERT Explained',
              description: 'Modern NLP architectures and their applications',
              fileUrl: '/course-materials/transformers-bert-guide.pdf',
              fileType: 'application/pdf',
              fileSize: 2252800,
              orderIndex: 2,
            },
          ],
        },
      ],
    },
  ];

  for (const courseData of courses) {
    console.log(`📚 Creating course: ${courseData.name}`);
    
    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: { 
        name: courseData.name,
        institutionId: institution.id,
      },
    });

    if (existingCourse) {
      console.log(`  ⏭️  Course already exists, skipping...`);
      continue;
    }

    const course = await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        institutionId: institution.id,
        createdBy: teacher.id,
      },
    });

    // Assign course to teacher
    await prisma.teacherCourseAssignment.create({
      data: {
        teacherId: teacher.id,
        courseId: course.id,
      },
    });

    // Create chapters
    for (const chapterData of courseData.chapters) {
      console.log(`  📖 Creating chapter: ${chapterData.name}`);
      
      const chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          name: chapterData.name,
          description: chapterData.description,
          orderIndex: chapterData.orderIndex,
        },
      });

      // Create content
      for (const contentData of chapterData.content) {
        console.log(`    📄 Creating content: ${contentData.title}`);
        
        await prisma.chapterContent.create({
          data: {
            chapterId: chapter.id,
            uploadedBy: teacher.id,
            title: contentData.title,
            description: contentData.description,
            fileUrl: contentData.fileUrl,
            fileType: contentData.fileType,
            fileSize: contentData.fileSize,
            orderIndex: contentData.orderIndex,
          },
        });
      }
    }
  }

  console.log('✅ Curriculum seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
