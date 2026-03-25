'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const PerformanceChart = lazy(() =>
  import('@/components/charts/PerformanceChart') as Promise<{ default: React.ComponentType<{ data: any[] }> }>
);

// ─────────────────────────────────────────────────────────────────
// Grade helpers
// ─────────────────────────────────────────────────────────────────

function getGrade(pct: number): { letter: string; color: string } {
  if (pct >= 90) return { letter: 'A+', color: 'text-green-600' };
  if (pct >= 80) return { letter: 'A', color: 'text-green-500' };
  if (pct >= 70) return { letter: 'B', color: 'text-blue-500' };
  if (pct >= 60) return { letter: 'C', color: 'text-amber-500' };
  if (pct >= 50) return { letter: 'D', color: 'text-orange-500' };
  return { letter: 'F', color: 'text-red-600' };
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface TopicMastery {
  topicId: string;
  topicName: string;
  masteryPct: number;
  trend?: 'up' | 'down' | 'stable';
}

interface PerformancePoint {
  date: string;
  score: number;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────
// Section components
// ─────────────────────────────────────────────────────────────────

function GradeCard({ overallPct }: { overallPct: number }) {
  const [displayed, setDisplayed] = useState(0);
  const { letter, color } = getGrade(overallPct);

  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      n += 2;
      setDisplayed(Math.min(n, overallPct));
      if (n >= overallPct) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [overallPct]);

  return (
    <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Overall Performance</p>
        <p className={cn('text-7xl font-black tabular-nums', color)}>
          {displayed}<span className="text-3xl text-muted-foreground">%</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">Based on all completed quizzes and assignments</p>
      </div>
      <div className="text-center">
        <div className={cn('text-6xl font-black', color)}>{letter}</div>
        <p className="text-xs text-muted-foreground mt-1">Grade</p>
      </div>
    </div>
  );
}

function TopicMasteryBar({ topic }: { topic: TopicMastery }) {
  const pct = Math.round(Math.min(100, Math.max(0, topic.masteryPct)));
  const barColor =
    pct >= 80 ? 'bg-green-500' :
    pct >= 60 ? 'bg-blue-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate max-w-[60%]">{topic.topicName}</span>
        <div className="flex items-center gap-2">
          {topic.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
          {topic.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          <span className={cn('text-xs font-bold', pct >= 60 ? 'text-foreground' : 'text-red-500')}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WeakTopicHeatmap({ topics }: { topics: TopicMastery[] }) {
  const sorted = [...topics].sort((a, b) => a.masteryPct - b.masteryPct).slice(0, 20);

  function tileCls(pct: number) {
    if (pct >= 80) return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-700 dark:text-green-400';
    if (pct >= 60) return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-700 dark:text-blue-400';
    if (pct >= 40) return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-400';
    return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-800 dark:text-red-400';
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {sorted.map((t, i) => {
        const pct = Math.round(t.masteryPct);
        return (
          <motion.div
            key={t.topicId}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'rounded-lg border p-2.5 text-center cursor-default transition-all duration-200 select-none hover:scale-[1.04]',
              tileCls(pct),
            )}
          >
            <p className="text-sm font-black tabular-nums">{pct}%</p>
            <p className="text-[9px] leading-tight mt-1 line-clamp-2 opacity-80">{t.topicName}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

interface RecentScore {
  id: string;
  assignmentTitle: string;
  submittedAt: string;
  score: number;
}

function RecentScoreRow({ sub }: { sub: RecentScore }) {
  const pct = sub.score ?? 0;
  const { letter, color } = getGrade(pct);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={cn('text-xl font-black w-8 shrink-0 text-center', color)}>{letter}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sub.assignmentTitle ?? `Submission #${sub.id.slice(-4)}`}</p>
        <p className="text-xs text-muted-foreground">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
      </div>
      <span className={cn('text-sm font-bold', color)}>{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [overallPct, setOverallPct] = useState(0);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);
  const [trendData, setTrendData] = useState<PerformancePoint[]>([]);
  const [recentScores, setRecentScores] = useState<RecentScore[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.get('/student/results') as any;
        if (cancelled) return;

        const data = response?.data ?? response;
        setOverallPct(data?.overallPct ?? 0);
        setTopicMastery(data?.topicMastery ?? []);
        setTrendData(data?.trendData ?? []);
        setRecentScores(data?.recentScores ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your performance report…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
      >
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && overallPct === 0 && topicMastery.length === 0 && recentScores.length === 0 && trendData.length === 0 && (
          <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-border bg-card">
            <p className="text-sm text-muted-foreground">No assessment results available yet.</p>
          </div>
        )}

        {/* Overall grade */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <GradeCard overallPct={overallPct} />
        </motion.div>

        {/* 2-col layout */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Topic mastery breakdown */}
          <motion.div 
            className="rounded-xl border border-border bg-card p-5 space-y-3"
            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Topic Mastery</h2>
              <Badge variant="outline">{topicMastery.length} topics</Badge>
            </div>
            {topicMastery.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">No mastery data available yet.</p>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {topicMastery.map(t => <TopicMasteryBar key={t.topicId} topic={t} />)}
              </div>
            )}
          </motion.div>

          {/* Recent scores */}
          <motion.div 
            className="rounded-xl border border-border bg-card p-5"
            variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
          >
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Recent Scores</h2>
            {recentScores.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">No graded submissions yet.</p>
            ) : (
              <div className="max-h-[340px] overflow-y-auto">
                {recentScores.map(s => <RecentScoreRow key={s.id} sub={s} />)}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Improvement trend chart */}
        <motion.div 
          className="rounded-xl border border-border bg-card p-5"
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        >
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">30-Day Performance Trend</h2>
          {trendData.length > 0 ? (
            <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading chart…</div>}>
              <PerformanceChart data={trendData} />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Complete quizzes and assignments to see your trend.</p>
            </div>
          )}
        </motion.div>

        {/* Weak topic heatmap */}
        {topicMastery.length > 0 && (
          <motion.div 
            className="rounded-xl border border-border bg-card p-5"
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Topic Heatmap</h2>
            <p className="text-xs text-muted-foreground mb-4">Showing all topics by mastery level — red = weakest, green = strongest</p>
            <WeakTopicHeatmap topics={topicMastery} />
          </motion.div>
        )}


      </motion.div>
    </DashboardLayout>
  );
}
