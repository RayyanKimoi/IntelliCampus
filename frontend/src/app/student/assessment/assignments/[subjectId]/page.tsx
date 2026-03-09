'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment, Submission } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, CheckCircle2, Clock, FileText,
  Code2, Upload, ArrowRight, ClipboardList, Award, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from '@/lib/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────

function getDueInfo(dueDate: string) {
  const d = parseISO(dueDate);
  if (isPast(d)) return { text: 'Overdue', color: 'text-red-600 bg-red-50 border-red-200' };
  const diff = d.getTime() - Date.now();
  if (diff < 86_400_000) return { text: 'Due today!', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { text: `Due ${formatDistanceToNow(d, { addSuffix: true })}`, color: 'text-muted-foreground bg-muted border-border' };
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function SubmissionTypePills({ raw }: { raw: unknown }) {
  const types: string[] = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'object' && raw !== null
    ? Object.entries(raw as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k)
    : [];
  if (types.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      {types.includes('code') && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
          <Code2 className="h-3 w-3" /> Code
        </span>
      )}
      {types.includes('text') && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
          <FileText className="h-3 w-3" /> Text
        </span>
      )}
      {types.includes('file') && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
          <Upload className="h-3 w-3" /> File
        </span>
      )}
    </div>
  );
}

// ─── Assignment Card ───────────────────────────────────────────────

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const { text: dueText, color: dueColor } = getDueInfo(assignment.dueDate);
  const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-5 p-5">
        {/* Left icon */}
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
            isSubmitted
              ? 'bg-green-100 dark:bg-green-900/40'
              : 'bg-primary/10 group-hover:bg-primary/20',
          )}
        >
          {isSubmitted ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <FileText className="h-6 w-6 text-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base leading-tight truncate">{assignment.title}</h3>
            {isSubmitted && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] shrink-0 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Submitted
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {assignment.description ?? assignment.instructions ?? 'No description provided.'}
          </p>
          <SubmissionTypePills raw={(assignment as any).submissionTypes} />
        </div>

        {/* Right: due + button */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <Badge variant="outline" className={cn('text-xs border', dueColor)}>
            <Clock className="h-3 w-3 mr-1" />{dueText}
          </Badge>
          {assignment.totalPoints && (
            <span className="text-xs text-muted-foreground">{assignment.totalPoints} pts</span>
          )}
          {isSubmitted ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/student/assignments/${assignment.id}/workspace`)}
              className="gap-1.5"
            >
              View Submission <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => router.push(`/student/assignments/${assignment.id}/workspace`)}
              className="gap-1.5"
            >
              Start Now <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Completed Submission Card ─────────────────────────────────────

function CompletedCard({ submission }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false);
  const pct = submission.totalPoints
    ? Math.round(((submission.score ?? 0) / submission.totalPoints) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-5 p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            submission.status === 'graded' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-muted',
          )}
        >
          {submission.status === 'graded' ? (
            <Award className="h-6 w-6 text-green-600" />
          ) : (
            <Clock className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{submission.assignmentTitle}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submitted {formatDistanceToNow(parseISO(submission.submittedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {pct !== null ? (
            <div className="text-right">
              <span className={cn('text-lg font-bold', scoreColor(pct))}>{pct}%</span>
              <p className="text-[10px] text-muted-foreground">
                {submission.score ?? 0}/{submission.totalPoints} pts
              </p>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">Pending Review</Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
              {pct !== null && (
                <div
                  className={cn(
                    'rounded-xl p-4 flex items-center gap-4 border',
                    pct >= 80
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/60'
                      : pct >= 60
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60'
                      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/60',
                  )}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-current">
                    <span className={cn('text-xl font-black', scoreColor(pct))}>{pct}%</span>
                  </div>
                  <div>
                    <p className={cn('font-bold text-lg', scoreColor(pct))}>
                      {submission.score ?? 0} / {submission.totalPoints ?? 100} points
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort.' : 'Needs improvement.'}
                    </p>
                  </div>
                </div>
              )}
              {submission.teacherComment && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                    Teacher Feedback
                  </p>
                  <p className="text-sm leading-relaxed">{submission.teacherComment}</p>
                </div>
              )}
              {submission.textContent && (
                <div className="rounded-xl bg-muted/40 border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Your Submission
                  </p>
                  <p className="text-sm whitespace-pre-wrap line-clamp-6 font-mono">
                    {submission.textContent}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

type AssignmentTab = 'active' | 'completed';

export default function SubjectAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [tab, setTab] = useState<AssignmentTab>('active');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [assignmentsRes, submissionsRes] = await Promise.allSettled([
          assessmentService.getAssignments() as Promise<any>,
          assessmentService.getSubmissions() as Promise<any>,
        ]);
        if (cancelled) return;

        const allAssignments: Assignment[] = assignmentsRes.status === 'fulfilled'
          ? (assignmentsRes.value?.data ?? assignmentsRes.value ?? [])
          : [];

        const allSubmissions: Submission[] = submissionsRes.status === 'fulfilled'
          ? (submissionsRes.value?.data ?? submissionsRes.value ?? [])
          : [];

        const filtered = Array.isArray(allAssignments)
          ? allAssignments.filter(a => a.subjectId === subjectId || a.courseId === subjectId)
          : [];

        const filteredIds = new Set(filtered.map(a => a.id));

        if (!cancelled) {
          setAssignments(filtered);
          setSubjectName(filtered[0]?.subjectName ?? filtered[0]?.courseName ?? 'Assignments');
          setSubmissions(
            Array.isArray(allSubmissions)
              ? allSubmissions.filter(s => filteredIds.has(s.assignmentId))
              : [],
          );
        }
      } catch (e) {
        console.error('[SubjectAssignments]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subjectId]);

  const active = assignments.filter(a => a.status === 'pending' || a.status === 'late');

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Assignments
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{subjectName || 'Assignments'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active &middot; {submissions.length} completed
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 border-b border-border">
          {(['active', 'completed'] as AssignmentTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
              {t === 'active' && active.length > 0 && (
                <span className="ml-2 bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {active.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : tab === 'active' ? (
          active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1">No active assignments right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(a => <AssignmentCard key={a.id} assignment={a} />)}
            </div>
          )
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg">No completed assignments yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Submitted assignments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => <CompletedCard key={s.id} submission={s} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
