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

export const curriculumService = {
  getCourses: () => api.get<Course[]>('/student/courses'),

  getCourse: (courseId: string) => api.get<Course>(`/student/courses/${courseId}`),

  getSubjects: (courseId: string) => api.get<Subject[]>(`/student/courses/${courseId}/subjects`),

  getTopics: (subjectId: string) => api.get<Topic[]>(`/student/subjects/${subjectId}/topics`),
};
