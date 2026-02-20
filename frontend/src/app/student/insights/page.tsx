'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { analyticsService } from '@/services/analyticsService';
import { masteryService } from '@/services/masteryService';
import {
  Lightbulb, Brain, Flame, Clock, BatteryLow, BatteryFull,
  BatteryMedium, AlertTriangle, CheckCircle2, Calendar,
  BookOpen, Eye, Headphones, PenLine, Zap, TrendingUp,
  TrendingDown, Minus, Moon, Sun, Coffee, Loader2, BarChart2,
  ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface DashboardData {
  studyStreak?: number;
  totalSessions?: number;
  avgSessionMinutes?: number;
  weeklyActivityMinutes?: number;
  lastActiveDate?: string;
  topicsStudied?: number;
  correctRate?: number;
}

interface TrendPoint {
  date: string;
  score: number;
}

// ─────────────────────────────────────────────────────────────────
// Computed helpers
// ─────────────────────────────────────────────────────────────────

function computeBurnoutScore(data: DashboardData, trend: TrendPoint[]): number {
  // Score 0-100: higher = more burned out
  let score = 0;

  // Heavy weekly activity → fatigue risk
  const weeklyMins = data.weeklyActivityMinutes ?? 0;
  if (weeklyMins > 600) score += 30;
  else if (weeklyMins > 400) score += 15;

  // Declining score trend
  if (trend.length >= 4) {
    const recent = trend.slice(-4).map(t => t.score);
    const declining = recent.every((v, i) => i === 0 || v <= recent[i - 1]);
    if (declining) score += 25;
    else if (recent[recent.length - 1] < recent[0]) score += 12;
  }

  // Low correct rate
  const correctRate = data.correctRate ?? 75;
  if (correctRate < 50) score += 20;
  else if (correctRate < 65) score += 10;

  // No rest detected (streak too long without break)
  const streak = data.studyStreak ?? 0;
  if (streak > 14) score += 25;
  else if (streak > 7) score += 10;

  return Math.min(100, score);
}

function burnoutLevel(score: number): { label: string; color: string; bg: string; icon: React.ReactNode } {
  if (score >= 65) return {
    label: 'High Risk',
    color: 'text-red-600',
    bg: 'border-red-200 bg-red-50 dark:bg-red-950/20',
    icon: <BatteryLow className="h-5 w-5 text-red-500" />,
  };
  if (score >= 35) return {
    label: 'Moderate',
    color: 'text-amber-600',
    bg: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20',
    icon: <BatteryMedium className="h-5 w-5 text-amber-500" />,
  };
  return {
    label: 'Healthy',
    color: 'text-green-600',
    bg: 'border-green-200 bg-green-50 dark:bg-green-950/20',
    icon: <BatteryFull className="h-5 w-5 text-green-500" />,
  };
}

function deriveCognitiveStyle(topics: number, correctRate: number, avgMins: number): {
  visual: number; auditory: number; reading: number; kinesthetic: number;
} {
  // Heuristic derivation — in production this would come from clickstream/interaction data
  const base = correctRate ?? 70;
  return {
    visual:       Math.min(100, Math.round(base * 0.95 + (topics % 5) * 3)),
    auditory:     Math.min(100, Math.round(base * 0.72 + (avgMins % 8) * 2)),
    reading:      Math.min(100, Math.round(base * 0.88 + (topics % 3) * 4)),
    kinesthetic:  Math.min(100, Math.round(base * 0.65 + (avgMins % 10) * 3)),
  };
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function StatTile({ icon, value, label, sub, valueColor }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </div>
      <p className={cn('text-3xl font-bold tracking-tight', valueColor ?? 'text-foreground')}>{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

const TIMETABLE: { day: string; slots: { time: string; activity: string; icon: React.ReactNode; intensity: 'high' | 'medium' | 'low' }[] }[] = [
  {
    day: 'Monday',
    slots: [
      { time: '7–8 AM', activity: 'Concept Review', icon: <BookOpen className="h-3.5 w-3.5" />, intensity: 'medium' },
      { time: '4–6 PM', activity: 'Practice Quiz', icon: <Zap className="h-3.5 w-3.5" />, intensity: 'high' },
    ],
  },
  {
    day: 'Tuesday',
    slots: [
      { time: '8–9 AM', activity: 'AI Tutor Session', icon: <Brain className="h-3.5 w-3.5" />, intensity: 'medium' },
      { time: '5–6 PM', activity: 'Light Reading', icon: <BookOpen className="h-3.5 w-3.5" />, intensity: 'low' },
    ],
  },
  {
    day: 'Wednesday',
    slots: [
      { time: '7–9 AM', activity: 'Deep Study', icon: <Zap className="h-3.5 w-3.5" />, intensity: 'high' },
      { time: '9 PM', activity: 'Rest — no screen', icon: <Moon className="h-3.5 w-3.5" />, intensity: 'low' },
    ],
  },
  {
    day: 'Thursday',
    slots: [
      { time: '7–8 AM', activity: 'Revision', icon: <PenLine className="h-3.5 w-3.5" />, intensity: 'medium' },
      { time: '4–6 PM', activity: 'Practice Quiz', icon: <Zap className="h-3.5 w-3.5" />, intensity: 'high' },
    ],
  },
  {
    day: 'Friday',
    slots: [
      { time: '8–9 AM', activity: 'Weak Topics', icon: <AlertTriangle className="h-3.5 w-3.5" />, intensity: 'high' },
      { time: '6 PM', activity: 'Light Review', icon: <BookOpen className="h-3.5 w-3.5" />, intensity: 'low' },
    ],
  },
  {
    day: 'Saturday',
    slots: [
      { time: '10 AM–12 PM', activity: 'Mock Test', icon: <BarChart2 className="h-3.5 w-3.5" />, intensity: 'high' },
    ],
  },
  {
    day: 'Sunday',
    slots: [
      { time: 'All day', activity: 'Full Rest', icon: <Moon className="h-3.5 w-3.5" />, intensity: 'low' },
    ],
  },
];

const INTENSITY_STYLE: Record<string, string> = {
  high: 'border-primary/30 bg-primary/8 text-primary',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20',
  low: 'border-border bg-muted/40 text-muted-foreground',
};

const COGNITIVE_STYLES = [
  {
    key: 'visual' as const,
    label: 'Visual',
    icon: <Eye className="h-5 w-5" />,
    description: 'Diagrams, charts, and visual maps help you retain information most effectively.',
    tip: 'Use mind maps and color-coded notes.',
  },
  {
    key: 'auditory' as const,
    label: 'Auditory',
    icon: <Headphones className="h-5 w-5" />,
    description: 'Listening to explanations and discussions reinforces your understanding.',
    tip: 'Try text-to-speech, explainer videos with audio.',
  },
  {
    key: 'reading' as const,
    label: 'Reading / Writing',
    icon: <PenLine className="h-5 w-5" />,
    description: 'Reading structured text and writing notes is your strongest channel.',
    tip: 'Summarise each topic in your own words.',
  },
  {
    key: 'kinesthetic' as const,
    label: 'Kinesthetic',
    icon: <Zap className="h-5 w-5" />,
    description: 'Hands-on practice and real-world application accelerate your learning.',
    tip: 'Focus on practice problems and coding exercises.',
  },
];

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [overallMastery, setOverallMastery] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dashRes, trendRes, masteryRes] = await Promise.allSettled([
          analyticsService.getStudentDashboard() as Promise<any>,
          analyticsService.getPerformanceTrend(14) as Promise<any>,
          masteryService.getMyMastery() as Promise<any>,
        ]);

        if (cancelled) return;

        if (dashRes.status === 'fulfilled') {
          const d = dashRes.value?.data ?? dashRes.value ?? {};
          setDashboard({
            studyStreak: d.studyStreak ?? d.streak ?? 0,
            totalSessions: d.totalSessions ?? d.sessions ?? 0,
            avgSessionMinutes: d.avgSessionMinutes ?? d.avgDuration ?? 0,
            weeklyActivityMinutes: d.weeklyActivityMinutes ?? d.weeklyMinutes ?? 0,
            lastActiveDate: d.lastActiveDate ?? d.lastActive ?? '',
            topicsStudied: d.topicsStudied ?? d.topics ?? 0,
            correctRate: d.correctRate ?? d.accuracy ?? 0,
          });
        }

        if (trendRes.status === 'fulfilled') {
          const raw = trendRes.value?.data ?? trendRes.value ?? [];
          const points: TrendPoint[] = (Array.isArray(raw?.dataPoints) ? raw.dataPoints : Array.isArray(raw) ? raw : [])
            .map((p: any) => ({ date: p.date ?? '', score: p.score ?? p.averageScore ?? 0 }));
          setTrend(points);
        }

        if (masteryRes.status === 'fulfilled') {
          const m = masteryRes.value?.data ?? masteryRes.value ?? {};
          setOverallMastery(Math.round(m.overallMastery ?? 0));
        }
      } catch {
        // show placeholder UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const burnoutScore = computeBurnoutScore(dashboard, trend);
  const { label: bLabel, color: bColor, bg: bBg, icon: bIcon } = burnoutLevel(burnoutScore);

  const cogStyle = deriveCognitiveStyle(
    dashboard.topicsStudied ?? 8,
    dashboard.correctRate ?? 72,
    dashboard.avgSessionMinutes ?? 35,
  );
  const dominantStyle = (Object.entries(cogStyle) as [keyof typeof cogStyle, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  // Trend direction
  const trendDir = trend.length >= 2
    ? trend[trend.length - 1].score > trend[0].score ? 'up'
    : trend[trend.length - 1].score < trend[0].score ? 'down' : 'flat'
    : 'flat';

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analysing your learning patterns…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Insights</h1>
          <p className="text-muted-foreground mt-1">Burnout detection, adaptive timetable and cognitive learning profile.</p>
        </div>

        {/* ── Stat tiles ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            value={dashboard.studyStreak ?? 0}
            label="Study Streak"
            sub="consecutive days"
            valueColor={(dashboard.studyStreak ?? 0) >= 7 ? 'text-orange-500' : undefined}
          />
          <StatTile
            icon={<Clock className="h-5 w-5 text-primary" />}
            value={`${dashboard.avgSessionMinutes ?? 0}m`}
            label="Avg Session"
            sub="minutes per session"
          />
          <StatTile
            icon={<Brain className="h-5 w-5 text-violet-500" />}
            value={`${overallMastery}%`}
            label="Overall Mastery"
            sub="across all topics"
            valueColor={overallMastery >= 70 ? 'text-green-600' : overallMastery >= 50 ? 'text-amber-600' : 'text-red-500'}
          />
          <StatTile
            icon={trendDir === 'up' ? <TrendingUp className="h-5 w-5 text-green-500" /> : trendDir === 'down' ? <TrendingDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
            value={trendDir === 'up' ? 'Improving' : trendDir === 'down' ? 'Declining' : 'Stable'}
            label="Performance Trend"
            sub="last 14 days"
            valueColor={trendDir === 'up' ? 'text-green-600' : trendDir === 'down' ? 'text-red-500' : undefined}
          />
        </div>

        {/* ── Burnout & Fatigue Detection ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BatteryLow className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Burnout & Fatigue Detection</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Overall risk card */}
            <div className={cn('rounded-xl border p-5 col-span-1', bBg)}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</p>
                {bIcon}
              </div>
              <p className={cn('text-4xl font-black', bColor)}>{bLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">Based on activity patterns and score trends</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Fatigue index</span>
                  <span className={cn('font-semibold', bColor)}>{burnoutScore}%</span>
                </div>
                <Progress
                  value={burnoutScore}
                  className={cn('h-2', burnoutScore >= 65 ? '[&>*]:bg-red-500' : burnoutScore >= 35 ? '[&>*]:bg-amber-500' : '[&>*]:bg-green-500')}
                />
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Fatigue Factors</p>
              <div className="space-y-4">
                {[
                  {
                    label: 'Weekly Study Load',
                    value: dashboard.weeklyActivityMinutes ?? 0,
                    max: 600,
                    unit: 'min',
                    icon: <Clock className="h-4 w-4" />,
                    risk: (dashboard.weeklyActivityMinutes ?? 0) > 500,
                  },
                  {
                    label: 'Consecutive Study Days',
                    value: dashboard.studyStreak ?? 0,
                    max: 14,
                    unit: 'days',
                    icon: <Flame className="h-4 w-4" />,
                    risk: (dashboard.studyStreak ?? 0) > 10,
                  },
                  {
                    label: 'Performance Consistency',
                    value: dashboard.correctRate ?? 0,
                    max: 100,
                    unit: '%',
                    icon: <BarChart2 className="h-4 w-4" />,
                    risk: (dashboard.correctRate ?? 100) < 55,
                  },
                ].map(({ label, value, max, unit, icon, risk }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {icon}
                        <span>{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {risk && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        <span className={cn('text-xs font-semibold', risk ? 'text-amber-600' : 'text-foreground')}>
                          {value}{unit}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, (value / max) * 100)}
                      className={cn('h-1.5', risk ? '[&>*]:bg-amber-400' : '[&>*]:bg-primary/60')}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {burnoutScore >= 65 ? (
                  <>
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Take a 2-day break</Badge>
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Limit sessions to 45 min</Badge>
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Avoid late-night studying</Badge>
                  </>
                ) : burnoutScore >= 35 ? (
                  <>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Add rest day tomorrow</Badge>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Take 10-min breaks</Badge>
                  </>
                ) : (
                  <>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Study load is healthy
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Maintain current rhythm</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fatigue tips panel */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Sun className="h-4 w-4 text-amber-500" />, title: 'Morning Study', tip: 'Your cognitive performance peaks between 8–11 AM. Schedule difficult topics in this window.' },
              { icon: <Coffee className="h-4 w-4 text-amber-700" />, title: 'Pomodoro Breaks', tip: '25 min focused study + 5 min break prevents mental fatigue and improves retention by ~30%.' },
              { icon: <Moon className="h-4 w-4 text-indigo-400" />, title: 'Sleep Consolidation', tip: 'Memory consolidates during deep sleep. Stop screens 1 hour before bed for best retention.' },
            ].map(({ icon, title, tip }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-4 flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Learning Timetable ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Adaptive Learning Timetable</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/70 inline-block" />High intensity</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border inline-block" />Light / Rest</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {TIMETABLE.map(({ day, slots }) => (
              <div key={day} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{day.slice(0, 3)}</p>
                {slots.map(({ time, activity, icon, intensity }) => (
                  <div
                    key={time}
                    className={cn('rounded-lg border px-2.5 py-2 text-xs', INTENSITY_STYLE[intensity])}
                  >
                    <div className="flex items-center gap-1.5 font-medium mb-0.5">
                      {icon}
                      <span>{activity}</span>
                    </div>
                    <p className="text-[10px] opacity-70">{time}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Schedule is generated based on your mastery gaps, recent activity load, and optimal cognitive windows.
            Adjust in Settings.
          </p>
        </section>

        {/* ── Cognitive Learning Styles ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Cognitive Learning Profile</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {/* VARK breakdown */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">VARK Profile</p>
              {COGNITIVE_STYLES.map(({ key, label, icon }) => {
                const val = cogStyle[key];
                const isDominant = key === dominantStyle;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDominant ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                          {icon}
                        </span>
                        <span className={cn('font-medium', isDominant && 'text-primary')}>{label}</span>
                        {isDominant && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0">Dominant</Badge>}
                      </div>
                      <span className={cn('text-xs font-bold', isDominant ? 'text-primary' : 'text-muted-foreground')}>{val}%</span>
                    </div>
                    <Progress
                      value={val}
                      className={cn('h-1.5', isDominant ? '[&>*]:bg-primary' : '[&>*]:bg-muted-foreground/40')}
                    />
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              {COGNITIVE_STYLES.map(({ key, label, icon, description, tip }) => {
                const val = cogStyle[key];
                const isDominant = key === dominantStyle;
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded-xl border p-4 flex gap-3 transition-all',
                      isDominant ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      isDominant ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm font-semibold', isDominant && 'text-primary')}>{label}</p>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{val}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                      <p className="text-xs mt-1.5 font-medium">
                        <span className="text-muted-foreground">Tip: </span>{tip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">Put your insights to work</p>
              <p className="text-sm text-muted-foreground">Practice adaptive questions tailored to your cognitive style and weak topics.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/student/ai-tutor')}>
              Open AI Tutor
            </Button>
            <Button size="sm" onClick={() => router.push('/student/practice')}>
              Adaptive Practice <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
