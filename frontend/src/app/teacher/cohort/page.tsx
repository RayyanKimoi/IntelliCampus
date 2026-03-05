'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  Users, BarChart2, TrendingDown, TrendingUp, Loader2, AlertCircle,
  Trophy, Target,
} from 'lucide-react';
import { MOCK_COHORT_DATA } from '@/lib/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

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
  totalXP: number; level: number;
}
interface CohortData {
  masteryByTopic: TopicMastery[];
  topicAccuracy: TopicAccuracy[];
  studentRanking: StudentRank[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'heatmap' | 'accuracy' | 'ranking'>('heatmap');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await teacherService.getCohortAnalytics();
      const d = result as any;
      const hasData = d?.masteryByTopic?.length > 0 || d?.studentRanking?.length > 0;
      setData(hasData ? result : MOCK_COHORT_DATA);
    } catch { setData(MOCK_COHORT_DATA); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived
  const weakTopics = data?.masteryByTopic.filter(t => t.avgMastery < 50) ?? [];
  const strongTopics = data?.masteryByTopic.filter(t => t.avgMastery >= 70) ?? [];

  const views = [
    { id: 'heatmap' as const, label: 'Mastery Heatmap', icon: <Target className="w-4 h-4" /> },
    { id: 'accuracy' as const, label: 'Topic Accuracy', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'ranking' as const, label: 'Student Ranking', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cohort Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyse class-wide mastery, topic performance and student rankings.</p>
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

            {/* Tabs */}
            <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
              {views.map(v => (
                <button key={v.id} onClick={() => setActiveView(v.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${activeView === v.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {v.icon} {v.label}
                </button>
              ))}
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
                <h2 className="text-base font-semibold text-foreground">Student XP Ranking</h2>
                {data.studentRanking.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No ranking data available.</p>
                ) : (
                  <div className="space-y-2">
                    {data.studentRanking.slice(0, 30).map(student => (
                      <div key={student.userId}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all
                          ${student.rank <= 3 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800' : 'border-border hover:bg-muted/40'}`}>
                        <div className="w-8 text-center">
                          {MEDAL[student.rank] ? (
                            <span className="text-lg">{MEDAL[student.rank]}</span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">#{student.rank}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground">Level {student.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{student.totalXP.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
