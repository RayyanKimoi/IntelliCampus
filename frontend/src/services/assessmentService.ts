import { api } from './apiClient';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName: string; // backend might include this
  status: 'pending' | 'submitted' | 'graded' | 'late';
  totalPoints?: number;
  score?: number;
}

export interface Attempt {
  id: string;
  assignmentId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
}

export const assessmentService = {
  getAssignments: () => api.get<Assignment[]>('/student/assignments'),

  getAssignment: (assignmentId: string) => api.get<Assignment>(`/student/assignments/${assignmentId}`),

  startAttempt: (assignmentId: string) => api.post<Attempt>(`/student/assignments/${assignmentId}/attempt`),
  
  submitAnswer: (attemptId: string, data: { questionId: string; selectedOption: string; timeTaken: number }) => 
    api.post(`/student/attempts/${attemptId}/answer`, data),

  submitAttempt: (attemptId: string) => api.post(`/student/attempts/${attemptId}/submit`),
};
