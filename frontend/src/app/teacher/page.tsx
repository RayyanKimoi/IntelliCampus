'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
import { Panel } from '@/components/panels/Panel';
import { MetricCard } from '@/components/panels/MetricCard';
import { ActionCard } from '@/components/panels/ActionCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertCircle,
  Plus,
  Upload,
  FileText,
  ChevronRight,
  Calendar,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { MOCK_TEACHER_DASHBOARD, MOCK_TEACHER_ALERTS } from '@/lib/mockData';
import dynamic from 'next/dynamic';

const TeacherPerformanceChart = dynamic(
  () => import('@/components/charts/TeacherPerformanceChart'),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" /> }
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

function generateMockDashboard(): TeacherDashboardData {
  return {
    totalStudents: 142,
    avgMastery: 78,
    activeCoursesCount: 4,
    courses: [
      { id: 'c1', title: 'Introduction to Computer Science', studentCount: 45, avgGrade: 82, nextAssignmentDue: '2023-11-15' },
      { id: 'c2', title: 'Advanced Algorithms', studentCount: 28, avgGrade: 74, nextAssignmentDue: '2023-11-18' },
      { id: 'c3', title: 'Web Development Bootcamp', studentCount: 35, avgGrade: 88, nextAssignmentDue: '2023-11-20' },
      { id: 'c4', title: 'Data Structures 101', studentCount: 34, avgGrade: 68 },
    ],
    atRiskStudents: [
      { id: 's1', name: 'Alex Johnson', riskFactor: 'High', currentGrade: 45, courseName: 'Data Structures 101' },
      { id: 's2', name: 'Maria Garcia', riskFactor: 'Medium', currentGrade: 62, courseName: 'Advanced Algorithms' },
      { id: 's3', name: 'Sam Wilson', riskFactor: 'Medium', currentGrade: 58, courseName: 'Data Structures 101' },
    ],
    performanceTrend: generatePlaceholderTrend(),
  };
}

function generatePlaceholderTrend(): PerformanceTrendPoint[] {
  const points: PerformanceTrendPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      classAverage: 65 + Math.floor(Math.random() * 20),
    });
  }
  return points;
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<TeacherDashboardData>(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Teacher';

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await analyticsService.getTeacherDashboard();
      if (res?.data && res.data.totalStudents > 0) {
        setDashboard({ ...DEFAULT_DASHBOARD, ...res.data });
      } else {
        setDashboard(MOCK_TEACHER_DASHBOARD);
      }
    } catch (error) {
      console.error('Failed to fetch teacher dashboard data', error);
      setDashboard(MOCK_TEACHER_DASHBOARD);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {firstName}
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
        </div>

        {/* ── Row 1: Metric Cards ─────────────────────────────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <MetricCard
            label="Total Students"
            value={(dashboard.totalStudents ?? 0).toLocaleString()}
            accentColor="info"
            icon={<Users className="h-5 w-5" />}
            trend={{ direction: 'up', value: 'All courses' }}
          />
          <MetricCard
            label="Avg. Mastery"
            value={`${dashboard.avgMastery ?? 0}%`}
            accentColor="success"
            icon={<GraduationCap className="h-5 w-5" />}
            trend={{ direction: 'up', value: '+2.5% this month' }}
          />
          <MetricCard
            label="Active Courses"
            value={dashboard.activeCoursesCount ?? 0}
            accentColor="warning"
            icon={<BookOpen className="h-5 w-5" />}
            trend={{ direction: 'up', value: 'In progress' }}
          />
        </div>

        {/* ── Row 2: Chart + Quick Actions ────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            title="Class Performance Trends"
            description="Average student mastery over the last 7 days"
            className="lg:col-span-2"
          >
            {loading ? (
              <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" />
            ) : (dashboard.performanceTrend?.length ?? 0) > 0 ? (
              <TeacherPerformanceChart data={dashboard.performanceTrend} />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No data available yet.
              </div>
            )}
          </Panel>

          <Panel title="Quick Actions" description="Manage your classes">
            <div className="space-y-3">
              <ActionCard
                title="Create Assignment"
                description="Set up a new task"
                icon={<Plus className="h-5 w-5" />}
                href="/teacher/assignments/new"
              />
              <ActionCard
                title="Upload Content"
                description="Add course materials"
                icon={<Upload className="h-5 w-5" />}
                href="/teacher/content/upload"
              />
              <ActionCard
                title="View Reports"
                description="Analyze performance"
                icon={<FileText className="h-5 w-5" />}
                href="/teacher/analytics"
              />
            </div>
          </Panel>
        </div>

        {/* ── Row 3: Courses + At-Risk Students ───────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Courses */}
          <Panel
            title="My Courses"
            description="Overview of active classes"
            action={
              <Link href="/teacher/courses">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            }
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (dashboard.courses?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {dashboard.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{course.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course.studentCount}
                        </span>
                        {course.nextAssignmentDue && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Due {new Date(course.nextAssignmentDue).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xs text-muted-foreground uppercase tracking-wider">Avg</div>
                      <div className={cn(
                        'text-lg font-bold font-mono',
                        course.avgGrade >= 80 ? 'text-success' :
                        course.avgGrade >= 70 ? 'text-warning' : 'text-danger'
                      )}>
                        {course.avgGrade}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No active courses found.
              </div>
            )}
          </Panel>

          {/* At-Risk Students */}
          <Panel
            title="At-Risk Students"
            description="Students requiring attention"
            action={<AlertCircle className="h-4 w-4 text-danger" />}
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (dashboard.atRiskStudents?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {dashboard.atRiskStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="text-xs">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        <Badge variant={student.riskFactor === 'High' ? 'destructive' : 'warning'} className="text-2xs">
                          {student.riskFactor}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                        <span className="truncate">{student.courseName}</span>
                        <span className="font-mono font-semibold text-foreground">{student.currentGrade}%</span>
                      </div>
                      <Progress
                        value={student.currentGrade}
                        className="h-1 mt-1.5"
                        indicatorClassName={student.currentGrade < 60 ? 'bg-destructive' : 'bg-warning'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">All students are performing well!</p>
              </div>
            )}
          </Panel>
        </div>

        {/* ── Alerts Panel ─────────────────────────────────── */}
        <Panel
          title="Recent Alerts"
          description="Notifications requiring your attention"
          action={
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              <span>{MOCK_TEACHER_ALERTS.filter(a => a.type === 'urgent').length} urgent</span>
            </div>
          }
        >
          <div className="divide-y">
            {MOCK_TEACHER_ALERTS.slice(0, 6).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-xl leading-none mt-0.5">{alert.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{alert.courseLabel}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={cn(
                  'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full',
                  alert.type === 'urgent'  ? 'bg-red-100 text-red-700' :
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                                             'bg-blue-100 text-blue-700'
                )}>
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
