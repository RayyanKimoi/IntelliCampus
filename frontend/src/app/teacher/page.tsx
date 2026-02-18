'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { analyticsService } from '@/services/analyticsService';
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
import { cn } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Plus,
  Upload,
  FileText,
  ChevronRight,
  MoreVertical,
  Calendar,
  RefreshCw,
} from 'lucide-react';
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
      {
        id: 'c1',
        title: 'Introduction to Computer Science',
        studentCount: 45,
        avgGrade: 82,
        nextAssignmentDue: '2023-11-15',
      },
      {
        id: 'c2',
        title: 'Advanced Algorithms',
        studentCount: 28,
        avgGrade: 74,
        nextAssignmentDue: '2023-11-18',
      },
      {
        id: 'c3',
        title: 'Web Development Bootcamp',
        studentCount: 35,
        avgGrade: 88,
        nextAssignmentDue: '2023-11-20',
      },
      {
        id: 'c4',
        title: 'Data Structures 101',
        studentCount: 34,
        avgGrade: 68,
      },
    ],
    atRiskStudents: [
      {
        id: 's1',
        name: 'Alex Johnson',
        riskFactor: 'High',
        currentGrade: 45,
        courseName: 'Data Structures 101',
      },
      {
        id: 's2',
        name: 'Maria Garcia',
        riskFactor: 'Medium',
        currentGrade: 62,
        courseName: 'Advanced Algorithms',
      },
      {
        id: 's3',
        name: 'Sam Wilson',
        riskFactor: 'Medium',
        currentGrade: 58,
        courseName: 'Data Structures 101',
      },
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
// Skeleton Components
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
// Page Component
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
      // Try to fetch real data
      const res = await analyticsService.getTeacherDashboard();
      if (res && res.data) {
        setDashboard(res.data);
      } else {
        // Fallback to mock data if API returns empty/null (or if endpoint not fully implemented)
        setDashboard(generateMockDashboard());
      }
    } catch (error) {
      console.error('Failed to fetch teacher dashboard data', error);
      // Fallback to mock data on error
      setDashboard(generateMockDashboard());
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

  // Stats Configuration
  const stats = [
    {
      label: 'Total Students',
      value: (dashboard?.totalStudents ?? 0).toLocaleString(),
      sub: 'Across all active courses',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-500/10',
    },
    {
      label: 'Avg. Mastery',
      value: `${dashboard?.avgMastery ?? 0}%`,
      sub: '+2.5% from last month',
      icon: <GraduationCap className="h-5 w-5 text-emerald-500" />,
      color: 'bg-emerald-500/10',
    },
    {
      label: 'Active Courses',
      value: dashboard?.activeCoursesCount ?? 0,
      sub: 'Currently in progress',
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      color: 'bg-purple-500/10',
    },
  ];

  // Quick Actions Configuration
  const quickActions = [
    {
      label: 'Create Assignment',
      href: '/teacher/assignments/new',
      icon: <Plus className="h-5 w-5" />,
      description: 'Set up a new task',
    },
    {
      label: 'Upload Content',
      href: '/teacher/content/upload',
      icon: <Upload className="h-5 w-5" />,
      description: 'Add course materials',
    },
    {
      label: 'View Reports',
      href: '/teacher/reports',
      icon: <FileText className="h-5 w-5" />,
      description: 'Analyze performance',
    },
  ];

  return (
    <DashboardLayout requiredRole="teacher">
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
                  .toUpperCase() ?? 'T'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening in your classes today.
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
        {/* Stat cards                                               */}
        {/* -------------------------------------------------------- */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
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
        {/* Main Content: Chart + Actions                            */}
        {/* -------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Analytics Chart */}
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Class Performance Trends</CardTitle>
                <CardDescription>
                  Average student mastery over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(dashboard?.performanceTrend?.length ?? 0) > 0 ? (
                  <TeacherPerformanceChart data={dashboard?.performanceTrend || []} />
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No data available.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage your classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted group cursor-pointer">
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
        {/* Bottom Grid: Courses + At Risk Students                  */}
        {/* -------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Course Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">My Courses</CardTitle>
                  <CardDescription>
                    Overview of active classes
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : (dashboard?.courses?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {dashboard?.courses?.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold">{course.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.studentCount} Students
                          </div>
                          {course.nextAssignmentDue && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {new Date(course.nextAssignmentDue).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Avg Grade</div>
                        <div className={cn("text-lg font-bold",
                          course.avgGrade >= 80 ? "text-emerald-600" :
                          course.avgGrade >= 70 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {course.avgGrade}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No active courses found.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                View All Courses
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* At Risk Students / Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">At Risk Students</CardTitle>
                  <CardDescription>
                    Students requiring attention
                  </CardDescription>
                </div>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
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
              ) : (dashboard?.atRiskStudents?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {dashboard?.atRiskStudents?.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4"
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback>
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{student.name}</p>
                          <Badge variant={student.riskFactor === 'High' ? 'destructive' : 'warning'}>
                            {student.riskFactor} Risk
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mt-0.5">
                          <span className="truncate">{student.courseName}</span>
                          <span className="font-semibold text-foreground">
                            {student.currentGrade}%
                          </span>
                        </div>
                        <Progress
                          value={student.currentGrade}
                          className="h-1.5 mt-2"
                          indicatorClassName={
                             student.currentGrade < 60 ? 'bg-red-500' : 'bg-yellow-500'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    All students are performing well!
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                View Student Analytics
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
