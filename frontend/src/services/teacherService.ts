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
  getSubjects: (courseId: string) => api.get(`/teacher/courses/${courseId}/subjects`),

  // Topics
  createTopic: (subjectId: string, data: { name: string; description: string; difficultyLevel: string; orderIndex: number }) =>
    api.post(`/teacher/subjects/${subjectId}/topics`, data),
  getTopics: (subjectId: string) => api.get(`/teacher/subjects/${subjectId}/topics`),

  // Content
  uploadContent: (topicId: string, data: { content: string; contentType?: string }) =>
    api.post(`/teacher/topics/${topicId}/content`, data),
  getTopicContent: (topicId: string) =>
    api.get(`/teacher/topics/${topicId}/content`),

  // Assignments
  getAssignments: (courseId: string) =>
    api.get(`/teacher/courses/${courseId}/assignments`),
  getAllAssignments: () => api.get('/teacher/assignments'),
  createAssignment: (data: {
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    strictMode?: boolean;
    type?: 'assignment' | 'quiz';
  }) => api.post('/teacher/assignments', data),
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
  updateQuestion: (questionId: string, data: Partial<{
    questionText: string; optionA: string; optionB: string; optionC: string;
    optionD: string; correctOption: string;
  }>) => api.put(`/teacher/questions/${questionId}`, data),
  deleteQuestion: (questionId: string) => api.delete(`/teacher/questions/${questionId}`),
  publishAssignment: (assignmentId: string) =>
    api.post(`/teacher/assignments/${assignmentId}/publish`),

  // AI Quiz Generation
  generateQuiz: (data: {
    title: string;
    dueDate: string;
    courseId: string;
    subjectId?: string;
    topicId?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    numberOfQuestions: number;
  }) => api.post('/teacher/quiz/generate', data),

  // Results / Evaluation
  getAssignmentResults: (assignmentId: string) =>
    api.get(`/teacher/assignments/${assignmentId}/results`),
  getAllSubmissions: () => api.get('/teacher/submissions'),
  gradeSubmission: (attemptId: string, data: { score: number; comment: string }) =>
    api.post(`/teacher/attempts/${attemptId}/grade`, data),

  // Analytics
  getClassMastery: (courseId: string) =>
    api.get(`/teacher/courses/${courseId}/mastery`),
  getCohortAnalytics: () => api.get('/teacher/cohort'),
  getStudentAnalytics: (studentId: string) =>
    api.get(`/teacher/students/${studentId}/analytics`),
  generateInsights: (courseId: string) =>
    api.post(`/teacher/courses/${courseId}/insights`),

  // Integrity
  getIntegrityFlags: () => api.get('/teacher/integrity'),

  // Reports
  exportReport: (courseId: string) =>
    api.post('/teacher/report/export', { courseId }),
};
