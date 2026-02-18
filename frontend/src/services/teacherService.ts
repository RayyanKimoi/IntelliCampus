import { api } from './apiClient';

export const teacherService = {
  // Dashboard
  getDashboard: () => api.get('/teacher/dashboard'),

  // Courses
  getCourses: () => api.get('/teacher/courses'),
  getCourse: (courseId: string) => api.get(`/teacher/courses/${courseId}`),
  createCourse: (data: { name: string; description: string }) =>
    api.post('/teacher/courses', data),

  // Subjects
  createSubject: (courseId: string, data: { name: string; description: string }) =>
    api.post(`/teacher/courses/${courseId}/subjects`, data),

  // Topics
  createTopic: (subjectId: string, data: { name: string; description: string; difficultyLevel: string; orderIndex: number }) =>
    api.post(`/teacher/subjects/${subjectId}/topics`, data),

  // Content
  uploadContent: (topicId: string, data: { content: string; contentType?: string }) =>
    api.post(`/teacher/topics/${topicId}/content`, data),
  getTopicContent: (topicId: string) =>
    api.get(`/teacher/topics/${topicId}/content`),

  // Assignments
  getAssignments: (courseId: string) =>
    api.get(`/teacher/courses/${courseId}/assignments`),
  createAssignment: (courseId: string, data: {
    title: string;
    description: string;
    dueDate: string;
    strictMode?: boolean;
  }) => api.post(`/teacher/courses/${courseId}/assignments`, data),
  addQuestion: (assignmentId: string, data: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    topicId?: string;
    points?: number;
  }) => api.post(`/teacher/assignments/${assignmentId}/questions`, data),

  // Analytics
  getClassMastery: (courseId: string) =>
    api.get(`/teacher/courses/${courseId}/mastery`),
  getStudentAnalytics: (studentId: string) =>
    api.get(`/teacher/students/${studentId}/analytics`),
  generateInsights: (courseId: string) =>
    api.post(`/teacher/courses/${courseId}/insights`),

  // Results
  getAssignmentResults: (assignmentId: string) =>
    api.get(`/teacher/assignments/${assignmentId}/results`),
};
