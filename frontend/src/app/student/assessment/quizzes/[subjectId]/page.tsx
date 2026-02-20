'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { MOCK_SUBJECT_QUIZZES } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, FileQuestion, Clock, CheckCircle2, Lock, Play,
  AlertTriangle, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import { format, parseISO } from '@/lib/dateUtils';

type QuizSection = 'prerequisite' | 'topic';

export default function SubjectQuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [quizzes, setQuizzes] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await assessmentService.getQuizzes() as any;
        if (cancelled) return;
        const all: Assignment[] = res?.data ?? res ?? [];
        const filtered = Array.isArray(all)
          ? all.filter(q => q.subjectId === subjectId || q.courseId === subjectId)
          : [];
        const toUse = filtered.length > 0 ? filtered : (MOCK_SUBJECT_QUIZZES[subjectId] ?? []);
        setQuizzes(toUse);
        if (toUse.length > 0) setSubjectName(toUse[0].subjectName ?? toUse[0].courseName ?? 'Quizzes');
      } catch (e) {
        console.error('[SubjectQuizzes]', e);
        const fallback = MOCK_SUBJECT_QUIZZES[subjectId] ?? [];
        if (!cancelled) {
          setQuizzes(fallback);
          if (fallback.length > 0) setSubjectName(fallback[0].subjectName ?? fallback[0].courseName ?? 'Quizzes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subjectId]);

  async function startQuiz(quizId: string) {
    setStartingId(quizId);
    try {
      const res = await assessmentService.startAttempt(quizId) as any;
      const attempt = res?.data ?? res;
      if (attempt?.id) {
        router.push(`/student/assessment/quizzes/${subjectId}/attempt/${attempt.id}?quizId=${quizId}`);
      } else {
        // Attempt created but no id — fall back to practice
        router.push('/student/practice');
      }
    } catch (e) {
      console.error('[StartQuiz]', e);
      // API unavailable — redirect to the practice page for the same topic
      router.push('/student/practice');
    } finally {
      setStartingId(null);
    }
  }

  const prerequisiteQuizzes = quizzes.filter(q => q.type === 'prerequisite');
  const topicQuizzes = quizzes.filter(q => q.type !== 'prerequisite');

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/student/assessment/quizzes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Quizzes
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{subjectName || 'Subject Quizzes'}</h1>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-24" />)}</div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold">No quizzes available</h3>
            <p className="text-sm text-muted-foreground mt-1">Your teacher hasn't added quizzes yet.</p>
          </div>
        ) : (
          <>
            {/* Prerequisite Quizzes */}
            {prerequisiteQuizzes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/40">
                    <Lock className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <h2 className="font-semibold text-base">Prerequisite Quiz</h2>
                  <p className="text-xs text-muted-foreground">Complete before accessing topic quizzes</p>
                </div>
                {prerequisiteQuizzes.map(q => (
                  <QuizCard key={q.id} quiz={q} onStart={() => startQuiz(q.id)} loading={startingId === q.id} />
                ))}
              </div>
            )}

            {/* Topic Quizzes */}
            {topicQuizzes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/40">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-base">Topic-wise Quizzes</h2>
                </div>
                {topicQuizzes.map(q => (
                  <QuizCard key={q.id} quiz={q} onStart={() => startQuiz(q.id)} loading={startingId === q.id} />
                ))}
              </div>
            )}

            {/* Render all if no type differentiation */}
            {prerequisiteQuizzes.length === 0 && topicQuizzes.length === 0 && (
              <div className="space-y-3">
                {quizzes.map(q => (
                  <QuizCard key={q.id} quiz={q} onStart={() => startQuiz(q.id)} loading={startingId === q.id} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function QuizCard({ quiz, onStart, loading }: {
  quiz: Assignment;
  onStart: () => void;
  loading: boolean;
}) {
  const isComplete = quiz.status === 'graded' || quiz.status === 'submitted';
  const pct = quiz.totalPoints ? Math.round(((quiz.score ?? 0) / quiz.totalPoints) * 100) : null;

  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 flex items-center gap-4 transition-all',
      isComplete ? 'border-green-200/60 bg-green-50/30 dark:bg-green-950/10' : 'border-border hover:border-primary/40'
    )}>
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
        isComplete ? 'bg-green-100 dark:bg-green-900/40' : 'bg-primary/10'
      )}>
        {isComplete
          ? <CheckCircle2 className="h-5 w-5 text-green-600" />
          : <FileQuestion className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{quiz.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {quiz.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due {format(parseISO(quiz.dueDate), 'MMM d, yyyy')}
            </span>
          )}
          {quiz.totalPoints && <span>{quiz.totalPoints} pts</span>}
          {isComplete && pct !== null && (
            <span className={cn('font-semibold', pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600')}>
              Score: {pct}%
            </span>
          )}
        </div>
      </div>
      {isComplete ? (
        <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">Completed</Badge>
      ) : (
        <Button onClick={onStart} disabled={loading} size="sm" className="shrink-0 px-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 mr-1.5" />Start</>}
        </Button>
      )}
    </div>
  );
}
