import { api } from './apiClient';

export interface Course {
  id: string;
  name: string;
  description: string;
  institutionId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  courseId: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  difficultyLevel: string;
  subjectId: string;
  orderIndex: number;
}

export interface ChapterContentItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'youtube';
  fileUrl: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  fileSize?: number | null;
  orderIndex: number;
  createdAt: string;
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  content: ChapterContentItem[];
}

export const curriculumService = {
  getCourses: () => api.get<Course[]>('/student/courses'),

  getCourse: (courseId: string) => api.get<Course>(`/student/courses/${courseId}`),

  getSubjects: (courseId: string) => api.get<Subject[]>(`/student/courses/${courseId}/subjects`),

  getTopics: (subjectId: string) => api.get<Topic[]>(`/student/subjects/${subjectId}/topics`),

  getChapters: (courseId: string) =>
    api.get<{ courseName: string; chapters: Chapter[] }>(`/student/courses/${courseId}/chapters`),
};
