import { api } from './apiClient';

export const analyticsService = {
  // Student
  getStudentDashboard: () => api.get('/student/dashboard'),
  getMyMastery: () => api.get('/student/mastery'),
  getCourseMastery: (courseId: string) =>
    api.get(`/student/mastery/course/${courseId}`),
  getWeakTopics: () => api.get('/student/mastery/weak-topics'),
  getPerformanceTrend: (days = 30) =>
    api.get(`/student/performance/trend?days=${days}`),

  // Teacher
  getTeacherDashboard: () => api.get('/teacher/dashboard'),
  getClassMastery: (courseId: string) =>
    api.get(`/teacher/courses/${courseId}/mastery`),
  getStudentAnalytics: (studentId: string) =>
    api.get(`/teacher/students/${studentId}/analytics`),
  generateInsights: (courseId: string) =>
    api.post(`/teacher/courses/${courseId}/insights`),

  // Admin
  getAdminDashboard: () => api.get('/admin/dashboard'),
  getSystemUsage: () => api.get('/admin/usage'),

  // Shared
  logUsage: (actionType: string, metadata?: Record<string, unknown>) =>
    api.post('/analytics/log', { actionType, metadata }),
};
