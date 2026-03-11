'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { masteryService } from '@/services/masteryService';
import { Brain, Target, AlertTriangle, Search, TrendingUp, CheckCircle2, Zap } from 'lucide-react';

interface TopicRow {
  topicId: string;
  topicName: string;
  courseName: string;
  chapterName?: string;
  masteryLevel: number;
  attempts?: number;
  correct?: number;
  lastAssessed?: string;
}

interface MasteryData {
  overallMastery: number;
  byTopic: TopicRow[];
  weakTopics: TopicRow[];
}

function getMasteryColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return '#ef4444';
}

function getMasteryLabel(score: number) {
  if (score >= 80) return 'Mastered';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Developing';
  return 'Weak';
}

export default function StudentMasteryPage() {
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const response = await masteryService.getMyMastery() as any;
        const data = response.data || response;
        setMasteryData({
          overallMastery: data?.overallMastery ?? 0,
          byTopic: Array.isArray(data?.byTopic) ? data.byTopic : [],
          weakTopics: Array.isArray(data?.weakTopics) ? data.weakTopics : [],
        });
      } catch (error) {
        console.error('Failed to fetch mastery data', error);
        setMasteryData({ overallMastery: 0, byTopic: [], weakTopics: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchMastery();
  }, []);

  const allTopics = masteryData?.byTopic ?? [];

  // Derive unique course names from data
  const courseOptions = [...new Set(allTopics.map(t => t.courseName).filter(Boolean))].sort();

  const filteredTopics = allTopics.filter(t => {
    const matchesSearch =
      t.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.courseName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.chapterName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !selectedCourse || t.courseName === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const masteredCount = allTopics.filter(t => t.masteryLevel >= 80).length;
  const weakCount = masteryData?.weakTopics?.length ?? 0;
  const overall = Math.round(masteryData?.overallMastery ?? 0);

  return (
    <DashboardLayout requiredRole="student">
      <style jsx global>{`
        @keyframes masterySlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mastery-slide-up { animation: masterySlideUp 0.3s ease-out both; }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-6 pb-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mastery-slide-up flex items-center gap-4" style={{ animationDelay: '0ms' }}>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)' }}
          >
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mastery Tracking</h1>
            <p className="text-sm text-muted-foreground">Your proficiency across all practiced topics.</p>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div className="mastery-slide-up grid gap-4 sm:grid-cols-3" style={{ animationDelay: '60ms' }}>
          {/* Overall Mastery */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ borderColor: 'rgba(0,110,178,0.18)', boxShadow: '0 2px 16px rgba(0,110,178,0.07)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall Mastery</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,110,178,0.1)' }}>
                <Brain className="h-4 w-4" style={{ color: '#006EB2' }} />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
            ) : (
              <>
                <div className="text-3xl font-black" style={{ color: getMasteryColor(overall) }}>
                  {overall}%
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,110,178,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${overall}%`, background: `linear-gradient(90deg, ${getMasteryColor(overall)}, ${getMasteryColor(overall)}aa)` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{overall >= 80 ? 'Excellent performance' : overall >= 70 ? 'Good progress' : 'Keep practicing!'}</p>
              </>
            )}
          </div>

          {/* Topics Mastered */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 2px 16px rgba(16,185,129,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topics Mastered</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: '#10b981' }} />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
            ) : (
              <>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black" style={{ color: '#10b981' }}>{masteredCount}</span>
                  <span className="text-base font-semibold text-muted-foreground mb-0.5">/ {allTopics.length}</span>
                </div>
                <p className="text-xs text-muted-foreground">Score ≥ 80%</p>
              </>
            )}
          </div>

          {/* Weak Areas */}
          <div
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ borderColor: 'rgba(239,68,68,0.18)', boxShadow: '0 2px 16px rgba(239,68,68,0.05)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weak Areas</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <AlertTriangle className="h-4 w-4" style={{ color: '#ef4444' }} />
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
            ) : (
              <>
                <div className="text-3xl font-black" style={{ color: weakCount > 0 ? '#ef4444' : '#10b981' }}>
                  {weakCount}
                </div>
                <p className="text-xs text-muted-foreground">Score &lt; 70% — needs practice</p>
              </>
            )}
          </div>
        </div>

        {/* ── Topic Breakdown ──────────────────────────────────────────── */}
        <div
          className="mastery-slide-up rounded-2xl border overflow-hidden"
          style={{ animationDelay: '120ms', borderColor: 'rgba(0,110,178,0.13)', boxShadow: '0 4px 24px rgba(0,110,178,0.07)' }}
        >
          {/* Panel header */}
          <div
            className="px-5 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'rgba(0,110,178,0.1)', backgroundColor: 'rgba(0,47,76,0.02)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#006EB2' }} />
              <h2 className="font-bold text-sm tracking-wide text-foreground">Topic Breakdown</h2>
              {!loading && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(0,110,178,0.1)', color: '#006EB2' }}
                  >
                    {filteredTopics.length} topics
                  </span>
                )}
            </div>
            {/* Course filter + Search */}
            <div className="flex gap-2">
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="rounded-xl border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors"
                style={{ borderColor: 'rgba(0,110,178,0.2)', minWidth: '140px' }}
                onFocus={e => (e.target.style.borderColor = '#006EB2')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,110,178,0.2)')}
              >
                <option value="">All courses</option>
                {courseOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search topics…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-44 rounded-xl border bg-background pl-8 pr-3 py-2 text-sm text-foreground outline-none transition-colors"
                  style={{ borderColor: 'rgba(0,110,178,0.2)' }}
                  onFocus={e => (e.target.style.borderColor = '#006EB2')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,110,178,0.2)')}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl p-3" style={{ backgroundColor: 'rgba(0,110,178,0.03)' }}>
                    <div className="h-10 w-10 rounded-full animate-pulse bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                    </div>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Brain className="h-10 w-10 opacity-30" style={{ color: '#006EB2' }} />
                {allTopics.length === 0 ? (
                  <>
                    <p className="font-semibold text-sm">No mastery data yet</p>
                    <p className="text-xs text-center max-w-xs leading-relaxed">
                      Complete a quiz in the <strong className="text-foreground">Practice</strong> tab to start building your mastery profile.
                    </p>
                  </>
                ) : (
                  <p className="text-sm">No topics match your search.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTopics.map((topic, idx) => {
                  const color = getMasteryColor(topic.masteryLevel);
                  const label = getMasteryLabel(topic.masteryLevel);
                  const isWeak = topic.masteryLevel < 70;
                  const isMastered = topic.masteryLevel >= 80;
                  return (
                    <div
                      key={topic.topicId}
                      className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors"
                      style={{
                        borderColor: isWeak ? 'rgba(239,68,68,0.15)' : isMastered ? 'rgba(16,185,129,0.15)' : 'rgba(0,110,178,0.1)',
                        backgroundColor: isWeak ? 'rgba(239,68,68,0.02)' : isMastered ? 'rgba(16,185,129,0.02)' : 'rgba(0,110,178,0.01)',
                      }}
                    >
                      {/* Rank / score bubble */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{ border: `2px solid ${color}`, color, backgroundColor: `${color}15` }}
                      >
                        {Math.round(topic.masteryLevel)}%
                      </div>

                      {/* Topic info + bar */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{topic.topicName}</p>
                          {isWeak && <Zap className="h-3 w-3 shrink-0" style={{ color: '#ef4444' }} />}
                          {isMastered && <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: '#10b981' }} />}
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,110,178,0.08)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${topic.masteryLevel}%`, backgroundColor: color, transitionDelay: `${idx * 40}ms` }}
                          />
                        </div>
                        {(topic.courseName || topic.chapterName) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {topic.courseName}
                            {topic.chapterName ? <span className="opacity-60"> · {topic.chapterName}</span> : null}
                          </p>
                        )}
                      </div>

                      {/* Right side: label + attempts */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {label}
                        </span>
                        {topic.attempts != null && (
                          <span className="text-[10px] text-muted-foreground">
                            {topic.correct ?? 0}/{topic.attempts} correct
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



