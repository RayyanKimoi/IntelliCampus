import { api } from './apiClient';

export interface Course {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: {
    chapters: number;
    assignments: number;
  };
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  courseId: string;
  name: string;
  description: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    content: number;
  };
  content?: ChapterContent[];
  course?: {
    id: string;
    name: string;
  };
}

export interface ChapterContent {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  // Content type: pdf | doc | ppt | image | youtube
  type: string;
  fileUrl: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  teacherNotes?: string;
  fileType: string;
  fileSize: number;
  orderIndex: number;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export const chapterCurriculumService = {
  // Get teacher's assigned courses
  async getTeacherCourses(): Promise<Course[]> {
    const response = await api.get('/teacher/curriculum/courses');
    return response.data || response;
  },

  // Get chapters for a course
  async getCourseChapters(courseId: string): Promise<{ courseName: string; chapters: Chapter[] }> {
    const response = await api.get(`/teacher/curriculum/courses/${courseId}/chapters`);
    return response.data || response;
  },

  // Get chapter detail with content
  async getChapter(chapterId: string): Promise<Chapter> {
    const response = await api.get(`/teacher/curriculum/chapters/${chapterId}`);
    return response.data || response;
  },

  // Create chapter
  async createChapter(data: {
    courseId: string;
    name: string;
    description?: string;
    orderIndex?: number;
  }): Promise<Chapter> {
    const { courseId, ...chapterData } = data;
    const response = await api.post(`/teacher/curriculum/courses/${courseId}/chapters`, chapterData);
    return response.data || response;
  },

  // Update chapter
  async updateChapter(
    chapterId: string,
    data: {
      name?: string;
      description?: string;
      orderIndex?: number;
    }
  ): Promise<Chapter> {
    const response = await api.put(`/teacher/curriculum/chapters/${chapterId}`, data);
    return response.data || response;
  },

  // Delete chapter
  async deleteChapter(chapterId: string): Promise<void> {
    await api.delete(`/teacher/curriculum/chapters/${chapterId}`);
  },

  // Get chapter content
  async getChapterContent(chapterId: string): Promise<{ chapterName: string; content: ChapterContent[]; teacherNotes?: string }> {
    const response = await api.get(`/teacher/curriculum/chapters/${chapterId}/content`);
    return response.data || response;
  },

  // Upload file content (PDF, DOC, PPT, image)
  async uploadFile(data: {
    chapterId: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    type?: string;
  }): Promise<ChapterContent> {
    const response = await api.post(`/teacher/curriculum/chapters/${data.chapterId}/content`, data);
    return response.data || response;
  },

  // Add YouTube video content
  async addYoutubeVideo(data: {
    chapterId: string;
    title: string;
    youtubeUrl: string;
  }): Promise<ChapterContent> {
    const response = await api.post(`/teacher/curriculum/chapters/${data.chapterId}/content`, {
      ...data,
      fileUrl: data.youtubeUrl,
      fileType: 'video/youtube',
    });
    return response.data || response;
  },

  // Save teacher notes for AI summary guidance
  async saveTeacherNotes(chapterId: string, notes: string): Promise<{ chapterId: string; teacherNotes: string }> {
    const response = await api.post(`/teacher/curriculum/chapters/${chapterId}/content/teacher-notes`, { notes });
    return response.data || response;
  },

  // Legacy uploadContent (kept for backward compat)
  async uploadContent(data: {
    chapterId: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }): Promise<ChapterContent> {
    const response = await api.post('/teacher/curriculum/content', data);
    return response.data || response;
  },

  // Update content
  async updateContent(
    chapterId: string,
    contentId: string,
    data: {
      title?: string;
      description?: string;
    }
  ): Promise<ChapterContent> {
    const response = await api.put(`/teacher/curriculum/chapters/${chapterId}/content/${contentId}`, data);
    return response.data || response;
  },

  // Delete content
  async deleteContent(chapterId: string, contentId: string): Promise<void> {
    await api.delete(`/teacher/curriculum/chapters/${chapterId}/content/${contentId}`);
  },
};

