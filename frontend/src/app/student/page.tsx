'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
import { gamificationService } from '@/services/gamificationService';
import { Panel } from '@/components/panels/Panel';
import { StatRing } from '@/components/panels/StatRing';
import { ActionCard } from '@/components/panels/ActionCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Zap,
  Brain,
  MessageSquare,
  Swords,
  ChevronRight,
  AlertTriangle,
  Clock,
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

// ──────────────────────────────────────────────────────────────────────────────
// Pixel Art Icons
// ──────────────────────────────────────────────────────────────────────────────

type PC = [number, number];
function PixelIcon({ pixels, color, size = 20 }: { pixels: PC[]; color: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill={color}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' } as React.CSSProperties}
    >
      {pixels.map(([c, r]) => <rect key={`${c},${r}`} x={c * 2} y={r * 2} width={2} height={2} />)}
    </svg>
  );
}

// --- flame: narrow tip → jagged middle → wide base ---
const IC_FLAME: PC[] = [
  [4,0],
  [3,1],[4,1],[5,1],
  [2,2],[3,2],[4,2],[5,2],[6,2],
  [1,3],[3,3],[4,3],[5,3],[6,3],[7,3],       // skip col2 = jagged left tongue
  [1,4],[4,4],[5,4],[6,4],[7,4],[8,4],       // skip col2,3 = deeper jagged
  [0,5],[1,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],  // gap at col2
  [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],
  [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],
  [2,9],[3,9],[4,9],[5,9],[6,9],
];

// --- clock: 10-wide circle outline + hour hand right + minute hand up ---
const IC_CLOCK: PC[] = [
  [3,0],[4,0],[5,0],[6,0],
  [1,1],[2,1],[5,1],[7,1],[8,1],
  [0,2],[5,2],[9,2],
  [0,3],[5,3],[9,3],
  [0,4],[5,4],[6,4],[7,4],[9,4],
  [0,5],[9,5],
  [0,6],[9,6],
  [0,7],[9,7],
  [1,8],[2,8],[7,8],[8,8],
  [3,9],[4,9],[5,9],[6,9],
];

// --- target: 3 concentric rings + centre dot ---
const IC_TARGET: PC[] = [
  [2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
  [1,1],[8,1],
  [0,2],[3,2],[4,2],[5,2],[6,2],[9,2],
  [0,3],[2,3],[7,3],[9,3],
  [0,4],[2,4],[4,4],[5,4],[7,4],[9,4],
  [0,5],[2,5],[4,5],[5,5],[7,5],[9,5],
  [0,6],[2,6],[7,6],[9,6],
  [0,7],[3,7],[4,7],[5,7],[6,7],[9,7],
  [1,8],[8,8],
  [2,9],[3,9],[4,9],[5,9],[6,9],[7,9],
];

// --- brain: two-lobe shape + centre crease + stem ---
const IC_BRAIN: PC[] = [
  [1,0],[2,0],[6,0],[7,0],[8,0],
  [0,1],[1,1],[2,1],[3,1],[6,1],[7,1],[8,1],[9,1],
  [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
  [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],
  [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],
  [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
  [3,7],[6,7],
  [3,8],[4,8],[5,8],[6,8],
];

// ──────────────────────────────────────────────────────────────────────────────
// Animated Insight Cards
// ──────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1100, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    setValue(0);
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

interface InsightCardProps {
  label: string;
  rawValue: number;
  suffix?: string;
  iconSrc: string;
  trendText: string;
  glowColor: string;
  borderColor: string;
  delay?: number;
}

function AnimatedInsightCard({
  label, rawValue, suffix = '', iconSrc, trendText,
  glowColor, borderColor, delay = 0,
}: InsightCardProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(rawValue, 1100, visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay + 120);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: hovered
          ? `0 0 0 1px ${glowColor}33, 0 8px 28px ${glowColor}28, inset 0 0 20px ${glowColor}0A`
          : '0 1px 3px rgba(0,0,0,0.07)',
        transform: visible
          ? hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)'
          : 'translateY(18px) scale(0.98)',
        opacity: visible ? 1 : 0,
        transition: `transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease, box-shadow 0.25s ease`,
        transitionDelay: visible ? '0ms' : `${delay}ms`,
      }}
      className="relative rounded-lg border border-border bg-card overflow-hidden cursor-default"
    >
      {/* Radial glow blob — covers full card */}
      <div
        style={{
          background: `radial-gradient(ellipse 80% 80% at 110% 110%, ${glowColor}28, transparent 60%)`,
          opacity: hovered ? 1 : 0.6,
          transition: 'opacity 0.3s ease',
        }}
        className="absolute inset-0 pointer-events-none"
      />
      {/* Corner shimmer */}
      <div
        style={{
          background: `conic-gradient(from 200deg at 100% 0%, ${glowColor}18 0deg, transparent 80deg)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
        className="absolute inset-0 pointer-events-none rounded-lg"
      />

      {/* Large PNG pixel art icon — right side, 75-80% of card height */}
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        style={{
          width: '92px',
          height: '92px',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: hovered
            ? `drop-shadow(0 0 14px ${glowColor}90) drop-shadow(0 0 28px ${glowColor}50)`
            : `drop-shadow(0 4px 8px ${glowColor}40)`,
          transition: 'filter 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          transform: hovered ? 'scale(1.08) translate(6px, 6px)' : 'scale(1) translate(10px, 10px)',
        }}
        className="absolute right-0 bottom-0 pointer-events-none"
      />

      {/* Text content — left side */}
      <div className="relative p-4 flex flex-col justify-between" style={{ minHeight: '118px' }}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div>
          <p
            style={{ color: hovered ? borderColor : undefined, transition: 'color 0.3s ease' }}
            className="font-mono text-3xl font-bold text-card-foreground"
          >
            {count}{suffix}
          </p>
          <p className="mt-1 text-xs font-medium text-success">↑ {trendText}</p>
        </div>
      </div>

      {/* Animated bottom accent bar */}
      <div
        style={{
          background: `linear-gradient(90deg, ${glowColor}, ${glowColor}50)`,
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
        className="absolute bottom-0 left-0 right-0 h-[2px]"
      />
    </div>
  );
}

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

        {/* ── Row 1: Animated Insight Cards ───────────────────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedInsightCard
            label="Study Streak"
            rawValue={MOCK_INSIGHTS_DASHBOARD.studyStreak}
            suffix=" days"
            iconSrc="/icons/flame.png"
            trendText="Keep going!"
            glowColor="#F97316"
            borderColor="#F97316"
            delay={0}
          />
          <AnimatedInsightCard
            label="Avg Session"
            rawValue={MOCK_INSIGHTS_DASHBOARD.avgSessionMinutes}
            suffix=" min"
            iconSrc="/icons/hourglass.png"
            trendText="Per session"
            glowColor="#3B82F6"
            borderColor="#3B82F6"
            delay={80}
          />
          <AnimatedInsightCard
            label="Correct Rate"
            rawValue={MOCK_INSIGHTS_DASHBOARD.correctRate}
            suffix="%"
            iconSrc="/icons/radar.png"
            trendText="Strong accuracy"
            glowColor="#22C55E"
            borderColor="#22C55E"
            delay={160}
          />
          <AnimatedInsightCard
            label="Topics Studied"
            rawValue={MOCK_INSIGHTS_DASHBOARD.topicsStudied}
            iconSrc="/icons/book.png"
            trendText="This month"
            glowColor="#A855F7"
            borderColor="#A855F7"
            delay={240}
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
