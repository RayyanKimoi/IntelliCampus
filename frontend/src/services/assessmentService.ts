import { api } from './apiClient';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  subjectId?: string;
  courseName: string;
  subjectName?: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  totalPoints?: number;
  score?: number;
  instructions?: string;
  attachmentUrl?: string;
  type?: 'assignment' | 'quiz' | 'prerequisite';
  strictMode?: boolean;
}

export interface AssignmentQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
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
  getAssignments: () => api.get<Assignment[]>('/student/assignments'),

  getAssignment: (assignmentId: string) => api.get<AssignmentWithQuestions>(`/student/assignments/${assignmentId}`),

  getAssignmentsBySubject: (subjectId: string) => api.get<Assignment[]>(`/student/subjects/${subjectId}/assignments`),

  getSubmissions: () => api.get<Submission[]>('/student/submissions'),

  getSubmission: (assignmentId: string) => api.get<Submission>(`/student/assignments/${assignmentId}/submission`),

  submitTextAnswer: (assignmentId: string, data: { textContent: string; attachmentUrl?: string }) =>
    api.post<Submission>(`/student/assignments/${assignmentId}/submit`, data),

  // ── Attempt (Quiz) flow ────────────────────────────
  startAttempt: (assignmentId: string) => api.post<Attempt>(`/student/assignments/${assignmentId}/attempt`),

  submitAnswer: (attemptId: string, data: { questionId: string; selectedOption: string; timeTaken: number }) =>
    api.post<AnswerResult>(`/student/attempts/${attemptId}/answer`, data),

  submitAttempt: (attemptId: string) => api.post<Attempt>(`/student/attempts/${attemptId}/submit`),

  getAttemptResult: (attemptId: string) => api.get<Attempt>(`/student/attempts/${attemptId}`),

  // ── Comments ───────────────────────────────────────
  getComments: (assignmentId: string) => api.get<AssignmentComment[]>(`/student/assignments/${assignmentId}/comments`),

  postComment: (assignmentId: string, content: string) =>
    api.post<AssignmentComment>(`/student/assignments/${assignmentId}/comments`, { content }),

  // ── Quizzes ────────────────────────────────────────
  getQuizzesBySubject: (subjectId: string) => api.get<Assignment[]>(`/student/subjects/${subjectId}/quizzes`),

  getQuizzes: () => api.get<Assignment[]>('/student/quizzes'),
};
