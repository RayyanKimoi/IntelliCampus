'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3, Users, GraduationCap, TrendingUp, TrendingDown,
  Minus, BookOpen, Brain, Zap, Activity, Clock, CheckCircle2,
} from 'lucide-react';

interface CourseAnalytic {
  id: string;
  name: string;
  enrolled: number;
  completionRate: number;
  avgScore: number;
  trend: 'up' | 'down' | 'flat';
}

const COURSE_DATA: CourseAnalytic[] = [
  { id: '1', name: 'Computer Science 101',         enrolled: 312, completionRate: 78, avgScore: 73, trend: 'up'   },
  { id: '2', name: 'Discrete Mathematics',          enrolled: 184, completionRate: 61, avgScore: 65, trend: 'down' },
  { id: '3', name: 'Data Structures & Algorithms',  enrolled: 240, completionRate: 70, avgScore: 70, trend: 'up'   },
  { id: '4', name: 'Web Development',               enrolled: 95,  completionRate: 85, avgScore: 81, trend: 'up'   },
  { id: '5', name: 'Networking Fundamentals',        enrolled: 72,  completionRate: 55, avgScore: 58, trend: 'flat' },
];

const WEEKLY_ENGAGEMENT = [
  { day: 'Mon', sessions: 420, aiQueries: 138 },
  { day: 'Tue', sessions: 510, aiQueries: 170 },
  { day: 'Wed', sessions: 480, aiQueries: 155 },
  { day: 'Thu', sessions: 600, aiQueries: 200 },
  { day: 'Fri', sessions: 530, aiQueries: 180 },
  { day: 'Sat', sessions: 210, aiQueries: 62 },
  { day: 'Sun', sessions: 150, aiQueries: 41 },
];

const maxSessions = Math.max(...WEEKLY_ENGAGEMENT.map(w => w.sessions));

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const totalEnrolled = COURSE_DATA.reduce((s, c) => s + c.enrolled, 0);
  const avgCompletion = Math.round(COURSE_DATA.reduce((s, c) => s + c.completionRate, 0) / COURSE_DATA.length);
  const avgScore = Math.round(COURSE_DATA.reduce((s, c) => s + c.avgScore, 0) / COURSE_DATA.length);
  const totalWeeklySessions = WEEKLY_ENGAGEMENT.reduce((s, d) => s + d.sessions, 0);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Analytics</h1>
          <p className="text-muted-foreground">Platform-wide engagement, learning outcomes, and AI usage metrics.</p>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Users className="h-4 w-4 text-primary" />,            label: 'Total Enrolled',      value: loading ? '—' : totalEnrolled.toLocaleString(), sub: 'across all courses',    good: true  },
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,   label: 'Avg Completion',      value: loading ? '—' : `${avgCompletion}%`,            sub: 'course completion rate', good: avgCompletion >= 65 },
            { icon: <Brain className="h-4 w-4 text-violet-500" />,         label: 'Avg Score',           value: loading ? '—' : `${avgScore}%`,                 sub: 'institutional average',  good: avgScore >= 65 },
            { icon: <Activity className="h-4 w-4 text-amber-500" />,       label: 'Weekly Sessions',     value: loading ? '—' : totalWeeklySessions.toLocaleString(), sub: 'last 7 days', good: true },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Weekly engagement bar chart (manual) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Weekly Platform Engagement
              </CardTitle>
              <CardDescription>Daily active sessions and AI queries this week</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 w-full animate-pulse bg-muted rounded" />
              ) : (
                <div className="flex items-end gap-2 h-48 pt-4">
                  {WEEKLY_ENGAGEMENT.map(({ day, sessions, aiQueries }) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '160px', justifyContent: 'flex-end' }}>
                        <div
                          className="w-full rounded-t bg-primary/70"
                          style={{ height: `${(sessions / maxSessions) * 100}%` }}
                        />
                        <div
                          className="w-full rounded-b bg-violet-400/50"
                          style={{ height: `${(aiQueries / maxSessions) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{day}</span>
                      <span className="text-[10px] font-medium">{sessions}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/70 inline-block" />Sessions</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400/50 inline-block" />AI Queries</span>
              </div>
            </CardContent>
          </Card>

          {/* AI usage breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Usage Breakdown
              </CardTitle>
              <CardDescription>How students use the AI tutor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : (
                [
                  { label: 'Learning Mode',    pct: 48, color: '[&>*]:bg-primary'       },
                  { label: 'Hint Requests',    pct: 27, color: '[&>*]:bg-amber-500'     },
                  { label: 'Explanation',      pct: 13, color: '[&>*]:bg-violet-500'    },
                  { label: 'Assessment Prep',  pct: 8,  color: '[&>*]:bg-green-500'     },
                  { label: 'Other',            pct: 4,  color: '[&>*]:bg-muted-foreground' },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${color}`} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Course breakdown table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Performance Overview
            </CardTitle>
            <CardDescription>Enrolment, completion and average scores per course</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (
              <div className="space-y-3">
                {COURSE_DATA.map(course => (
                  <div key={course.id} className="rounded-xl border border-border bg-card px-5 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <TrendIcon trend={course.trend} />
                        <div>
                          <p className="font-medium text-sm">{course.name}</p>
                          <p className="text-xs text-muted-foreground">{course.enrolled} students enrolled</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge className={`text-xs ${course.avgScore >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : course.avgScore >= 55 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                          Avg {course.avgScore}%
                        </Badge>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">{course.completionRate}%</span>
                        </div>
                        <Progress value={course.completionRate} className={`h-1.5 ${course.completionRate >= 70 ? '[&>*]:bg-green-500' : course.completionRate >= 55 ? '[&>*]:bg-amber-500' : '[&>*]:bg-red-400'}`} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Avg Score</span>
                          <span className="font-medium">{course.avgScore}%</span>
                        </div>
                        <Progress value={course.avgScore} className={`h-1.5 ${course.avgScore >= 70 ? '[&>*]:bg-primary' : course.avgScore >= 55 ? '[&>*]:bg-amber-500' : '[&>*]:bg-red-400'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cohort breakdown */}
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: <GraduationCap className="h-5 w-5 text-primary" />, title: 'Learner Progression', items: [{ label: 'Beginner (0–40%)', val: 18 }, { label: 'Developing (40–70%)', val: 51 }, { label: 'Proficient (70–90%)', val: 23 }, { label: 'Advanced (90%+)', val: 8 }] },
            { icon: <Clock className="h-5 w-5 text-amber-500" />, title: 'Session Duration', items: [{ label: '< 10 min', val: 12 }, { label: '10–30 min', val: 38 }, { label: '30–60 min', val: 34 }, { label: '> 60 min', val: 16 }] },
            { icon: <Brain className="h-5 w-5 text-violet-500" />, title: 'AI Mode Usage', items: [{ label: 'Learning mode', val: 44 }, { label: 'Assessment mode', val: 33 }, { label: 'Hint only mode', val: 23 }] },
          ].map(({ icon, title, items }) => (
            <Card key={title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {icon}{title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map(({ label, val }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{val}%</span>
                    </div>
                    <Progress value={val} className="h-1.5 [&>*]:bg-primary/60" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
