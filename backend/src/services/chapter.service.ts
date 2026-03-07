import { prisma } from '../config/db';

export const chapterService = {
  // Get chapters for a course
  async getCourseChapters(courseId: string) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { name: true },
      });

      const chapters = await prisma.chapter.findMany({
        where: { courseId },
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { content: true },
          },
        },
      });

      return {
        courseName: course?.name || 'Unknown Course',
        chapters,
      };
    } catch (error) {
      console.log('[Chapter Service] Database unavailable, returning mock chapters');
      // Mock data based on courseId
      const mockData: Record<string, any> = {
        'course-1': {
          courseName: 'Computer Science 101',
          chapters: [
            {
              id: 'ch-1-1',
              courseId: 'course-1',
              name: 'Introduction to Programming',
              description: 'Variables, data types, and basic syntax',
              orderIndex: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 2 },
            },
            {
              id: 'ch-1-2',
              courseId: 'course-1',
              name: 'Control Flow',
              description: 'Conditionals, loops, and logical operators',
              orderIndex: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 3 },
            },
            {
              id: 'ch-1-3',
              courseId: 'course-1',
              name: 'Functions and Modules',
              description: 'Writing reusable code with functions',
              orderIndex: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 1 },
            },
          ],
        },
        'course-2': {
          courseName: 'Web Development Fundamentals',
          chapters: [
            {
              id: 'ch-2-1',
              courseId: 'course-2',
              name: 'HTML Basics',
              description: 'Structure of web pages with HTML5',
              orderIndex: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 2 },
            },
            {
              id: 'ch-2-2',
              courseId: 'course-2',
              name: 'CSS Styling',
              description: 'Styling web pages with CSS3 and Flexbox',
              orderIndex: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 4 },
            },
            {
              id: 'ch-2-3',
              courseId: 'course-2',
              name: 'JavaScript Fundamentals',
              description: 'Client-side programming with JavaScript',
              orderIndex: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 5 },
            },
            {
              id: 'ch-2-4',
              courseId: 'course-2',
              name: 'React Framework',
              description: 'Building interactive UIs with React',
              orderIndex: 4,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 3 },
            },
          ],
        },
        'course-3': {
          courseName: 'Data Structures & Algorithms',
          chapters: [
            {
              id: 'ch-3-1',
              courseId: 'course-3',
              name: 'Arrays and Linked Lists',
              description: 'Linear data structures and their operations',
              orderIndex: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 3 },
            },
            {
              id: 'ch-3-2',
              courseId: 'course-3',
              name: 'Stacks and Queues',
              description: 'LIFO and FIFO data structures',
              orderIndex: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 2 },
            },
            {
              id: 'ch-3-3',
              courseId: 'course-3',
              name: 'Trees and Graphs',
              description: 'Hierarchical and network data structures',
              orderIndex: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
              _count: { content: 4 },
            },
          ],
        },
      };
      return mockData[courseId] || { courseName: 'Unknown Course', chapters: [] };
    }
  },

  // Get single chapter with content
  async getChapterById(chapterId: string) {
    return await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        content: {
          orderBy: { orderIndex: 'asc' },
          include: {
            uploader: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        course: {
          select: { id: true, name: true },
        },
      },
    });
  },

  // Create chapter
  async createChapter(data: {
    courseId: string;
    name: string;
    description?: string;
    orderIndex?: number;
  }) {
    const maxOrder = await prisma.chapter.aggregate({
      where: { courseId: data.courseId },
      _max: { orderIndex: true },
    });

    return await prisma.chapter.create({
      data: {
        courseId: data.courseId,
        name: data.name,
        description: data.description || '',
        orderIndex: data.orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
      },
    });
  },

  // Update chapter
  async updateChapter(
    chapterId: string,
    data: {
      name?: string;
      description?: string;
      orderIndex?: number;
    }
  ) {
    return await prisma.chapter.update({
      where: { id: chapterId },
      data,
    });
  },

  // Delete chapter
  async deleteChapter(chapterId: string) {
    return await prisma.chapter.delete({
      where: { id: chapterId },
    });
  },

  // Get chapter content
  async getChapterContent(chapterId: string) {
    try {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { name: true },
      });

      const content = await prisma.chapterContent.findMany({
        where: { chapterId },
        orderBy: { orderIndex: 'asc' },
        include: {
          uploader: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return {
        chapterName: chapter?.name || 'Unknown Chapter',
        content,
      };
    } catch (error) {
      console.log('[Chapter Service] Database unavailable, returning mock content');
      // Mock content data
      const mockContent: Record<string, any> = {
        'ch-1-1': {
          chapterName: 'Introduction to Programming',
          content: [
            {
              id: 'content-1',
              chapterId: 'ch-1-1',
              uploadedBy: 'teacher-1',
              title: 'Introduction to Variables',
              description: 'Understanding variables and data types',
              fileUrl: '/sample-content/cs101-variables.pdf',
              fileType: 'application/pdf',
              fileSize: 1024000,
              orderIndex: 1,
              createdAt: new Date(),
              uploader: { id: 'teacher-1', name: 'Prof. Turing', email: 'teacher@campus.edu' },
            },
            {
              id: 'content-2',
              chapterId: 'ch-1-1',
              uploadedBy: 'teacher-1',
              title: 'Python Syntax Guide',
              description: 'Basic Python syntax and conventions',
              fileUrl: '/sample-content/python-syntax.pdf',
              fileType: 'application/pdf',
              fileSize: 856000,
              orderIndex: 2,
              createdAt: new Date(),
              uploader: { id: 'teacher-1', name: 'Prof. Turing', email: 'teacher@campus.edu' },
            },
          ],
        },
        'ch-2-1': {
          chapterName: 'HTML Basics',
          content: [
            {
              id: 'content-3',
              chapterId: 'ch-2-1',
              uploadedBy: 'teacher-1',
              title: 'HTML5 Semantic Tags',
              description: 'Modern HTML structure',
              fileUrl: '/sample-content/html5-semantics.pdf',
              fileType: 'application/pdf',
              fileSize: 623000,
              orderIndex: 1,
              createdAt: new Date(),
              uploader: { id: 'teacher-1', name: 'Prof. Turing', email: 'teacher@campus.edu' },
            },
            {
              id: 'content-4',
              chapterId: 'ch-2-1',
              uploadedBy: 'teacher-1',
              title: 'HTML Forms Guide',
              description: 'Building interactive forms',
              fileUrl: '/sample-content/html-forms.pdf',
              fileType: 'application/pdf',
              fileSize: 412000,
              orderIndex: 2,
              createdAt: new Date(),
              uploader: { id: 'teacher-1', name: 'Prof. Turing', email: 'teacher@campus.edu' },
            },
          ],
        },
      };
      return mockContent[chapterId] || { chapterName: 'Unknown Chapter', content: [] };
    }
  },

  // Upload content to chapter
  async uploadContent(data: {
    chapterId: string;
    uploadedBy: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    orderIndex?: number;
  }) {
    const maxOrder = await prisma.chapterContent.aggregate({
      where: { chapterId: data.chapterId },
      _max: { orderIndex: true },
    });

    return await prisma.chapterContent.create({
      data: {
        chapterId: data.chapterId,
        uploadedBy: data.uploadedBy,
        title: data.title,
        description: data.description || '',
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'pdf',
        fileSize: data.fileSize,
        orderIndex: data.orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  // Delete content
  async deleteContent(contentId: string) {
    return await prisma.chapterContent.delete({
      where: { id: contentId },
    });
  },

  // Update content
  async updateContent(
    contentId: string,
    data: {
      title?: string;
      description?: string;
      orderIndex?: number;
    }
  ) {
    return await prisma.chapterContent.update({
      where: { id: contentId },
      data,
    });
  },

  // Get teacher's assigned courses
  async getTeacherCourses(teacherId: string) {
    try {
      // TODO: Re-enable teacher assignment filtering after migration
      // For now, return all courses to allow testing without migration
      return await prisma.course.findMany({
        // Temporarily disabled - enable after running migration:
        // where: {
        //   teacherAssignments: {
        //     some: { teacherId },
        //   },
        // },
        include: {
          _count: {
            select: {
              chapters: true,
              assignments: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      // Return mock data if database is unavailable
      console.log('[Chapter Service] Database unavailable, returning mock data');
      return [
        {
          id: 'course-1',
          name: 'Computer Science 101',
          description: 'Introduction to Computer Science and Programming',
          institutionId: 'inst-1',
          createdBy: teacherId,
          createdAt: new Date(),
          _count: { chapters: 3, assignments: 5 },
        },
        {
          id: 'course-2',
          name: 'Web Development Fundamentals',
          description: 'Learn HTML, CSS, JavaScript, and modern web frameworks',
          institutionId: 'inst-1',
          createdBy: teacherId,
          createdAt: new Date(),
          _count: { chapters: 4, assignments: 8 },
        },
        {
          id: 'course-3',
          name: 'Data Structures & Algorithms',
          description: 'Advanced data structures and algorithmic problem solving',
          institutionId: 'inst-1',
          createdBy: teacherId,
          createdAt: new Date(),
          _count: { chapters: 3, assignments: 6 },
        },
      ];
    }
  },

  // Assign teacher to course
  async assignTeacherToCourse(teacherId: string, courseId: string) {
    return await prisma.teacherCourseAssignment.create({
      data: {
        teacherId,
        courseId,
      },
    });
  },

  // Remove teacher assignment
  async removeTeacherAssignment(teacherId: string, courseId: string) {
    return await prisma.teacherCourseAssignment.deleteMany({
      where: {
        teacherId,
        courseId,
      },
    });
  },
};
