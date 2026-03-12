'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClipboardCheck, Clock, ArrowRight, CheckCircle2, BookOpen, Layers, ChevronDown, Bot, Sparkles } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from '@/lib/dateUtils';

type Tab = 'active' | 'completed';

function getDueInfo(dueDate: string) {
  const d = parseISO(dueDate);
  if (isPast(d)) return { label: 'Overdue', cls: 'bg-red-50 text-red-600 border-red-200' };
  const diff = d.getTime() - Date.now();
  if (diff < 86_400_000) return { label: 'Due today', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  return { label: `Due ${formatDistanceToNow(d, { addSuffix: true })}`, cls: 'bg-muted text-muted-foreground border-border' };
}

function AssignmentCard({ assignment }: { assignment: Assignment & { aiGraded?: boolean; attemptId?: string } }) {
  const router = useRouter();
  const { label: dueLabel, cls: dueCls } = getDueInfo(assignment.dueDate);
  const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';
  const isGraded = assignment.status === 'graded';
  const isAiGraded = (assignment as any).aiGraded === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-start gap-4 rounded-2xl border border-border/60 dark:border-white/[0.06] bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Icon */}
      <div className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
        isGraded ? 'bg-emerald-100 dark:bg-emerald-900/40' :
        isSubmitted ? 'bg-sky-100 dark:bg-sky-900/40' :
        'bg-primary/10 dark:bg-primary/15',
      )}>
        {isGraded
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          : isSubmitted
            ? <ClipboardCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            : <ClipboardCheck className="h-5 w-5 text-primary" />}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-base leading-snug text-foreground">{assignment.title}</h3>
          <Badge variant="outline" className={cn('text-xs border shrink-0', dueCls)}>
            <Clock className="h-3 w-3 mr-1" />{dueLabel}
          </Badge>
        </div>

        {/* Course + Chapter */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />{assignment.courseName}
          </span>
          {assignment.chapterName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />{assignment.chapterName}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {isGraded && (
              <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 text-[10px] gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Graded
              </Badge>
            )}
            {isSubmitted && !isGraded && isAiGraded && (
              <Badge className="bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20 text-[10px] gap-1">
                <Bot className="h-2.5 w-2.5" /> AI Graded
              </Badge>
            )}
            {isSubmitted && !isGraded && !isAiGraded && (
              <Badge className="bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20 text-[10px] gap-1">
                <ClipboardCheck className="h-2.5 w-2.5" /> Submitted
              </Badge>
            )}
            {assignment.status === 'late' && !isSubmitted && (
              <Badge className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 text-[10px]">Late</Badge>
            )}
            {assignment.score !== undefined && assignment.score > 0 && (
              <span className="text-xs font-bold text-foreground bg-muted/50 dark:bg-muted/30 px-2 py-0.5 rounded-md">
                {assignment.score}/100
              </span>
            )}
            {assignment.totalPoints && !assignment.score && (
              <span className="text-xs text-muted-foreground">{assignment.totalPoints} pts</span>
            )}
          </div>
          <Button
            size="sm"
            variant={isSubmitted ? 'outline' : 'default'}
            onClick={() => {
              if (isGraded || isAiGraded) {
                router.push(`/student/assignments/${assignment.id}/result`);
              } else if (isSubmitted) {
                router.push(`/student/assignments/${assignment.id}/result`);
              } else {
                router.push(`/student/assignments/${assignment.id}/workspace`);
              }
            }}
            className="gap-1.5 shrink-0"
          >
            {isGraded ? 'View Result' : isSubmitted ? 'View Submission' : 'Start'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await assessmentService.getAssignments() as any;
        if (!cancelled) {
          const data: Assignment[] = res?.data ?? res ?? [];
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('[AssignmentsPage]', e);
        if (!cancelled) setAssignments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Unique courses for filter dropdown
  const courses = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach(a => { if (a.courseId && a.courseName) map.set(a.courseId, a.courseName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignments]);

  const active = assignments.filter(a => a.status === 'pending' || a.status === 'late');
  const completed = assignments.filter(a => a.status === 'submitted' || a.status === 'graded');

  const filtered = (tab === 'active' ? active : completed).filter(
    a => courseFilter === 'all' || a.courseId === courseFilter,
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${active.length} active · ${completed.length} completed`}
          </p>
        </div>

        {/* Controls: tab toggle + course filter */}
        {!loading && assignments.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
              {(['active', 'completed'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all',
                    tab === t
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                  <span className={cn(
                    'ml-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold',
                    tab === t ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20 text-muted-foreground',
                  )}>
                    {t === 'active' ? active.length : completed.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Course filter */}
            {courses.length > 1 && (
              <div className="relative">
                <select
                  value={courseFilter}
                  onChange={e => setCourseFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-border bg-card pl-3 pr-8 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Assignments from your teachers will appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No {tab} assignments{courseFilter !== 'all' ? ' for this course' : ''}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(a => <AssignmentCard key={a.id} assignment={a} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
