'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  assessmentService,
  AssignmentWithQuestions,
  AssignmentQuestion,
  Attempt,
  AnswerResult,
} from '@/services/assessmentService';
import { masteryService } from '@/services/masteryService';
import { api } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Flag, Loader2, Send, RotateCcw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'quiz' | 'confirming' | 'submitting' | 'results';

interface LocalAnswer {
  questionId: string;
  selectedOption: string;
  timeTaken: number;
  answeredAt: number;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function getOptionText(q: AssignmentQuestion, key: string): string {
  const map: Record<string, string> = {
    A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD,
  };
  return map[key] ?? '';
}

// ─────────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────────

function useTimer(startSeconds: number) {
  const [remaining, setRemaining] = useState(startSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const urgentPct = (remaining / startSeconds) * 100;

  return { formatted, expired, urgentPct, remaining };
}

// ─────────────────────────────────────────────────────────────────
// Mastery update pipeline (critical learning integration)
// ─────────────────────────────────────────────────────────────────

async function triggerMasteryUpdate(results: AnswerResult[]) {
  try {
    const incorrectTopicIds = results
      .filter(r => !r.isCorrect && r.topicId)
      .map(r => r.topicId!)
      .filter((v, i, a) => a.indexOf(v) === i);

    if (incorrectTopicIds.length === 0) return;

    // Trigger mastery update for each weak topic
    await Promise.allSettled(
      incorrectTopicIds.map(topicId =>
        (api as any).post('/student/mastery/update', {
          topicId,
          source: 'assessment_quiz',
          correct: false,
        }).catch(() => {})
      )
    );

    // Also update via analytics endpoint
    await (api as any).post('/analytics/log', {
      actionType: 'quiz_completed',
      metadata: {
        weakTopics: incorrectTopicIds,
        totalQuestions: results.length,
        correctCount: results.filter(r => r.isCorrect).length,
      },
    }).catch(() => {});
  } catch {
    // Non-blocking — best effort
  }
}

// ─────────────────────────────────────────────────────────────────
// Results Screen
// ─────────────────────────────────────────────────────────────────

function ResultsScreen({ attempt, questions, answers, subjectId }: {
  attempt: Attempt;
  questions: AssignmentQuestion[];
  answers: AnswerResult[];
  subjectId: string;
}) {
  const router = useRouter();
  const correct = answers.filter(a => a.isCorrect).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n += 2;
      setDisplayed(Math.min(n, pct));
      if (n >= pct) clearInterval(iv);
    }, 20);
    return () => clearInterval(iv);
  }, [pct]);

  const scoreColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
  const wrongTopics = answers.filter(a => !a.isCorrect);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score hero */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Quiz Complete</p>
        <p className={cn('font-black tabular-nums text-7xl', scoreColor)}>
          {displayed}<span className="text-3xl text-muted-foreground">%</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">{correct} / {total} correct</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="h-4 w-4" /> {correct} correct
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <XCircle className="h-4 w-4" /> {total - correct} wrong
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {pct === 100 ? '🎉 Perfect score!' : pct >= 80 ? '🌟 Excellent work!' : pct >= 60 ? '📚 Good effort. Review weak areas.' : '💡 Keep practising — adaptive quiz ready for you.'}
        </p>
      </div>

      {/* Question breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">Question Review</h2>
        {questions.map((q, idx) => {
          const ans = answers.find(a => a.questionId === q.id);
          const isCorrect = ans?.isCorrect ?? false;
          return (
            <div
              key={q.id}
              className={cn(
                'rounded-lg border p-4 space-y-2',
                isCorrect ? 'border-green-200/60 bg-green-50/30 dark:bg-green-950/10' : 'border-red-200/60 bg-red-50/30 dark:bg-red-950/10'
              )}
            >
              <div className="flex items-start gap-2">
                {isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                <p className="text-sm font-medium flex-1">{q.questionText}</p>
                <Badge variant="outline" className="text-[10px] shrink-0">{idx + 1}/{questions.length}</Badge>
              </div>
              <div className="pl-6 space-y-1 text-xs">
                <p>
                  <span className="text-muted-foreground">Your answer: </span>
                  <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {ans?.selectedOption ?? '—'}: {ans?.selectedOption ? getOptionText(q, ans.selectedOption) : '—'}
                  </span>
                </p>
                {!isCorrect && ans?.correctOption && (
                  <p>
                    <span className="text-muted-foreground">Correct: </span>
                    <span className="text-green-600 font-semibold">
                      {ans.correctOption}: {getOptionText(q, ans.correctOption)}
                    </span>
                  </p>
                )}
                {!isCorrect && (q.explanation ?? ans?.explanation) && (
                  <div className="mt-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 px-3 py-2">
                    <p className="text-amber-700 dark:text-amber-300">
                      <strong>Explanation:</strong> {q.explanation ?? ans?.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weak topic notice */}
      {wrongTopics.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Weak Topics Detected</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These topics have been flagged in your mastery profile. Visit Adaptive Resources to strengthen them.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => router.push('/student/courses')}>
              View Adaptive Resources
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/student/practice')}>
              Practice Now
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.push(`/student/assessment/quizzes/${subjectId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Quizzes
        </Button>
        <Button className="flex-1" onClick={() => router.push('/student/assessment/results')}>
          View Full Results <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Quiz Attempt Page
// ─────────────────────────────────────────────────────────────────

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const subjectId = params.subjectId as string;
  const attemptId = params.attemptId as string;
  const quizId = searchParams.get('quizId') ?? '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Map<string, LocalAnswer>>(new Map());
  const [answerResults, setAnswerResults] = useState<AnswerResult[]>([]);
  const [finalAttempt, setFinalAttempt] = useState<Attempt | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const timerDuration = 30 * 60; // 30 min default

  const { formatted: timerFormatted, expired, urgentPct } = useTimer(timerDuration);

  // Load quiz
  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await assessmentService.getAssignment(quizId) as any;
        const quiz = res?.data ?? res;
        const qs = quiz?.questions ?? [];
        if (!cancelled) {
          setQuestions(Array.isArray(qs) ? qs : []);
          setPhase('quiz');
          setQuestionStartTime(Date.now());
        }
      } catch {
        if (!cancelled) setPhase('quiz');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [quizId]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (expired && phase === 'quiz') handleSubmit();
  }, [expired]);

  function selectOption(optionKey: string) {
    const q = questions[currentIdx];
    if (!q) return;
    setLocalAnswers(prev => {
      const next = new Map(prev);
      next.set(q.id, {
        questionId: q.id,
        selectedOption: optionKey,
        timeTaken: Math.floor((Date.now() - questionStartTime) / 1000),
        answeredAt: Date.now(),
      });
      return next;
    });
  }

  function goTo(idx: number) {
    setCurrentIdx(idx);
    setQuestionStartTime(Date.now());
  }

  function toggleFlag(qId: string) {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  }

  async function handleSubmit() {
    if (phase !== 'quiz' && phase !== 'confirming') return;
    setPhase('submitting');

    try {
      const results: AnswerResult[] = [];

      // Submit all answers
      const answersToSubmit = Array.from(localAnswers.values());
      for (const ans of answersToSubmit) {
        try {
          const res = await assessmentService.submitAnswer(attemptId, {
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
            timeTaken: ans.timeTaken,
          }) as any;
          const result = res?.data ?? res;
          results.push({
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
            isCorrect: result?.isCorrect ?? result?.correct ?? false,
            correctOption: result?.correctOption,
            explanation: result?.explanation,
            topicId: result?.topicId,
            topicName: result?.topicName,
          });
        } catch {
          results.push({
            questionId: ans.questionId,
            selectedOption: ans.selectedOption,
            isCorrect: false,
          });
        }
      }

      // Submit the attempt
      const attemptRes = await assessmentService.submitAttempt(attemptId) as any;
      const finalAtt = attemptRes?.data ?? attemptRes;

      setAnswerResults(results);
      setFinalAttempt(finalAtt);

      // CRITICAL: Trigger mastery update pipeline for wrong answers
      await triggerMasteryUpdate(results);

      setPhase('results');
    } catch (e) {
      console.error('[QuizSubmit]', e);
      setPhase('results');
    }
  }

  const q = questions[currentIdx];
  const selectedOption = q ? localAnswers.get(q.id)?.selectedOption ?? null : null;
  const answeredCount = localAnswers.size;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  const unanswered = totalCount - answeredCount;

  // ── Results ──
  if (phase === 'results') {
    return (
      <DashboardLayout requiredRole="student">
        <ResultsScreen
          attempt={finalAttempt ?? { id: attemptId, assignmentId: quizId, userId: '', startedAt: '' }}
          questions={questions}
          answers={answerResults}
          subjectId={subjectId}
        />
      </DashboardLayout>
    );
  }

  // ── Loading ──
  if (phase === 'loading') {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading quiz…</p>
        </div>
      </DashboardLayout>
    );
  }

  // ── Submitting ──
  if (phase === 'submitting') {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Submitting and updating your mastery profile…</p>
        </div>
      </DashboardLayout>
    );
  }

  // ── Confirm dialog overlay ──
  if (phase === 'confirming') {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="max-w-sm w-full rounded-2xl border border-border bg-card p-8 text-center shadow-lg space-y-4">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold">Submit Quiz?</h2>
            <p className="text-sm text-muted-foreground">
              You have answered <strong>{answeredCount}</strong> of <strong>{totalCount}</strong> questions.
              {unanswered > 0 && <span className="text-amber-600"> {unanswered} unanswered.</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              Once submitted, results will be recorded and your mastery profile will be updated.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setPhase('quiz')}>Go Back</Button>
              <Button onClick={handleSubmit}>
                <Send className="mr-2 h-4 w-4" /> Submit
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Quiz ──
  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono font-semibold',
              urgentPct < 20 ? 'border-red-300 bg-red-50 text-red-700' : 'border-border bg-card text-foreground'
            )}>
              <Clock className={cn('h-4 w-4', urgentPct < 20 && 'animate-pulse text-red-600')} />
              {timerFormatted}
            </div>
            <span className="text-xs text-muted-foreground">
              {answeredCount}/{totalCount} answered
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPhase('confirming')}
            className="border-primary/40 text-primary hover:bg-primary/5"
          >
            <Send className="mr-2 h-4 w-4" /> Submit Quiz
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progressPct} className="h-1.5 mb-5 [&>*]:bg-primary/70" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
          {/* Question panel */}
          <div className="space-y-5">
            {q ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <Badge variant="outline" className="text-xs">Q {currentIdx + 1} / {totalCount}</Badge>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={cn(
                      'flex items-center gap-1 text-xs rounded px-2 py-1 border transition-colors',
                      flagged.has(q.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {flagged.has(q.id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <p className="text-base font-medium leading-relaxed mb-6">{q.questionText}</p>

                <div className="space-y-2.5">
                  {OPTION_KEYS.map(key => {
                    const text = getOptionText(q, key);
                    if (!text) return null;
                    const isSelected = selectedOption === key;
                    return (
                      <button
                        key={key}
                        onClick={() => selectOption(key)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <span className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
                        )}>
                          {key}
                        </span>
                        <span className="flex-1">{text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" size="sm" onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => goTo(Math.min(totalCount - 1, currentIdx + 1))} disabled={currentIdx === totalCount - 1}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                No questions loaded. The quiz may have no questions yet.
              </div>
            )}
          </div>

          {/* Question navigator */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Questions</p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalCount }).map((_, i) => {
                const qId = questions[i]?.id;
                const answered = qId ? localAnswers.has(qId) : false;
                const isFlagged = qId ? flagged.has(qId) : false;
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={cn(
                      'flex h-8 w-full items-center justify-center rounded text-xs font-semibold border transition-colors',
                      isCurrent ? 'border-primary bg-primary text-primary-foreground' :
                      isFlagged ? 'border-amber-400 bg-amber-50 text-amber-700' :
                      answered ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30' :
                      'border-border bg-card text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-green-300 bg-green-50" /><span className="text-muted-foreground">Answered</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-amber-400 bg-amber-50" /><span className="text-muted-foreground">Flagged</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-border bg-card" /><span className="text-muted-foreground">Not answered</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
