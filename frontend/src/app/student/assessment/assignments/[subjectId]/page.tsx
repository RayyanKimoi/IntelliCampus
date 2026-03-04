'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment, Submission, AssignmentComment } from '@/services/assessmentService';
import { MOCK_ASSIGNMENTS } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, CheckCircle2, Clock, AlertTriangle, Paperclip,
  Send, MessageSquare, ChevronDown, ChevronUp, Upload, FileText,
  Star, Loader2, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO, format } from '@/lib/dateUtils';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function countdown(dueDate: string) {
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

// ─────────────────────────────────────────────────────────────────
// Active Assignment Card (Google-Classroom style)
// ─────────────────────────────────────────────────────────────────

function ActiveAssignmentCard({ assignment, onSubmit }: {
  assignment: Assignment;
  onSubmit: (assignmentId: string, text: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(assignment.status === 'submitted');
  const [comments, setComments] = useState<AssignmentComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const { text: dueText, color: dueColor } = countdown(assignment.dueDate);

  async function loadComments() {
    if (commentsLoaded) return;
    try {
      const res = await assessmentService.getComments(assignment.id) as any;
      const data = res?.data ?? res ?? [];
      setComments(Array.isArray(data) ? data : []);
      setCommentsLoaded(true);
    } catch {
      setCommentsLoaded(true);
    }
  }

  async function handleExpand() {
    setExpanded(v => !v);
    if (!expanded) loadComments();
  }

  async function handleSubmit() {
    if (!textContent.trim() && !submitted) return;
    setSubmitting(true);
    try {
      await onSubmit(assignment.id, textContent);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await assessmentService.postComment(assignment.id, newComment.trim()) as any;
      const c = res?.data ?? res;
      if (c?.id) setComments(prev => [...prev, c]);
      else {
        // optimistic
        setComments(prev => [...prev, {
          id: Date.now().toString(),
          content: newComment.trim(),
          authorId: '',
          authorName: 'You',
          authorRole: 'student',
          createdAt: new Date().toISOString(),
        }]);
      }
      setNewComment('');
    } catch {
      // optimistic fallback
      setComments(prev => [...prev, {
        id: Date.now().toString(),
        content: newComment.trim(),
        authorId: '',
        authorName: 'You',
        authorRole: 'student',
        createdAt: new Date().toISOString(),
      }]);
      setNewComment('');
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={handleExpand}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-base">{assignment.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn('text-xs border', dueColor)}>
                <Clock className="h-3 w-3 mr-1" />{dueText}
              </Badge>
              {submitted && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Submitted
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {assignment.description ?? assignment.instructions ?? 'No description.'}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
          {/* Instructions */}
          {(assignment.instructions ?? assignment.description) && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Instructions</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {assignment.instructions ?? assignment.description}
              </p>
            </div>
          )}

          {/* Due info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Due: <strong>{format(parseISO(assignment.dueDate), 'PPpp')}</strong></span>
            {assignment.totalPoints && <span className="ml-auto">Total: <strong>{assignment.totalPoints} pts</strong></span>}
          </div>

          {/* Attachment from teacher */}
          {assignment.attachmentUrl && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate"
              >
                Teacher Attachment
              </a>
            </div>
          )}

          {/* Submission area */}
          {!submitted ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Answer</p>
              <Textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Type your answer or paste content here…"
                className="min-h-[120px] resize-y"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !textContent.trim()}
                  size="sm"
                  className="px-5"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Assignment
                </Button>
                <p className="text-xs text-muted-foreground">Answer will be saved and locked on submit.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">Assignment submitted!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Waiting for teacher review.</p>
              </div>
            </div>
          )}

          {/* Comment section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Class Comments
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No comments yet.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className={cn(
                    'flex gap-2 rounded-lg p-3',
                    c.authorRole === 'teacher' ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50' : 'bg-muted/40 border border-border'
                  )}>
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      c.authorRole === 'teacher' ? 'bg-blue-200 text-blue-800' : 'bg-primary/20 text-primary'
                    )}>
                      {c.authorName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{c.authorName}</span>
                        {c.authorRole === 'teacher' && <Badge className="text-[10px] py-0 h-4 bg-blue-100 text-blue-700 border-blue-200">Teacher</Badge>}
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="min-h-[60px] resize-none flex-1 text-sm"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleComment(); }}
              />
              <Button
                onClick={handleComment}
                disabled={postingComment || !newComment.trim()}
                size="sm"
                variant="secondary"
                className="self-end"
              >
                {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Completed Assignment Card
// ─────────────────────────────────────────────────────────────────

function CompletedAssignmentCard({ submission }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false);
  const pct = submission.totalPoints ? Math.round(((submission.score ?? 0) / submission.totalPoints) * 100) : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          submission.status === 'graded' ? 'bg-green-100' : 'bg-muted'
        )}>
          {submission.status === 'graded'
            ? <CheckCircle2 className="h-5 w-5 text-green-600" />
            : <Clock className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{submission.assignmentTitle}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submitted {formatDistanceToNow(parseISO(submission.submittedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pct !== null ? (
            <span className={cn('text-lg font-bold', scoreColor(pct))}>{pct}%</span>
          ) : (
            <Badge variant="outline" className="text-xs">{submission.status === 'graded' ? 'Graded' : 'Pending'}</Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Score break */}
          {pct !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
                <span className={cn('font-bold', scoreColor(pct))}>{submission.score} / {submission.totalPoints} pts ({pct}%)</span>
              </div>
              <Progress value={pct} className={cn('h-2', pct >= 80 ? '[&>*]:bg-green-500' : pct >= 60 ? '[&>*]:bg-amber-500' : '[&>*]:bg-red-500')} />
            </div>
          )}

          {/* Teacher comment */}
          {submission.teacherComment && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Teacher Feedback</p>
              <p className="text-sm leading-relaxed">{submission.teacherComment}</p>
            </div>
          )}

          {/* Submission preview */}
          {submission.textContent && (
            <div className="rounded-lg bg-muted/40 border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Submission</p>
              <p className="text-sm whitespace-pre-wrap line-clamp-6">{submission.textContent}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

type AssignmentTab = 'active' | 'completed';

export default function SubjectAssignmentsPage() {
  const params = useParams();
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

        // Mock fallback when API returns no data for this subject
        const assignmentsToUse: any[] = filtered.length > 0
          ? filtered
          : MOCK_ASSIGNMENTS.filter((a: any) => a.courseId === subjectId || a.subjectId === subjectId);

        const filteredSubs = Array.isArray(allSubmissions)
          ? allSubmissions.filter(s => assignmentsToUse.some(a => a.id === s.assignmentId))
          : [];

        if (!cancelled) {
          setAssignments(assignmentsToUse as any);
          setSubmissions(filteredSubs);
          if (assignmentsToUse.length > 0) {
            const a = assignmentsToUse[0] as any;
            setSubjectName(a.subjectName ?? a.courseName ?? 'Assignments');
          }
        }
      } catch (e) {
        console.error('[SubjectAssignments]', e);
        if (!cancelled) {
          const fallback: any[] = MOCK_ASSIGNMENTS.filter((a: any) => a.courseId === subjectId || a.subjectId === subjectId);
          setAssignments(fallback);
          if (fallback.length > 0) setSubjectName(fallback[0].courseName ?? 'Assignments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subjectId]);

  const active = assignments.filter(a => a.status === 'pending' || a.status === 'late');
  const completed = assignments.filter(a => a.status === 'submitted' || a.status === 'graded');
  const submittedIds = new Set(submissions.map(s => s.assignmentId));

  async function handleSubmit(assignmentId: string, text: string) {
    await assessmentService.submitTextAnswer(assignmentId, { textContent: text });
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, status: 'submitted' } : a));
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/student/assessment/assignments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Assignments
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{subjectName || 'Subject Assignments'}</h1>
        </div>

        {/* Inner tab toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          {(['active', 'completed'] as AssignmentTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all capitalize',
                tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'active' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {t === 'active' ? 'Active' : 'Completed'}
              {t === 'active' && active.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {active.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-24" />)}</div>
        ) : tab === 'active' ? (
          active.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
              <h3 className="font-semibold">All caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1">No active assignments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {active.map(a => (
                <ActiveAssignmentCard key={a.id} assignment={a} onSubmit={handleSubmit} />
              ))}
            </div>
          )
        ) : (
          completed.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold">No completed assignments</h3>
              <p className="text-sm text-muted-foreground mt-1">Submitted assignments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completed.map(a => {
                const sub = submissions.find(s => s.assignmentId === a.id);
                return sub
                  ? <CompletedAssignmentCard key={a.id} submission={sub} />
                  : (
                    <div key={a.id} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.status === 'graded' ? `Score: ${a.score ?? '—'} / ${a.totalPoints ?? '—'}` : 'Pending review'}
                        </p>
                      </div>
                    </div>
                  );
              })}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
