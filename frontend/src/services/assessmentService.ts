import { api } from './apiClient';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  subjectId?: string;
  courseName: string;
  chapterName?: string;
  subjectName?: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  totalPoints?: number;
  score?: number;
  instructions?: string;
  attachmentUrl?: string;
  type?: 'assignment' | 'quiz' | 'prerequisite';
  strictMode?: boolean;
  aiGraded?: boolean;
  teacherComment?: string | null;
  attemptId?: string | null;
}

export interface AssignmentQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: string;
  topicId?: string;
  topicName?: string;
  difficultyLevel?: string;
  explanation?: string;
}

export interface AssignmentWithQuestions extends Assignment {
  questions: AssignmentQuestion[];
}

export interface Attempt {
  id: string;
  assignmentId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  answers?: AnswerResult[];
}

export interface AnswerResult {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  correctOption?: string;
  explanation?: string;
  topicId?: string;
  topicName?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  submittedAt: string;
  score?: number;
  totalPoints?: number;
  status: 'submitted' | 'graded' | 'pending_review';
  teacherComment?: string;
  textContent?: string;
  attachmentUrl?: string;
}

export interface AssignmentComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'teacher';
  createdAt: string;
}

export const assessmentService = {
  // ── Assignment CRUD ───────────────────────────────
  getAssignments: async () => {
    try {
      console.log('[assessmentService] Fetching all assignments...');
      const result = await api.get<{ success: boolean; data: Assignment[] }>('/student/assignments');
      console.log('[assessmentService] Assignments loaded:', result?.data?.length || 0);
      return result;
    } catch (error) {
      console.error('[assessmentService] Failed to fetch assignments:', error);
      return { success: true, data: [] };
    }
  },

  /** Fetch published assignments for a specific course (used by the per-course Assignments tab) */
  getAssignmentsByCourse: async (courseId: string): Promise<Assignment[]> => {
    try {
      const result = await api.get<{ success: boolean; data: Assignment[] }>(`/student/courses/${courseId}/assignments`);
      return result?.data ?? [];
    } catch (error) {
      console.error('[assessmentService] Failed to fetch course assignments:', error);
      return [];
    }
  },

  getAssignment: async (assignmentId: string) => {
    try {
      console.log('[assessmentService] Fetching assignment:', assignmentId);
      const result = await api.get<{ success: boolean; data: AssignmentWithQuestions }>(`/student/assignments/${assignmentId}`);
      console.log('[assessmentService] Assignment loaded:', result?.data?.title);
      return result;
    } catch (error) {
      console.error('[assessmentService] Failed to fetch assignment:', error);
      throw error;
    }
  },

  getAssignmentsBySubject: async (subjectId: string) => {
    try {
      console.log('[assessmentService] Fetching assignments for subject:', subjectId);
      // For now, filter from all assignments since we don't have a subject-specific route
      const allAssignments = await assessmentService.getAssignments();
      const assignments = allAssignments?.data || [];
      const filtered = assignments.filter((a: Assignment) => a.subjectId === subjectId || a.courseId === subjectId);
      console.log('[assessmentService] Subject assignments loaded:', filtered.length);
      return { success: true, data: filtered };
    } catch (error) {
      console.error('[assessmentService] Failed to fetch subject assignments:', error);
      return { success: true, data: [] };
    }
  },

  getSubmissions: async () => {
    try {
      console.log('[assessmentService] Fetching all submissions...');
      const result = await api.get<{ success: boolean; data: Submission[] }>('/student/submissions');
      console.log('[assessmentService] Submissions loaded:', result?.data?.length || 0);
      return result;
    } catch (error) {
      console.error('[assessmentService] Failed to fetch submissions:', error);
      return { success: true, data: [] };
    }
  },

  getSubmission: (assignmentId: string) => api.get<{ success: boolean; data: Submission }>(`/student/assignments/${assignmentId}/submission`),

  submitTextAnswer: (assignmentId: string, data: { textContent: string; attachmentUrl?: string }) =>
    api.post<{ success: boolean; data: Submission }>(`/student/assignments/${assignmentId}/submit`, data),

  // ── Attempt (Quiz) flow ────────────────────────────
  startAttempt: (assignmentId: string) => api.post<{ success: boolean; data: Attempt }>(`/student/assignments/${assignmentId}/attempt`),

  submitAnswer: (attemptId: string, data: { questionId: string; selectedOption: string; timeTaken: number }) =>
    api.post<{ success: boolean; data: AnswerResult }>(`/student/attempts/${attemptId}/answer`, data),

  /** Submit a quiz attempt (no extra content) */
  submitAttempt: (attemptId: string) => api.post<{ success: boolean; data: Attempt }>(`/student/attempts/${attemptId}/submit`),

  /** Submit an open-ended assignment attempt with text/code/file content */
  submitAssignmentWork: (
    attemptId: string,
    content: {
      textContent?: string;
      codeContent?: string;
      codeLanguage?: string;
      submissionFileUrl?: string;
      executionResult?: { stdout: string; stderr: string; executionTime: string };
    },
  ) => api.post<{ success: boolean; data: Attempt }>(`/student/attempts/${attemptId}/submit`, content),

  /** Upload a file for a student submission; returns { url, filename, size } */
  uploadSubmissionFile: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadFile<{ url: string; filename: string; size: number }>('/student/upload', formData);
  },

  getAttemptResult: (attemptId: string) => api.get<{ success: boolean; data: Attempt }>(`/student/attempts/${attemptId}`),

  /** Fetch full assignment result with evaluation details */
  getAssignmentResult: (assignmentId: string) => api.get(`/student/assignments/${assignmentId}/result`),

  // ── Comments ───────────────────────────────────────
  getComments: (assignmentId: string) => api.get<{ success: boolean; data: AssignmentComment[] }>(`/student/assignments/${assignmentId}/comments`),

  postComment: (assignmentId: string, content: string) =>
    api.post<{ success: boolean; data: AssignmentComment }>(`/student/assignments/${assignmentId}/comments`, { content }),

  // ── Quizzes ────────────────────────────────────────
  getQuizzesBySubject: (subjectId: string) => api.get<{ success: boolean; data: Assignment[] }>(`/student/subjects/${subjectId}/quizzes`),

  getQuizzes: () => api.get<{ success: boolean; data: Assignment[] }>('/student/quizzes', { cache: 'no-store' } as any),

  /** Fetch published quizzes for a specific enrolled course */
  getQuizzesByCourse: async (courseId: string): Promise<Assignment[]> => {
    try {
      const result = await api.get<{ success: boolean; data: Assignment[] }>(`/student/quizzes?courseId=${courseId}`);
      return result?.data ?? [];
    } catch (error) {
      console.error('[assessmentService] Failed to fetch course quizzes:', error);
      return [];
    }
  },
};
