import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export class CurriculumService {
  /**
   * Create a course
   */
  async createCourse(data: {
    name: string;
    description?: string;
    createdBy: string;
    institutionId: string;
  }) {
    const course = await prisma.course.create({
      data: {
        name: data.name,
        description: data.description || '',
        createdBy: data.createdBy,
        institutionId: data.institutionId,
      },
    });
    logger.info('CurriculumService', `Course created: ${course.name}`);
    return course;
  }

  /**
   * Get courses for institution
   */
  async getCourses(institutionId: string) {
    const courses = await prisma.course.findMany({
      where: { institutionId },
      include: {
        subjects: {
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        _count: {
          select: { assignments: true, chapters: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Expose chapter count as subjectCount so student UI displays it correctly
    return courses.map((c) => ({
      ...c,
      subjectCount: c._count.chapters,
    }));
  }

  /**
   * Get single course with full hierarchy
   */
  async getCourseById(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subjects: {
          include: {
            topics: {
              include: {
                curriculumContent: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Create a subject under a course
   */
  async createSubject(data: {
    courseId: string;
    name: string;
    description?: string;
  }) {
    return prisma.subject.create({
      data: {
        courseId: data.courseId,
        name: data.name,
        description: data.description || '',
      },
    });
  }

  /**
   * Create a topic under a subject
   */
  async createTopic(data: {
    subjectId: string;
    name: string;
    description?: string;
    difficultyLevel?: string;
    orderIndex?: number;
  }) {
    return prisma.topic.create({
      data: {
        subjectId: data.subjectId,
        name: data.name,
        description: data.description || '',
        difficultyLevel: (data.difficultyLevel as any) || 'beginner',
        orderIndex: data.orderIndex || 0,
      },
    });
  }

  /**
   * Upload curriculum content for a topic
   */
  async uploadContent(data: {
    topicId: string;
    uploadedBy: string;
    title: string;
    contentText: string;
    fileUrl?: string;
    embeddingId?: string;
  }) {
    const content = await prisma.curriculumContent.create({
      data: {
        topicId: data.topicId,
        uploadedBy: data.uploadedBy,
        title: data.title,
        contentText: data.contentText,
        fileUrl: data.fileUrl,
        embeddingId: data.embeddingId,
      },
      include: {
        topic: {
          select: {
            subject: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });
    
    logger.info('CurriculumService', `Content uploaded: ${content.title} for topic ${data.topicId}`);

    // Trigger AI embedding asynchronously
    this.triggerEmbedding(content).catch(err => {
      logger.error('CurriculumService', `Failed to trigger embedding for content ${content.id}: ${err.message}`);
    });

    return content;
  }

  /**
   * Trigger AI service to embed content
   */
  private async triggerEmbedding(content: any) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    
    // Need to fetch courseId if not present in content object
    let courseId = content.topic?.subject?.courseId;
    
    if (!courseId) {
       const topic = await prisma.topic.findUnique({
         where: { id: content.topicId },
         include: { subject: true }
       });
       courseId = topic?.subject?.courseId;
    }

    try {
      const response = await fetch(`${aiServiceUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.contentText,
          topicId: content.topicId,
          courseId: courseId,
          metadata: {
            contentId: content.id,
            title: content.title,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }
      
      const result = await response.json() as any;
      if (result.success && result.data?.embeddingIds) {
        // Mark as embedded
        await prisma.curriculumContent.update({
          where: { id: content.id },
          data: { embeddingId: 'embedded' }, 
        });
        logger.info('CurriculumService', `Content ${content.id} embedded successfully`);
      }
    } catch (error) {
      logger.error('CurriculumService', `Embedding error: ${error}`);
    }
  }

  /**
   * Get content for a topic
   */
  async getTopicContent(topicId: string) {
    return prisma.curriculumContent.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Set prerequisite relation between topics
   */
  async setPrerequisite(topicId: string, prerequisiteTopicId: string) {
    return prisma.prerequisiteRelation.create({
      data: { topicId, prerequisiteTopicId },
    });
  }

  /**
   * Get prerequisites for a topic
   */
  async getPrerequisites(topicId: string) {
    return prisma.prerequisiteRelation.findMany({
      where: { topicId },
      include: {
        prerequisite: true,
      },
    });
  }

  /**
   * Get subjects for a course
   */
  async getSubjects(courseId: string) {
    return prisma.subject.findMany({
      where: { courseId },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  /**
   * Get topics for a subject
   */
  async getTopics(subjectId: string) {
    return prisma.topic.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Get enrolled courses with mastery for a student (OPTIMIZED)
   * Returns all data in a single query to avoid N+1 problem
   */
  async getStudentCoursesWithMastery(studentId: string, institutionId: string) {
    // Get all courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          where: { institutionId },
          include: {
            _count: {
              select: { chapters: true },
            },
          },
        },
      },
    });

    // Get all mastery records for this student in one query
    const masteryRecords = await prisma.masteryGraph.findMany({
      where: {
        userId: studentId,
        topic: {
          subject: {
            courseId: {
              in: enrollments.map(e => e.course.id),
            },
          },
        },
      },
      include: {
        topic: {
          select: {
            subject: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    // Group mastery by course
    const masteryByCourse = masteryRecords.reduce((acc, record) => {
      const courseId = record.topic.subject.courseId;
      if (!acc[courseId]) {
        acc[courseId] = [];
      }
      acc[courseId].push(record.masteryScore);
      return acc;
    }, {} as Record<string, number[]>);

    // Build response with all data
    return enrollments.map(enrollment => {
      const course = enrollment.course;
      const masteryScores = masteryByCourse[course.id] || [];
      const overallMastery = masteryScores.length > 0
        ? Math.round(masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length)
        : 0;

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        subjectCount: course._count.chapters,
        mastery: overallMastery,
        enrolledAt: enrollment.enrolledAt,
      };
    });
  }
}

export const curriculumService = new CurriculumService();
