'use client';

import { useState } from 'react';
import { teacherService } from '@/services/teacherService';
import { CheckCircle, Loader2, User } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentEvaluationRow {
  studentId: string;
  name: string;
  email: string;
  masteryScore?: number | null;
  assignmentScore?: number | null;
  evaluationScore?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

interface Props {
  courseId: string;
  students: StudentEvaluationRow[];
  onRefresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}

// ─── Row Component ────────────────────────────────────────────────────────────

function EvaluationRow({
  student,
  courseId,
  onSaved,
}: {
  student: StudentEvaluationRow;
  courseId: string;
  onSaved: () => void;
}) {
  const [score, setScore] = useState<string>(
    student.evaluationScore !== null && student.evaluationScore !== undefined
      ? String(student.evaluationScore)
      : ''
  );
  const [feedback, setFeedback] = useState<string>(student.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setError('Score must be between 0 and 100');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await teacherService.saveEvaluation({
        studentId: student.studentId,
        courseId,
        score: numScore,
        feedback,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      {/* Student info */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
        </div>
      </td>

      {/* Mastery */}
      <td className="py-4 px-4 text-center">
        <span className={`text-sm font-semibold ${scoreColor(student.masteryScore)}`}>
          {student.masteryScore !== null && student.masteryScore !== undefined
            ? `${student.masteryScore}%`
            : '—'}
        </span>
      </td>

      {/* Assignment score */}
      <td className="py-4 px-4 text-center">
        <span className={`text-sm font-semibold ${scoreColor(student.assignmentScore)}`}>
          {student.assignmentScore !== null && student.assignmentScore !== undefined
            ? `${student.assignmentScore}`
            : '—'}
        </span>
      </td>

      {/* Evaluation score (current saved value) */}
      <td className="py-4 px-4 text-center">
        <span className={`text-sm font-semibold ${scoreColor(student.evaluationScore)}`}>
          {student.evaluationScore !== null && student.evaluationScore !== undefined
            ? `${student.evaluationScore}`
            : '—'}
        </span>
      </td>

      {/* Score input */}
      <td className="py-4 px-4">
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="0–100"
          className="w-20 px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </td>

      {/* Feedback input */}
      <td className="py-4 px-4">
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback…"
          className="w-full min-w-[160px] px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </td>

      {/* Submit */}
      <td className="py-4 px-4">
        <button
          onClick={handleSubmit}
          disabled={saving || saved}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            'Save'
          )}
          {saved && 'Saved'}
        </button>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EvaluationTable({ courseId, students, onRefresh }: Props) {
  if (students.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-3">
        <div className="p-4 rounded-full bg-muted/60">
          <User className="w-7 h-7 text-muted-foreground opacity-50" />
        </div>
        <p className="text-muted-foreground text-sm">No students enrolled in this course yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border/60">
            <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Student
            </th>
            <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mastery
            </th>
            <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assignment
            </th>
            <th className="py-3 px-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Eval Score
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              New Score
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Feedback
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border/40">
          {students.map((student) => (
            <EvaluationRow
              key={student.studentId}
              student={student}
              courseId={courseId}
              onSaved={onRefresh}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
