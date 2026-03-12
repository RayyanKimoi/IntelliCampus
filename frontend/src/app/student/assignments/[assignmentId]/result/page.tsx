'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubmissionPreview } from '@/components/evaluation/SubmissionPreview';
import { api } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, CheckCircle2, Clock, Bot, User,
  ThumbsUp, ThumbsDown, AlertTriangle, BookOpen, Sparkles,
} from 'lucide-react';

interface AIEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  feedback: string;
}

// ─── Rubric Bar (Read-Only) ──────────────────────────────────────────
function RubricBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const safeScore = isNaN(score) ? 0 : score;
  const pct = (safeScore / max) * 100;
  const color =
    pct >= 80 ? 'bg-emerald-500 dark:bg-emerald-400' :
    pct >= 60 ? 'bg-amber-500 dark:bg-amber-400' :
                'bg-red-500 dark:bg-red-400';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-semibold text-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{safeScore}<span className="text-muted-foreground font-medium">/{max}</span></span>
      </div>
      <div className="h-2 w-full bg-muted dark:bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-muted/70 rounded-lg" />
      <div className="h-10 w-72 bg-muted/80 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="h-64 bg-muted/50 rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-20 bg-muted/50 rounded-2xl" />
          <div className="h-48 bg-muted/50 rounded-2xl" />
          <div className="h-32 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

const RUBRIC_LABELS: Record<string, string> = {
  correctness: 'Correctness',
  codeQuality: 'Code Quality',
  problemSolving: 'Problem Solving',
  efficiency: 'Efficiency',
  documentation: 'Documentation',
};

export default function AssignmentResultPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const router = useRouter();
  const { assignmentId } = use(params);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; data: any; error?: string }>(`/student/assignments/${assignmentId}/result`);
        if (!cancelled) {
          if (data.success) {
            setResult(data.data);
          } else {
            setError(data.error || 'Failed to load result');
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load result');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [assignmentId]);

  const aiEval: AIEvaluation | null = result?.evaluation?.aiEvaluation || null;
  const rubricScores: Record<string, number> = result?.evaluation?.rubricScores || {};
  const hasRubric = Object.keys(rubricScores).length > 0;

  const statusBadge = () => {
    const status = result?.evaluation?.status;
    if (status === 'teacher_verified') {
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/20 text-xs font-bold gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> Teacher Verified
        </Badge>
      );
    }
    if (status === 'ai_graded') {
      return (
        <Badge className="bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200/70 dark:border-violet-500/20 text-xs font-bold gap-1.5">
          <Bot className="w-3 h-3" /> AI Graded
        </Badge>
      );
    }
    return (
      <Badge className="bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/70 dark:border-sky-500/20 text-xs font-bold gap-1.5">
        <Clock className="w-3 h-3" /> Submitted
      </Badge>
    );
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-7">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.push('/student/assessment/assignments')}
          className="group flex items-center w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="p-1.5 rounded-full bg-muted/60 group-hover:bg-muted mr-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Assignments
        </motion.button>

        {loading ? (
          <ResultSkeleton />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 flex flex-col items-center bg-muted/20 dark:bg-muted/10 border border-border/50 rounded-2xl"
          >
            <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Could not load result</h3>
            <p className="text-muted-foreground mt-1 text-sm max-w-xs">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/student/assessment/assignments')}>
              Go Back
            </Button>
          </motion.div>
        ) : result && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-[11px] font-semibold tracking-widest uppercase w-fit mb-2.5 border border-primary/20">
                  Assignment Result
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {result.assignment.title}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {result.assignment.courseName && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" /> {result.assignment.courseName}
                    </span>
                  )}
                  {result.assignment.chapterName && (
                    <span className="text-sm text-muted-foreground">•  {result.assignment.chapterName}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge()}
              </div>
            </motion.div>

            {/* Main Content: 70/30 split */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Submission Preview (70%) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-3 space-y-4"
              >
                <div className="inline-flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold text-[11px] tracking-widest uppercase bg-sky-50 dark:bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-200/50 dark:border-sky-500/20">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                  Your Submission
                </div>
                <SubmissionPreview
                  answers={result.submission.answers}
                  fileUrl={result.submission.submissionFileUrl}
                />
              </motion.div>

              {/* Right: Evaluation Panel (30%) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="lg:col-span-2 space-y-5"
              >
                {/* Score Card */}
                {result.evaluation.score !== undefined && result.evaluation.score !== null && (
                  <div className="rounded-2xl border border-border/50 bg-card dark:bg-muted/10 p-5 text-center space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Score</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={cn(
                        'text-5xl font-black tracking-tight',
                        result.evaluation.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                        result.evaluation.score >= 60 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      )}>
                        {Math.round(result.evaluation.score)}
                      </span>
                      <span className="text-xl text-muted-foreground font-medium">/100</span>
                    </div>
                    {result.evaluation.gradedBy && (
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <User className="w-3 h-3" /> Graded by {result.evaluation.gradedBy}
                      </p>
                    )}
                  </div>
                )}

                {/* Rubric Breakdown */}
                {hasRubric && (
                  <div className="rounded-2xl border border-border/50 bg-card dark:bg-muted/10 p-5 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rubric Breakdown</p>
                    <div className="space-y-3">
                      {Object.entries(rubricScores).map(([key, value]) => (
                        <RubricBar
                          key={key}
                          label={RUBRIC_LABELS[key] || key}
                          score={typeof value === 'number' ? value : 0}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Feedback */}
                {result.evaluation.teacherComment && (
                  <div className="rounded-2xl border border-border/50 bg-card dark:bg-muted/10 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
                      <User className="w-3.5 h-3.5" />
                      Teacher Feedback
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {result.evaluation.teacherComment}
                    </p>
                  </div>
                )}

                {/* AI Evaluation Details */}
                {aiEval && (
                  <div className="rounded-2xl border border-violet-200/50 dark:border-violet-500/20 bg-violet-50/30 dark:bg-violet-500/5 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      AI Insights
                    </div>

                    {/* AI Feedback */}
                    {aiEval.feedback && (
                      <p className="text-sm text-foreground leading-relaxed">
                        {aiEval.feedback}
                      </p>
                    )}

                    {/* Strengths */}
                    {aiEval.strengths?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
                          <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                        </div>
                        <ul className="space-y-1.5">
                          {aiEval.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {aiEval.weaknesses?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-widest">
                          <ThumbsDown className="w-3.5 h-3.5" /> Areas to Improve
                        </div>
                        <ul className="space-y-1.5">
                          {aiEval.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Concepts */}
                    {aiEval.missingConcepts?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[11px] font-bold uppercase tracking-widest">
                          <BookOpen className="w-3.5 h-3.5" /> Missing Concepts
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {aiEval.missingConcepts.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 rounded-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission info */}
                <div className="rounded-2xl border border-border/50 bg-card dark:bg-muted/10 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Submitted</span>
                    <span className="font-medium text-foreground">
                      {result.submission.submittedAt
                        ? new Date(result.submission.submittedAt).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  {result.evaluation.gradedAt && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Graded</span>
                      <span className="font-medium text-foreground">
                        {new Date(result.evaluation.gradedAt).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
