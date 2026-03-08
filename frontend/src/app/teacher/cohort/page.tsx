'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  Users, BarChart2, TrendingDown, TrendingUp, Loader2, AlertCircle,
  Trophy, Target, Search, ArrowUpDown, BookOpen, ChevronLeft,
} from 'lucide-react';
import { MOCK_COHORT_DATA, MOCK_TEACHER_COURSES } from '@/lib/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// ───────────────────────────── Types
interface TopicMastery {
  topicId: string; topicName: string;
  avgMastery: number; studentCount: number;
}
interface TopicAccuracy {
  topicId: string; topicName: string;
  avgScore: number; attempts: number;
}
interface StudentRank {
  rank: number; userId: string; name: string;
  rollNumber: string; mastery: number; trend: number;
}
interface CohortData {
  masteryByTopic: TopicMastery[];
  topicAccuracy: TopicAccuracy[];
  studentRanking: StudentRank[];
}
interface Subject {
  id: string;
  name: string;
  description?: string;
  studentCount?: number;
  avgMastery?: number;
}

// ───────────────────────────── Helpers
function masteryColour(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

function barColour(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ───────────────────────────── Page
export default function CohortIntelligencePage() {
  const [data, setData] = useState<CohortData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'heatmap' | 'accuracy' | 'ranking'>('heatmap');
  
  // Student ranking filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'mastery-asc' | 'mastery-desc'>('default');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const courses = MOCK_TEACHER_COURSES as any[];
      console.log('[Cohort] Loading subjects, found:', courses.length, 'courses');
      const subjectList = courses.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        studentCount: c.enrolledStudents || Math.floor(Math.random() * 50) + 30,
        avgMastery: c.avgMastery || Math.floor(Math.random() * 30) + 60,
      }));
      setSubjects(subjectList);
      console.log('[Cohort] Subjects loaded:', subjectList.length);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      // Always use mock data for now - in production this would call the API
      console.log('[Cohort] Loading mock data for subject:', selectedSubject.name);
      console.log('[Cohort] MOCK_COHORT_DATA:', MOCK_COHORT_DATA);
      setData(MOCK_COHORT_DATA);
    } catch (err) {
      console.error('Error loading cohort data:', err);
      setData(MOCK_COHORT_DATA);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    console.log('[Cohort] useEffect - selectedSubject:', selectedSubject);
    console.log('[Cohort] useEffect - subjects length:', subjects.length);
    
    if (!selectedSubject) {
      loadSubjects();
    } else {
      loadData();
    }
  }, [selectedSubject, loadSubjects, loadData]);

  // Derived
  const weakTopics = data?.masteryByTopic.filter(t => t.avgMastery < 50) ?? [];
  const strongTopics = data?.masteryByTopic.filter(t => t.avgMastery >= 70) ?? [];

  // Filtered and sorted student ranking
  const filteredAndSortedStudents = useMemo(() => {
    if (!data?.studentRanking) return [];
    
    // Filter by search query
    let filtered = data.studentRanking.filter(student => {
      const query = searchQuery.toLowerCase();
      return (
        student.name.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query)
      );
    });
    
    // Sort
    let sorted = [...filtered];
    if (sortBy === 'mastery-asc') {
      sorted.sort((a, b) => a.mastery - b.mastery);
    } else if (sortBy === 'mastery-desc') {
      sorted.sort((a, b) => b.mastery - a.mastery);
    }
    // For 'default', keep original order (already sorted by mastery desc)
    
    // Update ranks based on sorted order
    return sorted.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }, [data?.studentRanking, searchQuery, sortBy]);

  const views = [
    { id: 'heatmap' as const, label: 'Mastery Heatmap', icon: <Target className="w-4 h-4" /> },
    { id: 'accuracy' as const, label: 'Topic Accuracy', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'ranking' as const, label: 'Student Ranking', icon: <Trophy className="w-4 h-4" /> },
  ];

  // ───────────────────────────── SUBJECT LIST VIEW
  if (!selectedSubject) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cohort Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a subject to analyse class-wide mastery, topic performance and student rankings.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No subjects assigned yet.</p>
            </div>
          ) : (
            <>
              {/* Subject Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {subject.name}
                        </h3>
                        {subject.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {subject.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Students</p>
                        <p className="text-lg font-bold text-foreground">{subject.studentCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Mastery</p>
                        <p className="text-lg font-bold text-primary">{subject.avgMastery}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ───────────────────────────── SUBJECT ANALYTICS VIEW
  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubject(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSubject.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Cohort Analytics</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !data ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No cohort data available yet.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{data.studentRanking.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Students</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{data.masteryByTopic.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Topics Tracked</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{weakTopics.length}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <p className="text-xs text-muted-foreground">Weak Topics</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{strongTopics.length}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <p className="text-xs text-muted-foreground">Strong Topics</p>
                </div>
              </div>
            </div>

            {/* Tabs - Centered in greyish rounded box */}
            <div className="flex justify-center">
              <div className="flex gap-1 bg-muted/60 rounded-full p-1.5 border border-border/50 shadow-sm">
                {views.map(v => (
                  <button key={v.id} onClick={() => setActiveView(v.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
                      ${activeView === v.id ? 'bg-card text-primary shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Heatmap */}
            {activeView === 'heatmap' && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-foreground">Class Mastery by Topic</h2>
                <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                  {[
                    { colour: 'bg-green-500', label: 'Strong (≥80%)' },
                    { colour: 'bg-blue-500', label: 'Good (60–79%)' },
                    { colour: 'bg-yellow-400', label: 'Fair (40–59%)' },
                    { colour: 'bg-red-400', label: 'Weak (<40%)' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded ${l.colour}`} />
                      {l.label}
                    </div>
                  ))}
                </div>
                {data.masteryByTopic.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No mastery data available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {data.masteryByTopic.map(topic => (
                      <div key={topic.topicId} className="border border-border rounded-xl p-3 hover:shadow-sm transition-shadow bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-foreground truncate">{topic.topicName}</span>
                          <span className="text-xs font-bold text-foreground ml-1 flex-shrink-0">{topic.avgMastery}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`${masteryColour(topic.avgMastery)} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.min(topic.avgMastery, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{topic.studentCount} students</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Accuracy bar chart */}
            {activeView === 'accuracy' && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-foreground">Average Score by Topic</h2>
                {data.topicAccuracy.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No accuracy data available.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={data.topicAccuracy.slice(0, 15)}
                        margin={{ top: 10, right: 10, left: 0, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="topicName"
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} domain={[0, 100]} unit="%" />
                        <Tooltip
                          formatter={(val: number) => [`${val}%`, 'Avg Score']}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                          {data.topicAccuracy.slice(0, 15).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={barColour(entry.avgScore)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground text-xs">
                            <th className="pb-2 font-medium">Topic</th>
                            <th className="pb-2 font-medium text-right">Avg Score</th>
                            <th className="pb-2 font-medium text-right">Attempts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topicAccuracy.map(t => (
                            <tr key={t.topicId} className="border-b border-border hover:bg-muted/40">
                              <td className="py-2 text-foreground">{t.topicName}</td>
                              <td className="py-2 text-right">
                                <span className={`font-semibold ${t.avgScore >= 70 ? 'text-green-600' : t.avgScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                  {t.avgScore}%
                                </span>
                              </td>
                              <td className="py-2 text-right text-muted-foreground">{t.attempts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Ranking */}
            {activeView === 'ranking' && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-foreground">Student Mastery Ranking</h2>
                
                {data.studentRanking.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No ranking data available.</p>
                ) : (
                  <>
                    {/* Search and Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by name or roll number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:w-auto">
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="mastery-desc">Mastery High → Low</SelectItem>
                            <SelectItem value="mastery-asc">Mastery Low → High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Student List */}
                    {filteredAndSortedStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No students match your search.</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredAndSortedStudents.slice(0, 30).map(student => (
                          <div key={student.userId}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer
                              ${student.rank <= 3 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800' : 'border-border hover:bg-muted/40'}`}>
                            <div className="w-8 text-center flex-shrink-0">
                              {MEDAL[student.rank] ? (
                                <span className="text-lg">{MEDAL[student.rank]}</span>
                              ) : (
                                <span className="text-sm font-bold text-muted-foreground">#{student.rank}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground">Roll No: {student.rollNumber}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div>
                                  <p className="font-bold text-primary text-lg">{student.mastery}%</p>
                                  <p className="text-xs text-muted-foreground">Mastery</p>
                                </div>
                                {student.trend !== 0 && (
                                  <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-md
                                    ${student.trend > 0 ? 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400' : 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400'}`}>
                                    {student.trend > 0 ? (
                                      <>
                                        <TrendingUp className="w-3 h-3" />
                                        <span>+{student.trend}%</span>
                                      </>
                                    ) : (
                                      <>
                                        <TrendingDown className="w-3 h-3" />
                                        <span>{student.trend}%</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
