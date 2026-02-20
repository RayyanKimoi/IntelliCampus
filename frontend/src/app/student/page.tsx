'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
import { gamificationService } from '@/services/gamificationService';
import { Panel } from '@/components/panels/Panel';
import { MetricCard } from '@/components/panels/MetricCard';
import { StatRing } from '@/components/panels/StatRing';
import { ActionCard } from '@/components/panels/ActionCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Zap,
  Trophy,
  Flame,
  Brain,
  BookOpen,
  MessageSquare,
  Swords,
  Target,
  Clock,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { MOCK_STUDENT_DASHBOARD, MOCK_XP_PROFILE, MOCK_PERFORMANCE_TREND, MOCK_INSIGHTS_DASHBOARD } from '@/lib/mockData';
import dynamic from 'next/dynamic';

const PerformanceChart = dynamic(
  () => import('@/components/charts/PerformanceChart'),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" /> }
);

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface DashboardData {
  coursesEnrolled: number;
  totalXP: number;
  currentLevel: number;
  streakDays: number;
  overallMastery: number;
  recentActivities: RecentActivity[];
  weakTopics: WeakTopic[];
}

interface RecentActivity {
  id?: string;
  type: string;
  title: string;
  timestamp: string;
  xpEarned?: number;
}

interface WeakTopic {
  id?: string;
  topicName: string;
  mastery: number;
  courseName?: string;
}

interface XPProfile {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  rank?: string;
}

interface PerformanceTrendPoint {
  date: string;
  mastery: number;
  xp?: number;
}

// ------------------------------------------------------------------
// Defaults
// ------------------------------------------------------------------

const DEFAULT_DASHBOARD: DashboardData = {
  coursesEnrolled: 0,
  totalXP: 0,
  currentLevel: 1,
  streakDays: 0,
  overallMastery: 0,
  recentActivities: [],
  weakTopics: [],
};

const DEFAULT_XP_PROFILE: XPProfile = {
  totalXP: 0,
  level: 1,
  xpToNextLevel: 100,
  currentLevelXP: 0,
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function generatePlaceholderTrend(): PerformanceTrendPoint[] {
  const points: PerformanceTrendPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mastery: 0,
      xp: 0,
    });
  }
  return points;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityIcon(type: string) {
  switch (type) {
    case 'chat': return <MessageSquare className="h-4 w-4" />;
    case 'quiz': case 'sprint': return <Zap className="h-4 w-4" />;
    case 'boss_battle': return <Swords className="h-4 w-4" />;
    case 'mastery': return <Brain className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData>(DEFAULT_DASHBOARD);
  const [xpProfile, setXpProfile] = useState<XPProfile>(DEFAULT_XP_PROFILE);
  const [trend, setTrend] = useState<PerformanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [dashRes, xpRes, trendRes] = await Promise.allSettled([
        analyticsService.getStudentDashboard(),
        gamificationService.getXPProfile(),
        analyticsService.getPerformanceTrend(30),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboard({ ...DEFAULT_DASHBOARD, ...dashRes.value.data });
      } else {
        setDashboard(MOCK_STUDENT_DASHBOARD);
      }
      if (xpRes.status === 'fulfilled' && xpRes.value?.data) {
        setXpProfile({ ...DEFAULT_XP_PROFILE, ...xpRes.value.data });
      } else {
        setXpProfile(MOCK_XP_PROFILE);
      }
      if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
        const raw = trendRes.value.data as PerformanceTrendPoint[];
        setTrend(
          raw.map((p) => ({
            ...p,
            date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }))
        );
      } else {
        setTrend(MOCK_PERFORMANCE_TREND);
      }
    } catch {
      setDashboard(MOCK_STUDENT_DASHBOARD);
      setXpProfile(MOCK_XP_PROFILE);
      setTrend(MOCK_PERFORMANCE_TREND);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const xpProgress =
    xpProfile.xpToNextLevel > 0
      ? Math.min(100, Math.round((xpProfile.currentLevelXP / xpProfile.xpToNextLevel) * 100))
      : 0;

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your learning overview
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* ── Row 1: Metric Cards ─────────────────────────────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Overall Mastery"
            value={`${dashboard.overallMastery}%`}
            accentColor="success"
            icon={<Brain className="h-5 w-5" />}
            trend={dashboard.overallMastery > 0 ? { direction: 'up', value: `${dashboard.coursesEnrolled} courses` } : undefined}
          />
          <MetricCard
            label="Total XP"
            value={dashboard.totalXP.toLocaleString()}
            accentColor="warning"
            icon={<Zap className="h-5 w-5" />}
            trend={{ direction: 'up', value: `Level ${xpProfile.level}` }}
          />
          <MetricCard
            label="Streak"
            value={`${dashboard.streakDays}d`}
            accentColor="danger"
            icon={<Flame className="h-5 w-5" />}
            trend={dashboard.streakDays > 0 ? { direction: 'up', value: 'Keep going!' } : undefined}
          />
          <MetricCard
            label="Level"
            value={xpProfile.level}
            accentColor="info"
            icon={<Trophy className="h-5 w-5" />}
            trend={{ direction: 'up', value: `${xpProgress}% to next` }}
          />
        </div>

        {/* ── Row 2: Mastery Ring + XP Progress + Chart ──────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Mastery ring + XP bar */}
          <div className="space-y-4">
            <Panel title="Mastery" className="flex flex-col items-center py-8">
              <StatRing
                value={dashboard.overallMastery}
                label="Overall Mastery"
                size={140}
                strokeWidth={10}
              />
            </Panel>

            <Panel title="XP Progress">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Level {xpProfile.level}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {xpProfile.currentLevelXP} / {xpProfile.xpToNextLevel}
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </Panel>
          </div>

          {/* Right: Performance chart */}
          <Panel
            title="Performance Trend"
            description="Mastery over the last 30 days"
            className="lg:col-span-2"
          >
            {loading ? (
              <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" />
            ) : trend.length > 0 ? (
              <PerformanceChart data={trend} />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No performance data yet. Start learning!
              </div>
            )}
          </Panel>
        </div>
        {/* ── Row 3b: Learning Insights ────────────────────────── */}
        <Panel title="Learning Insights" description="Your study habits at a glance">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{MOCK_INSIGHTS_DASHBOARD.studyStreak}<span className="text-sm font-normal text-muted-foreground"> days</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Study Streak</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{MOCK_INSIGHTS_DASHBOARD.avgSessionMinutes}<span className="text-sm font-normal text-muted-foreground"> min</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Avg Session</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{MOCK_INSIGHTS_DASHBOARD.correctRate}<span className="text-sm font-normal text-muted-foreground">%</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Correct Rate</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <Brain className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{MOCK_INSIGHTS_DASHBOARD.topicsStudied}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Topics Studied</p>
            </div>
          </div>
        </Panel>
        {/* ── Row 3: Quick Actions ────────────────────────────── */}
        <Panel title="Recommended Next Actions">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              title="AI Tutor"
              description="Start a learning session"
              icon={<MessageSquare className="h-5 w-5" />}
              href="/student/ai-chat"
            />
            <ActionCard
              title="Boss Battle"
              description="Challenge a topic boss"
              icon={<Swords className="h-5 w-5" />}
              href="/student/gamification/boss-battle"
            />
            <ActionCard
              title="Sprint Quiz"
              description="Quick practice round"
              icon={<Zap className="h-5 w-5" />}
              href="/student/gamification/sprint"
            />
            <ActionCard
              title="My Courses"
              description="Browse enrolled courses"
              icon={<BookOpen className="h-5 w-5" />}
              href="/student/courses"
            />
          </div>
        </Panel>

        {/* ── Row 4: Weak Topics + Recent Activity ─────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weak Topics */}
          <Panel
            title="Weak Topics"
            description="Topics needing more practice"
            action={
              dashboard.weakTopics.length > 0 ? (
                <Link href="/student/mastery">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              ) : undefined
            }
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-2 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : dashboard.weakTopics.length > 0 ? (
              <div className="space-y-4">
                {dashboard.weakTopics.map((topic, idx) => (
                  <div key={topic.id ?? idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <span className="text-sm font-medium">{topic.topicName}</span>
                      </div>
                      <span className={cn(
                        'font-mono text-xs font-medium',
                        topic.mastery < 30 ? 'text-danger' : topic.mastery < 60 ? 'text-warning' : 'text-success'
                      )}>
                        {topic.mastery}%
                      </span>
                    </div>
                    {topic.courseName && (
                      <p className="text-xs text-muted-foreground mb-1.5 ml-5">{topic.courseName}</p>
                    )}
                    <Progress
                      value={topic.mastery}
                      className="h-1.5"
                    />
                    {idx < dashboard.weakTopics.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No weak topics detected!</p>
              </div>
            )}
          </Panel>

          {/* Recent Activity */}
          <Panel
            title="Recent Activity"
            description="Latest learning sessions"
            action={
              <Clock className="h-4 w-4 text-muted-foreground" />
            }
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboard.recentActivities.length > 0 ? (
              <div className="space-y-1">
                {dashboard.recentActivities.slice(0, 6).map((activity, idx) => (
                  <div
                    key={activity.id ?? idx}
                    className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {activityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
                    </div>
                    {activity.xpEarned != null && activity.xpEarned > 0 && (
                      <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                        +{activity.xpEarned} XP
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
