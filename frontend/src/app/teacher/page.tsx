'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  AlertCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { MOCK_TEACHER_DASHBOARD } from '@/lib/mockData';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

const TeacherPerformanceChart = dynamic(
  () => import('@/components/charts/TeacherPerformanceChart'),
  { ssr: false, loading: () => <div className="h-[340px] w-full animate-pulse rounded bg-muted/50" /> }
);

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface TeacherDashboardData {
  totalStudents: number;
  avgMastery: number;
  activeCoursesCount: number;
  courses: CourseOverview[];
  atRiskStudents: AtRiskStudent[];
  performanceTrend: PerformanceTrendPoint[];
}

interface CourseOverview {
  id: string;
  title: string;
  studentCount: number;
  avgGrade: number;
  nextAssignmentDue?: string;
}

interface AtRiskStudent {
  id: string;
  name: string;
  riskFactor: 'High' | 'Medium' | 'Low';
  currentGrade: number;
  courseName: string;
}

interface PerformanceTrendPoint {
  date: string;
  classAverage: number;
}

// ------------------------------------------------------------------
// Defaults & Mocks
// ------------------------------------------------------------------

const DEFAULT_DASHBOARD: TeacherDashboardData = {
  totalStudents: 0,
  avgMastery: 0,
  activeCoursesCount: 0,
  courses: [],
  atRiskStudents: [],
  performanceTrend: [],
};

function generatePlaceholderTrend(): PerformanceTrendPoint[] {
  const points: PerformanceTrendPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    points.push({
      date: `Week ${12 - i}`,
      classAverage: 58 + Math.floor(Math.random() * 15),
    });
  }
  return points;
}

// ------------------------------------------------------------------
// Animated counter hook
// ------------------------------------------------------------------

function useCountUp(target: number, duration = 1100, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    setValue(0);
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ------------------------------------------------------------------
// Animated Metric Card (matches student overview style)
// ------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  rawValue: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  trendText: string;
  glowColor: string;
  borderColor: string;
  iconBg: string;
  delay?: number;
  loading?: boolean;
}

function AnimatedMetricCard({
  label, rawValue, suffix = '', prefix = '', icon, trendText,
  glowColor, borderColor, iconBg, delay = 0, loading = false,
}: MetricCardProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(rawValue, 1100, visible && !loading);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay + 100);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
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
      className="relative rounded-lg border border-border bg-card p-4 overflow-hidden cursor-default"
    >
      {/* Radial glow blob top-right */}
      <div
        style={{
          background: `radial-gradient(ellipse 70% 55% at 105% -5%, ${glowColor}22, transparent 65%)`,
          opacity: hovered ? 1 : 0.55,
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

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            style={{ color: hovered ? borderColor : undefined, transition: 'color 0.3s ease' }}
            className="mt-1 font-mono text-3xl font-semibold text-card-foreground"
          >
            {prefix}{count}{suffix}
          </p>
          <p className="mt-1 text-xs font-medium text-green-500">↑ {trendText}</p>
        </div>

        <div
          style={{
            background: hovered ? `${glowColor}22` : iconBg,
            boxShadow: hovered
              ? `0 0 0 3px ${glowColor}1A, 0 0 18px ${glowColor}35`
              : 'none',
            color: glowColor,
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}
          className="rounded-lg p-2"
        >
          {icon}
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

// ------------------------------------------------------------------
// Section skeleton
// ------------------------------------------------------------------

function SectionSkeleton({ rows = 3, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', avatar && 'items-center')}>
          {avatar && <Skeleton className="h-9 w-9 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            {avatar && <Skeleton className="h-1.5 w-full" />}
          </div>
          {!avatar && <Skeleton className="h-10 w-14 rounded ml-auto" />}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Panel wrapper with enter animation
// ------------------------------------------------------------------

function AnimatedPanel({
  title, description, children, action, delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="font-semibold text-sm text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<TeacherDashboardData>(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.name ?? 'Teacher';

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await analyticsService.getTeacherDashboard();
      if (res?.data && res.data.totalStudents > 0) {
        setDashboard({ ...DEFAULT_DASHBOARD, ...res.data });
      } else {
        setDashboard({ ...MOCK_TEACHER_DASHBOARD, performanceTrend: generatePlaceholderTrend() });
      }
    } catch {
      setDashboard({ ...MOCK_TEACHER_DASHBOARD, performanceTrend: generatePlaceholderTrend() });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              What&apos;s happening in your classes today
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
        </motion.div>

        {/* â”€â”€ Row 1: Animated Metric Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <AnimatedMetricCard
            label="Total Students"
            rawValue={dashboard.totalStudents ?? 0}
            icon={<Users className="h-5 w-5" />}
            trendText="All courses"
            glowColor="#3b82f6"
            borderColor="#3b82f6"
            iconBg="#1e3a5f22"
            delay={0}
            loading={loading}
          />
          <AnimatedMetricCard
            label="Avg. Mastery"
            rawValue={dashboard.avgMastery ?? 0}
            suffix="%"
            icon={<GraduationCap className="h-5 w-5" />}
            trendText="+2.5% this month"
            glowColor="#22c55e"
            borderColor="#22c55e"
            iconBg="#14532d22"
            delay={90}
            loading={loading}
          />
          <AnimatedMetricCard
            label="Active Courses"
            rawValue={dashboard.activeCoursesCount ?? 0}
            icon={<BookOpen className="h-5 w-5" />}
            trendText="In progress"
            glowColor="#f59e0b"
            borderColor="#f59e0b"
            iconBg="#451a0322"
            delay={180}
            loading={loading}
          />
        </div>

        {/* â”€â”€ Row 2: Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <AnimatedPanel
          title="Class Performance Trends"
          description="Average student mastery over the last 12 weeks"
          delay={0.2}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="chart-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[340px] w-full rounded bg-muted/50 animate-pulse"
              />
            ) : (dashboard.performanceTrend?.length ?? 0) > 0 ? (
              <motion.div
                key="chart-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TeacherPerformanceChart data={dashboard.performanceTrend} />
              </motion.div>
            ) : (
              <div className="flex h-[340px] items-center justify-center text-muted-foreground text-sm">
                No data available yet.
              </div>
            )}
          </AnimatePresence>
        </AnimatedPanel>

        {/* â”€â”€ Row 3: Courses + At-Risk Students â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* My Courses */}
          <AnimatedPanel
            title="My Courses"
            description="Overview of active classes"
            delay={0.3}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="courses-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SectionSkeleton rows={4} />
                </motion.div>
              ) : (dashboard.courses?.length ?? 0) > 0 ? (
                <motion.div
                  key="courses-data"
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {dashboard.courses.map((course) => (
                    <motion.div
                      key={course.id}
                      variants={fadeUp}
                      className="group flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-muted/40 hover:border-border/80"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{course.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {course.studentCount} students
                          </span>
                          {course.nextAssignmentDue && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Due {new Date(course.nextAssignmentDue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg</div>
                        <div className={cn(
                          'text-xl font-black font-mono',
                          course.avgGrade >= 80 ? 'text-green-500' :
                          course.avgGrade >= 70 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {course.avgGrade}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">No active courses found.</div>
              )}
            </AnimatePresence>
          </AnimatedPanel>

          {/* At-Risk Students */}
          <AnimatedPanel
            title="At-Risk Students"
            description="Students requiring your attention"
            action={<AlertCircle className="h-4 w-4 text-red-500" />}
            delay={0.38}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="risk-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SectionSkeleton rows={4} avatar />
                </motion.div>
              ) : (dashboard.atRiskStudents?.length ?? 0) > 0 ? (
                <motion.div
                  key="risk-data"
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {dashboard.atRiskStudents.map((student) => (
                    <motion.div key={student.id} variants={fadeUp} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shrink-0">
                        <AvatarFallback className="text-xs font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <Badge
                            className={cn(
                              'text-[10px] shrink-0',
                              student.riskFactor === 'High'
                                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            )}
                            variant="outline"
                          >
                            {student.riskFactor}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                          <span className="truncate">{student.courseName}</span>
                          <span className={cn(
                            'font-mono font-bold shrink-0 ml-2',
                            student.currentGrade < 60 ? 'text-red-500' : 'text-amber-500'
                          )}>
                            {student.currentGrade}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              student.currentGrade < 60 ? 'bg-red-500' : 'bg-amber-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${student.currentGrade}%` }}
                            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">All students are performing well!</p>
                </div>
              )}
            </AnimatePresence>
          </AnimatedPanel>

        </div>
      </div>
    </DashboardLayout>
  );
}
