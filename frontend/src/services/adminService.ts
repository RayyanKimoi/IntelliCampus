import { api } from './apiClient';

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  aiUsage: {
    totalRequests: number;
    tokensUsed: number;
  };
  systemHealth: {
    database: 'healthy' | 'degraded' | 'down';
    aiService: 'healthy' | 'degraded' | 'down';
  };
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  institutionId: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface AIPolicy {
  institutionId: string;
  hintModeOnly: boolean;
  strictExamMode: boolean;
  maxTokens: number;
}

export const adminService = {
  getDashboardStats: () => api.get<AdminDashboardStats>('/admin/dashboard'),

  getUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get<{ users: UserSummary[]; total: number }>('/admin/users', params),

  getAIPolicy: () => api.get<AIPolicy>('/admin/ai-policy'),

  updateAIPolicy: (policy: Partial<AIPolicy>) =>
    api.put<AIPolicy>('/admin/ai-policy', policy),

  getSystemLogs: (limit = 50) =>
    api.get<any[]>('/admin/logs', { limit }),
};
