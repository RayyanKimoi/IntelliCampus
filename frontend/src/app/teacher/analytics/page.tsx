'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Brain, TrendingUp, TrendingDown, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { MOCK_TEACHER_COURSES_LIST, MOCK_ANALYTICS_MASTERY, MOCK_ANALYTICS_SEMESTER } from '@/lib/mockData';
import { analyticsService } from '@/services/analyticsService';
import { teacherService } from '@/services/teacherService';
import dynamic from 'next/dynamic';

const TeacherPerformanceChart = dynamic(
  () => import('@/components/charts/TeacherPerformanceChart'),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded bg-muted/50" /> }
);

interface MasteryEntry {
  topicId: string;
  topicName: string;
  averageMastery: number;
  averageConfidence: number;
  studentCount: number;
}

export default function TeacherAnalyticsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [mastery, setMastery] = useState<MasteryEntry[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await teacherService.getCourses();
        const list = Array.isArray((res as any)?.data || res) ? ((res as any)?.data || res) : [];
        const finalList = list.length > 0 ? list : MOCK_TEACHER_COURSES_LIST;
        setCourses(finalList);
        if (finalList.length > 0) setSelectedCourse(finalList[0].id);
      } catch {
        setCourses(MOCK_TEACHER_COURSES_LIST);
        setSelectedCourse(MOCK_TEACHER_COURSES_LIST[0].id);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    loadMastery(selectedCourse);
  }, [selectedCourse]);

  const loadMastery = async (courseId: string) => {
    try {
      const res = await analyticsService.getClassMastery(courseId);
      const d = (res as any)?.data || res || [];
      const list = Array.isArray(d) ? d : [];
      if (list.length > 0) {
        setMastery(list);
      } else {
        // Use per-course semester data if available, else fall back to generic mock
        const semesterTopics = (MOCK_ANALYTICS_SEMESTER as any)[courseId]?.topicMastery;
        setMastery(semesterTopics ?? MOCK_ANALYTICS_MASTERY);
      }
      // Auto-populate AI insights from semester mock data
      const semesterInsights = (MOCK_ANALYTICS_SEMESTER as any)[courseId]?.aiInsights;
      if (semesterInsights?.length > 0 && insights.length === 0) {
        setInsights(semesterInsights);
      }
    } catch {
      const semesterTopics = (MOCK_ANALYTICS_SEMESTER as any)[courseId]?.topicMastery;
      setMastery(semesterTopics ?? MOCK_ANALYTICS_MASTERY);
      const semesterInsights = (MOCK_ANALYTICS_SEMESTER as any)[courseId]?.aiInsights;
      if (semesterInsights?.length > 0) setInsights(semesterInsights);
    }
  };

  const generateInsights = async () => {
    if (!selectedCourse) return;
    setGenerating(true);
    try {
      const res = await analyticsService.generateInsights(selectedCourse);
      const d = (res as any)?.data || res || [];
      setInsights(Array.isArray(d) ? d : d ? [d] : []);
    } catch { } finally { setGenerating(false); }
  };

  const avgMastery = mastery.length > 0
    ? Math.round(mastery.reduce((sum, m) => sum + m.averageMastery, 0) / mastery.length)
    : 0;

  const weakTopics = mastery.filter(m => m.averageMastery < 50);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Understand how your students are performing</p>
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgMastery}%</div>
                  <p className="text-xs text-muted-foreground">Average mastery across topics</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Topics Tracked</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mastery.length}</div>
                  <p className="text-xs text-muted-foreground">With student performance data</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">At-Risk Topics</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{weakTopics.length}</div>
                  <p className="text-xs text-muted-foreground">Below 50% average mastery</p>
                </CardContent>
              </Card>
            </div>

            {/* Mastery breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Topic Mastery Breakdown</CardTitle>
                    <CardDescription>Average mastery per topic across all students</CardDescription>
                  </div>
                  <Button onClick={generateInsights} disabled={generating} variant="outline">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                    Generate AI Insights
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mastery.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No mastery data yet for this course.</p>
                ) : (
                  <div className="space-y-4">
                    {mastery.map(m => (
                      <div key={m.topicId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.topicName}</span>
                            <span className="text-xs text-muted-foreground">({m.studentCount} students)</span>
                          </div>
                          <span className={`font-bold ${m.averageMastery < 50 ? 'text-red-500' : m.averageMastery < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {Math.round(m.averageMastery)}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              m.averageMastery < 50 ? 'bg-red-500' : m.averageMastery < 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${m.averageMastery}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            {insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Insights</CardTitle>
                  <CardDescription>Actionable recommendations based on student performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.map((insight, i) => (
                      <div key={i} className="p-4 bg-muted/50 rounded-lg border">
                        <p className="font-medium mb-1">{insight.topicName || `Insight ${i + 1}`}</p>
                        <p className="text-sm text-muted-foreground">{insight.insightText || JSON.stringify(insight)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
