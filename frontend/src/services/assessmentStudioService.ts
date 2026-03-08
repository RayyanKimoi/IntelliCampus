import { api } from './apiClient';

export interface RubricItem {
  name: string;
  maxScore: number;
}

export interface Assessment {
  id: string;
  courseId: string;
  chapterId?: string | null;
  teacherId: string;
  title: string;
  description: string;
  type: 'assignment' | 'quiz';
  dueDate: string;
  isPublished: boolean;
  submissionTypes?: string[] | null;
  rubric?: RubricItem[] | null;
  assignmentDocumentUrl?: string | null;
  evaluationPoints?: number | null;
  createdAt: string;
  course?: { id: string; name: string };
  chapter?: { id: string; name: string } | null;
  _count?: { questions: number; studentAttempts: number };
}

export interface Question {
  id: string;
  assignmentId?: string | null;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string | null;
  difficultyLevel: string;
}

export interface CreateAssignmentPayload {
  courseId: string;
  chapterId?: string;
  title: string;
  description?: string;
  type?: 'assignment' | 'quiz';
  dueDate: string;
  submissionTypes?: string[];
  rubric?: RubricItem[];
  assignmentDocumentUrl?: string;
  evaluationPoints?: number;
}

export interface CreateQuestionPayload {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const assessmentStudioService = {
  /** List all teacher assessments, optionally filtered by courseId */
  async getAssessments(courseId?: string): Promise<Assessment[]> {
    const query = courseId ? `?courseId=${courseId}` : '';
    return unwrap<Assessment[]>(await api.get(`/teacher/assessment-studio${query}`));
  },

  /** Get a single assessment detail with questions */
  async getAssessment(id: string): Promise<Assessment & { questions: Question[] }> {
    return unwrap(await api.get(`/teacher/assessment-studio/${id}`));
  },

  /** Create an assignment */
  async createAssignment(data: CreateAssignmentPayload): Promise<Assessment> {
    return unwrap(await api.post('/teacher/assessment-studio', { ...data, type: 'assignment' }));
  },

  /** Create a quiz */
  async createQuiz(data: CreateAssignmentPayload): Promise<Assessment> {
    return unwrap(await api.post('/teacher/assessment-studio', { ...data, type: 'quiz' }));
  },

  /** Update an assessment */
  async updateAssessment(id: string, data: Partial<CreateAssignmentPayload & { isPublished: boolean }>): Promise<Assessment> {
    return unwrap(await api.put(`/teacher/assessment-studio/${id}`, data));
  },

  /** Delete an assessment */
  async deleteAssessment(id: string): Promise<void> {
    await api.delete(`/teacher/assessment-studio/${id}`);
  },

  /** Publish an assessment */
  async publishAssessment(id: string): Promise<Assessment> {
    return unwrap(await api.post(`/teacher/assessment-studio/${id}/publish`, {}));
  },

  /** Add a question to an assessment */
  async addQuestion(assignmentId: string, data: CreateQuestionPayload): Promise<Question> {
    return unwrap(await api.post(`/teacher/assessment-studio/${assignmentId}/questions`, data));
  },

  /** Update a question */
  async updateQuestion(questionId: string, data: Partial<CreateQuestionPayload>): Promise<Question> {
    return unwrap(await api.put(`/teacher/questions/${questionId}`, data));
  },

  /** Delete a question */
  async deleteQuestion(questionId: string): Promise<void> {
    await api.delete(`/teacher/questions/${questionId}`);
  },

  /** Generate AI quiz from chapter content */
  async generateAIQuiz(data: {
    courseId: string;
    chapterId: string;
    title: string;
    description?: string;
    dueDate?: string;
    difficultyLevel?: string;
    questionCount?: number;
  }): Promise<{ assignment: Assessment; questions: Question[] }> {
    return unwrap(await api.post('/teacher/assessment-studio/quiz/ai-generate', data));
  },

  /** Upload an assignment document file, returns { url, filename, size } */
  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadFile<{ url: string; filename: string; size: number }>('/teacher/upload-file', formData);
  },
};
