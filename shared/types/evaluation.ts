// ========================
// Evaluation & Results Types
// ========================

export interface StudentEvaluationRow {
  studentId: string;
  name: string;
  email: string;
  /** Average mastery score across topics in the course (0–100) */
  masteryScore?: number | null;
  /** Best assignment score in the course */
  assignmentScore?: number | null;
  /** Teacher-set evaluation score (0–100) */
  evaluationScore?: number | null;
  /** Feedback text from teacher */
  feedback?: string | null;
  /** ISO date when the evaluation was last saved */
  gradedAt?: string | null;
}

export interface SaveEvaluationInput {
  studentId: string;
  courseId: string;
  score: number;
  feedback?: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
}
