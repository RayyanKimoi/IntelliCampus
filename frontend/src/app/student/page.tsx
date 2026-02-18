'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
import { gamificationService } from '@/services/gamificationService';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
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
// Helper: generates placeholder trend data when API fails
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

// ------------------------------------------------------------------
// Helper: relative time
// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// Helper: activity icon
// ------------------------------------------------------------------

function activityIcon(type: string) {
  switch (type) {
    case 'chat':
      return <MessageSquare className="h-4 w-4" />;
    case 'quiz':
    case 'sprint':
      return <Zap className="h-4 w-4" />;
    case 'boss_battle':
      return <Swords className="h-4 w-4" />;
    case 'mastery':
      return <Brain className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

// ------------------------------------------------------------------
// Skeleton components
// ------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" />
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// Page component
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
      }

      if (xpRes.status === 'fulfilled' && xpRes.value?.data) {
        setXpProfile({ ...DEFAULT_XP_PROFILE, ...xpRes.value.data });
      }

      if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
        const raw = trendRes.value.data as PerformanceTrendPoint[];
        setTrend(
          raw.map((p) => ({
            ...p,
            date: new Date(p.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          }))
        );
      } else {
        setTrend(generatePlaceholderTrend());
      }
    } catch {
      // Defaults already set
      setTrend(generatePlaceholderTrend());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive greeting based on hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // XP progress toward next level
  const xpProgress =
    xpProfile.xpToNextLevel > 0
      ? Math.min(
          100,
          Math.round((xpProfile.currentLevelXP / xpProfile.xpToNextLevel) * 100)
        )
      : 0;

  // ----------------------------------------------------------------
  // Stat cards config
  // ----------------------------------------------------------------

  const stats = [
    {
      label: 'Total XP',
      value: dashboard.totalXP.toLocaleString(),
      sub: xpProfile.rank ? `Rank: ${xpProfile.rank}` : `${xpProgress}% to next level`,
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      color: 'bg-yellow-500/10',
    },
    {
      label: 'Level',
      value: dashboard.currentLevel,
      sub: `${xpProfile.currentLevelXP} / ${xpProfile.xpToNextLevel} XP`,
      icon: <Trophy className="h-5 w-5 text-campus-500" />,
      color: 'bg-campus-500/10',
    },
    {
      label: 'Current Streak',
      value: `${dashboard.streakDays}d`,
      sub: dashboard.streakDays > 0 ? 'Keep it going!' : 'Start a streak today',
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      color: 'bg-orange-500/10',
    },
    {
      label: 'Overall Mastery',
      value: `${dashboard.overallMastery}%`,
      sub: `${dashboard.coursesEnrolled} course${dashboard.coursesEnrolled !== 1 ? 's' : ''} enrolled`,
      icon: <Brain className="h-5 w-5 text-emerald-500" />,
      color: 'bg-emerald-500/10',
    },
  ];

  // ----------------------------------------------------------------
  // Quick actions
  // ----------------------------------------------------------------

  const quickActions = [
    {
      label: 'AI Tutor',
      href: '/student/ai-chat',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'Ask a question',
    },
    {
      label: 'Boss Battle',
      href: '/student/gamification/boss-battle',
      icon: <Swords className="h-5 w-5" />,
      description: 'Challenge a boss',
    },
    {
      label: 'Sprint Quiz',
      href: '/student/gamification/sprint',
      icon: <Zap className="h-5 w-5" />,
      description: 'Quick practice',
    },
    {
      label: 'My Courses',
      href: '/student/courses',
      icon: <BookOpen className="h-5 w-5" />,
      description: 'View courses',
    },
  ];

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* -------------------------------------------------------- */}
        {/* Header                                                   */}
        {/* -------------------------------------------------------- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-campus-200">
              <AvatarFallback className="bg-campus-100 text-campus-700 font-semibold text-lg">
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() ?? 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s your learning overview for today.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>

        {/* -------------------------------------------------------- */}
        {/* XP level progress bar                                    */}
        {/* -------------------------------------------------------- */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">
                Level {xpProfile.level}
              </span>
              <span className="text-muted-foreground">
                {xpProfile.currentLevelXP} / {xpProfile.xpToNextLevel} XP
              </span>
            </div>
            <Progress
              value={xpProgress}
              className="h-2"
              indicatorClassName="bg-campus-500"
            />
          </CardContent>
        </Card>

        {/* -------------------------------------------------------- */}
        {/* Stat cards                                               */}
        {/* -------------------------------------------------------- */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-sm font-medium">
                    {s.label}
                  </CardDescription>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md',
                      s.color
                    )}
                  >
                    {s.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* Main grid: chart + sidebar                              */}
        {/* -------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Performance trend chart (spans 2 cols) */}
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Performance Trend</CardTitle>
                <CardDescription>
                  Your mastery progress over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trend.length > 0 ? (
                  <PerformanceChart data={trend} />
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No performance data available yet. Start learning to see
                    your trends!
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick actions sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Jump into learning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-campus-100 text-campus-600 group-hover:bg-campus-200">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* -------------------------------------------------------- */}
        {/* Bottom grid: weak topics + recent activity              */}
        {/* -------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weak topics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Weak Topics</CardTitle>
                  <CardDescription>
                    Topics that need more practice
                  </CardDescription>
                </div>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
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
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {topic.topicName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            topic.mastery < 30
                              ? 'destructive'
                              : topic.mastery < 60
                                ? 'warning'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {topic.mastery}%
                        </Badge>
                      </div>
                      {topic.courseName && (
                        <p className="text-xs text-muted-foreground mb-1.5 ml-5">
                          {topic.courseName}
                        </p>
                      )}
                      <Progress
                        value={topic.mastery}
                        className="h-1.5"
                        indicatorClassName={cn(
                          topic.mastery < 30
                            ? 'bg-destructive'
                            : topic.mastery < 60
                              ? 'bg-warning'
                              : 'bg-campus-500'
                        )}
                      />
                      {idx < dashboard.weakTopics.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No weak topics detected. Keep up the great work!
                  </p>
                </div>
              )}
            </CardContent>
            {dashboard.weakTopics.length > 0 && (
              <CardFooter>
                <Link href="/student/mastery" className="w-full">
                  <Button variant="outline" className="w-full" size="sm">
                    View All Mastery Data
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest learning sessions
                  </CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
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
                        <p className="text-sm font-medium truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(activity.timestamp)}
                        </p>
                      </div>
                      {activity.xpEarned != null && activity.xpEarned > 0 && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          +{activity.xpEarned} XP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity. Start a session to see your progress!
                  </p>
                </div>
              )}
            </CardContent>
            {dashboard.recentActivities.length > 6 && (
              <CardFooter>
                <Link href="/student/activity" className="w-full">
                  <Button variant="outline" className="w-full" size="sm">
                    View All Activity
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
