'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment, Submission } from '@/services/assessmentService';
import { masteryService, TopicMastery } from '@/services/masteryService';
import { analyticsService } from '@/services/analyticsService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ClipboardCheck, FileQuestion, BarChart3, AlertTriangle,
  Clock, CheckCircle2, XCircle, ChevronRight, MessageSquare,
  TrendingUp, Target, Calendar,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from '@/lib/dateUtils';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function dueBadge(dueDate: string) {
  const d = parseISO(dueDate);
  if (isPast(d)) return { text: 'Overdue', cls: 'bg-red-50 border-red-200 text-red-600' };
  const diff = d.getTime() - Date.now();
  if (diff < 86_400_000) return { text: 'Due today', cls: 'bg-amber-50 border-amber-200 text-amber-600' };
  if (diff < 259_200_000) return { text: formatDistanceToNow(d, { addSuffix: true }), cls: 'bg-yellow-50 border-yellow-200 text-yellow-600' };
  return { text: formatDistanceToNow(d, { addSuffix: true }), cls: 'bg-muted border-border text-muted-foreground' };
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-red-600';
}

// ─────────────────────────────────────────────────────────────────
// Card skeletons
// ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function AssessmentDashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicMastery[]>([]);
  const [overallMastery, setOverallMastery] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [assignmentsRes, submissionsRes, masteryRes] = await Promise.allSettled([
          assessmentService.getAssignments() as Promise<any>,
          assessmentService.getSubmissions() as Promise<any>,
          masteryService.getMyMastery() as Promise<any>,
        ]);

        if (cancelled) return;

        if (assignmentsRes.status === 'fulfilled') {
          const raw = assignmentsRes.value?.data ?? assignmentsRes.value ?? [];
          setAssignments(Array.isArray(raw) ? raw : []);
        }
        if (submissionsRes.status === 'fulfilled') {
          const raw = submissionsRes.value?.data ?? submissionsRes.value ?? [];
          setSubmissions(Array.isArray(raw) ? raw : []);
        }
        if (masteryRes.status === 'fulfilled') {
          const m = masteryRes.value?.data ?? masteryRes.value;
          setOverallMastery(Math.round(m?.overallMastery ?? 0));
          setWeakTopics(Array.isArray(m?.weakTopics) ? m.weakTopics.slice(0, 4) : []);
        }
      } catch (e) {
        console.error('[AssessmentDashboard] load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const pending = assignments.filter(a => a.status === 'pending');
  const upcoming = pending
    .filter(a => a.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  const recentGraded = submissions.filter(s => s.status === 'graded').slice(0, 4);

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment</h1>
          <p className="text-muted-foreground mt-1">Track your assignments, quizzes, and academic performance.</p>
        </div>

        {/* ── Metric row ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-24" />
            ))
          ) : (
            <>
              <MetricTile
                icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
                label="Pending Assignments"
                value={pending.length.toString()}
                sub="need submission"
                href="/student/assessment/assignments"
              />
              <MetricTile
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                label="Completed"
                value={submissions.length.toString()}
                sub="submissions total"
                href="/student/assessment/assignments"
              />
              <MetricTile
                icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                label="Overall Mastery"
                value={`${overallMastery}%`}
                sub="across all topics"
                href="/student/assessment/results"
              />
              <MetricTile
                icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                label="Weak Topics"
                value={weakTopics.length.toString()}
                sub="need attention"
                href="/student/assessment/results"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Upcoming deadlines ── */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Upcoming Deadlines
              </h2>
              <Link href="/student/assessment/assignments" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-400 mb-2" />
                <p className="text-sm font-medium">No pending assignments!</p>
                <p className="text-xs text-muted-foreground mt-0.5">You're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(a => {
                  const { text, cls } = dueBadge(a.dueDate);
                  return (
                    <Link
                      key={a.id}
                      href={`/student/assessment/assignments/${a.subjectId ?? a.courseId}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.courseName ?? a.subjectName}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-xs shrink-0 border', cls)}>{text}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Weak topic alerts ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Weak Topics
              </h2>
              <Link href="/student/assessment/results" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Details <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : weakTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Target className="h-10 w-10 text-green-400 mb-2" />
                <p className="text-sm font-medium">All topics strong!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weakTopics.map(t => (
                  <div key={t.topicId} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[140px]">{t.topicName}</span>
                      <span className={scoreColor(t.masteryLevel)}>{Math.round(t.masteryLevel)}%</span>
                    </div>
                    <Progress
                      value={t.masteryLevel}
                      className={cn('h-1.5', t.masteryLevel < 40 ? '[&>*]:bg-red-500' : '[&>*]:bg-amber-500')}
                    />
                    <p className="text-[10px] text-muted-foreground">{t.subjectName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent scores ── */}
        {!loading && recentGraded.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Recent Scores
              </h2>
              <Link href="/student/assessment/results" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Full report <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentGraded.map(s => {
                const pct = s.totalPoints ? Math.round(((s.score ?? 0) / s.totalPoints) * 100) : null;
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium truncate mb-1">{s.assignmentTitle}</p>
                    {pct !== null ? (
                      <>
                        <p className={cn('text-2xl font-bold', scoreColor(pct))}>{pct}%</p>
                        <Progress value={pct} className={cn('h-1.5 mt-2', pct >= 80 ? '[&>*]:bg-green-500' : pct >= 60 ? '[&>*]:bg-amber-500' : '[&>*]:bg-red-500')} />
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Score pending</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// MetricTile
// ─────────────────────────────────────────────────────────────────

function MetricTile({ icon, label, value, sub, href }: {
  icon: React.ReactNode; label: string; value: string; sub: string; href: string;
}) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all block">
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">{icon}</div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </Link>
  );
}
