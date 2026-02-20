'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Panel } from '@/components/panels/Panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';
import { masteryService } from '@/services/masteryService';
import { aiService } from '@/services/aiService';
import {
  BookOpen,
  Brain,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Zap,
  AlertTriangle,
  Target,
  Sparkles,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  name: string;
  subjectName?: string;
  courseName?: string;
}

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface AnswerRecord {
  questionId: string;
  questionText: string;
  selected: string;
  correct: boolean;
  topicId: string;
  topicName: string;
}

type View = 'select' | 'quiz' | 'results' | 'adaptive';
type PracticeMode = 'curriculum' | 'adaptive';

const OPTIONS: { key: string; label: string }[] = [
  { key: 'A', label: 'optionA' },
  { key: 'B', label: 'optionB' },
  { key: 'C', label: 'optionC' },
  { key: 'D', label: 'optionD' },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function getMasteryColor(pct: number) {
  if (pct >= 80) return 'text-success';
  if (pct >= 60) return 'text-warning';
  return 'text-danger';
}

function getMasteryBg(pct: number) {
  if (pct >= 80) return 'bg-success/10 border-success/30';
  if (pct >= 60) return 'bg-warning/10 border-warning/30';
  return 'bg-danger/10 border-danger/30';
}

// ─────────────────────────────────────────────────────────────────
// AnimatedScore
// ─────────────────────────────────────────────────────────────────

function AnimatedScore({ value, max }: { value: number; max: number }) {
  const [displayed, setDisplayed] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  useEffect(() => {
    let start = 0;
    const step = () => {
      start += 2;
      setDisplayed(Math.min(start, pct));
      if (start < pct) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [pct]);
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'font-mono text-7xl font-black tabular-nums',
          getMasteryColor(displayed)
        )}
      >
        {displayed}
        <span className="text-3xl text-muted-foreground">%</span>
      </span>
      <span className="mt-1 text-sm text-muted-foreground">
        {value} / {max} correct
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HintPanel
// ─────────────────────────────────────────────────────────────────

function HintPanel({ question, topicId }: { question: Question; topicId: string }) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchHint = async () => {
    setLoading(true);
    try {
      const res = await aiService.chat({
        courseId: 'general',
        topicId,
        message: `Give me a short hint (1-2 sentences) for this question WITHOUT revealing the answer: "${question.questionText}"`,
        mode: 'practice',
      });
      const d = (res as any)?.data || res;
      setHint((d as any)?.reply || (d as any)?.answer || "Think about the core concept behind this question.");
      setVisible(true);
    } catch {
      setHint("Think about the core concept behind this question.");
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!visible ? (
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHint}
          disabled={loading}
          className="w-full border-dashed border-amber-400/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Get AI Hint
        </Button>
      ) : (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-800/50 px-4 py-3 flex gap-3 animate-fade-in">
          <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">AI Hint</p>
            <p className="text-sm text-foreground/80">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [view, setView] = useState<View>('select');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('curriculum');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [weakTopicsAdaptive, setWeakTopicsAdaptive] = useState<Topic[]>([]);
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isAdaptive, setIsAdaptive] = useState(false);

  // Results
  const [weakTopics, setWeakTopics] = useState<{ topicId: string; topicName: string; wrong: number }[]>([]);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  // Load weak topics when adaptive mode selected
  useEffect(() => {
    if (practiceMode !== 'adaptive' || weakTopicsAdaptive.length > 0) return;
    let cancelled = false;
    async function load() {
      setLoadingAdaptive(true);
      try {
        const res = await masteryService.getWeakTopics() as any;
        const raw: any[] = res?.data ?? res ?? [];
        if (!cancelled && Array.isArray(raw)) {
          setWeakTopicsAdaptive(
            raw.map((t) => ({
              id: t.topicId ?? t.id,
              name: t.topicName ?? t.name,
              subjectName: t.subjectName,
              courseName: t.courseName,
            }))
          );
        }
      } catch {
        if (!cancelled) setWeakTopicsAdaptive([]);
      } finally {
        if (!cancelled) setLoadingAdaptive(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [practiceMode]);

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      // First try masteryService weak topics as seed
      const weakRes = await masteryService.getMyMastery();
      const masteryData = (weakRes as any)?.data || weakRes;
      const byTopic: any[] = masteryData?.byTopic || [];

      if (byTopic.length > 0) {
        setTopics(
          byTopic.map((t: any) => ({
            id: t.topicId,
            name: t.topicName,
            subjectName: t.subjectName,
            courseName: t.courseName,
          }))
        );
        setLoadingTopics(false);
        return;
      }

      // Fallback: crawl curriculum
      const courses = await curriculumService.getCourses();
      const courseList: any[] = (courses as any)?.data || courses || [];
      const allTopics: Topic[] = [];
      for (const c of Array.isArray(courseList) ? courseList : []) {
        try {
          const subjects = await curriculumService.getSubjects(c.id);
          const subList: any[] = (subjects as any)?.data || subjects || [];
          for (const s of Array.isArray(subList) ? subList : []) {
            try {
              const topicsRes = await curriculumService.getTopics(s.id);
              const topicList: any[] = (topicsRes as any)?.data || topicsRes || [];
              allTopics.push(
                ...(Array.isArray(topicList) ? topicList : []).map((t: any) => ({
                  id: t.id,
                  name: t.name || t.title,
                  subjectName: s.name || s.title,
                  courseName: c.title || c.name,
                }))
              );
            } catch {}
          }
        } catch {}
      }
      setTopics(allTopics);
    } catch {}
    finally { setLoadingTopics(false); }
  };

  const startQuiz = async (topic: Topic, adaptive = false) => {
    setLoadingQuiz(true);
    setSelectedTopic(topic);
    setIsAdaptive(adaptive);
    try {
      const res = await gamificationService.startSprintQuiz(topic.id);
      const d = (res as any)?.data || res;
      const qs: Question[] = d?.questions || d || [];
      setQuestions(Array.isArray(qs) ? qs : []);
      setCurrentIdx(0);
      setAnswers([]);
      setChosen(null);
      setRevealed(false);
      setXpEarned(0);
      setView('quiz');
    } catch (err: any) {
      alert(err?.message || 'Failed to start quiz. Please try again.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelect = (optionKey: string) => {
    if (revealed) return;
    setChosen(optionKey);
  };

  const handleConfirm = async () => {
    if (!chosen || !selectedTopic) return;
    const q = questions[currentIdx];
    setRevealed(true);

    let correct = false;
    try {
      const res = await gamificationService.submitSprintAnswer({
        questionId: q.id,
        selectedOption: chosen,
        timeTaken: 30,
      });
      const d = (res as any)?.data || res;
      correct = !!d?.correct;
      if (correct) setXpEarned((x) => x + (d?.xpAwarded || 10));
    } catch {}

    setAnswers((prev) => [
      ...prev,
      {
        questionId: q.id,
        questionText: q.questionText,
        selected: chosen,
        correct,
        topicId: selectedTopic.id,
        topicName: selectedTopic.name,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setChosen(null);
      setRevealed(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    // Compute weak topics from wrong answers
    const wrongMap: Record<string, { topicId: string; topicName: string; wrong: number }> = {};
    for (const a of answers) {
      if (!a.correct) {
        if (!wrongMap[a.topicId]) wrongMap[a.topicId] = { topicId: a.topicId, topicName: a.topicName, wrong: 0 };
        wrongMap[a.topicId].wrong += 1;
      }
    }
    // Add current question if not confirmed yet
    setWeakTopics(Object.values(wrongMap).sort((a, b) => b.wrong - a.wrong));
    setView('results');
  };

  const correctCount = answers.filter((a) => a.correct).length;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  // ─── VIEW: SELECT ──────────────────────────────────────────────
  if (view === 'select') {
    const adaptiveTopicList = weakTopicsAdaptive.length > 0 ? weakTopicsAdaptive : topics.slice(0, 6);

    return (
      <DashboardLayout requiredRole="student">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Practice Tests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fear-free practice with AI hints. No pressure — just learning.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
            {([
              { id: 'curriculum', label: 'Curriculum Quiz', icon: BookOpen },
              { id: 'adaptive', label: 'Adaptive Quiz', icon: Brain },
            ] as { id: PracticeMode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPracticeMode(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  practiceMode === id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Info banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              {practiceMode === 'curriculum' ? (
                <>
                  <p className="font-semibold text-primary">Curriculum Quiz</p>
                  <p className="text-muted-foreground mt-0.5">
                    Pick any topic from your curriculum and practice at your own pace. AI hints available anytime.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-primary">Adaptive Quiz</p>
                  <p className="text-muted-foreground mt-0.5">
                    AI-selected topics based on your weakest areas. Targeted practice to close your knowledge gaps fastest.
                  </p>
                </>
              )}
            </div>
          </div>

          {practiceMode === 'curriculum' ? (
            <Panel title="Choose a Topic">
              {loadingTopics ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No topics available yet. Enroll in a course first.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => startQuiz(topic)}
                      disabled={loadingQuiz}
                      className="group relative flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left
                                 transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className="flex items-center justify-between">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm font-semibold mt-1">{topic.name}</p>
                      {(topic.subjectName || topic.courseName) && (
                        <p className="text-xs text-muted-foreground">
                          {topic.subjectName}{topic.courseName ? ` · ${topic.courseName}` : ''}
                        </p>
                      )}
                      {loadingQuiz && selectedTopic?.id === topic.id && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-card/80">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="Adaptive Topics — Your Weakest Areas">
              {loadingAdaptive ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : adaptiveTopicList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
                  <p className="text-sm font-medium">No weak topics detected!</p>
                  <p className="text-xs mt-1">Switch to Curriculum Quiz to practice any topic.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weakTopicsAdaptive.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No mastery data yet — showing curriculum topics. Practice more to unlock adaptive recommendations.
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {adaptiveTopicList.map((topic, idx) => (
                      <button
                        key={topic.id}
                        onClick={() => startQuiz(topic, true)}
                        disabled={loadingQuiz}
                        className="group relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left
                                   transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{topic.name}</p>
                          {(topic.subjectName || topic.courseName) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {topic.subjectName}{topic.courseName ? ` · ${topic.courseName}` : ''}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        {loadingQuiz && selectedTopic?.id === topic.id && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-card/80">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => startQuiz(adaptiveTopicList[0], true)}
                    disabled={loadingQuiz}
                  >
                    {loadingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Start Adaptive Quiz on &ldquo;{adaptiveTopicList[0]?.name}&rdquo;
                  </Button>
                </div>
              )}
            </Panel>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── VIEW: QUIZ ────────────────────────────────────────────────
  if (view === 'quiz') {
    const q = questions[currentIdx];
    if (!q) return null;
    const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

    return (
      <DashboardLayout requiredRole="student">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('select')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              {isAdaptive && (
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                  <Brain className="mr-1 h-3 w-3" /> Adaptive
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {currentIdx + 1} / {questions.length}
              </span>
              {xpEarned > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">
                  <Zap className="mr-1 h-3 w-3 text-yellow-500" />+{xpEarned} XP
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1.5" />

          {/* Topic label */}
          {selectedTopic && (
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {selectedTopic.name}
            </p>
          )}

          {/* Question card */}
          <div
            key={q.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            style={{ animation: 'slideInUp 0.25s ease-out' }}
          >
            <p className="text-base font-medium leading-relaxed">{q.questionText}</p>

            <div className="mt-5 space-y-2.5">
              {OPTIONS.map(({ key, label }) => {
                const optionText = (q as any)[label] as string;
                if (!optionText) return null;

                const isSelected = chosen === key;
                const isCorrectReveal = revealed && isSelected && answers[answers.length]?.correct;
                // We can't know correct answer from API (it's not returned), so we just highlight selected
                // and show whether it was correct after submit
                const lastAnswer = revealed ? answers[answers.length - 1] ?? null : null;
                const isWrong = revealed && isSelected && lastAnswer && !lastAnswer.correct;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    disabled={revealed}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all',
                      !revealed && !isSelected && 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
                      !revealed && isSelected && 'border-primary bg-primary/10 text-primary',
                      revealed && isSelected && lastAnswer?.correct && 'border-success bg-success/10 text-success',
                      revealed && isSelected && !lastAnswer?.correct && 'border-danger bg-danger/10 text-danger',
                      revealed && !isSelected && 'border-border bg-muted/30 opacity-50',
                    )}
                    style={isSelected ? { transition: 'all 0.15s ease' } : {}}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        !isSelected && 'border-border text-muted-foreground',
                        isSelected && !revealed && 'border-primary text-primary',
                        revealed && isSelected && lastAnswer?.correct && 'border-success bg-success text-white',
                        revealed && isSelected && !lastAnswer?.correct && 'border-danger bg-danger text-white',
                      )}
                    >
                      {key}
                    </span>
                    <span className="flex-1">{optionText}</span>
                    {revealed && isSelected && lastAnswer?.correct && (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    )}
                    {revealed && isSelected && !lastAnswer?.correct && (
                      <XCircle className="h-5 w-5 text-danger shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Hint */}
            {selectedTopic && <HintPanel question={q} topicId={selectedTopic.id} />}

            {/* Action buttons */}
            <div className="mt-5 flex justify-end gap-3">
              {!revealed ? (
                <Button onClick={handleConfirm} disabled={!chosen} className="px-6">
                  Confirm Answer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="px-6">
                  {currentIdx + 1 < questions.length ? 'Next Question' : 'See Results'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  // ─── VIEW: RESULTS ─────────────────────────────────────────────
  if (view === 'results') {
    return (
      <DashboardLayout requiredRole="student">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Score hero */}
          <div
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
            style={{ animation: 'slideInUp 0.3s ease-out' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {isAdaptive ? 'Adaptive Quiz Complete' : 'Practice Complete'}
            </p>
            <AnimatedScore value={correctCount} max={answers.length} />
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" /> {correctCount} correct
              </span>
              <span className="flex items-center gap-1.5 text-danger">
                <XCircle className="h-4 w-4" /> {answers.length - correctCount} wrong
              </span>
              {xpEarned > 0 && (
                <span className="flex items-center gap-1.5 text-yellow-500">
                  <Zap className="h-4 w-4" /> +{xpEarned} XP
                </span>
              )}
            </div>

            {/* Motivational message */}
            <p className="mt-5 text-sm text-muted-foreground">
              {pct === 100
                ? '🎉 Perfect score! Outstanding!'
                : pct >= 80
                ? '🌟 Great work! You\'re doing really well.'
                : pct >= 60
                ? '📚 Good effort! A bit more practice and you\'ll nail it.'
                : '💡 Keep going — the adaptive quiz below will help strengthen your weak spots.'}
            </p>
          </div>

          {/* Question breakdown */}
          <Panel title="Question Breakdown">
            <div className="space-y-3">
              {answers.map((a, idx) => (
                <div
                  key={a.questionId}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3',
                    a.correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
                  )}
                  style={{ animation: `slideInUp ${0.1 + idx * 0.04}s ease-out` }}
                >
                  {a.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{a.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your answer: <span className="font-semibold">{a.selected}</span>
                      {' · '}{a.topicName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Weak topics + Adaptive CTA */}
          {weakTopics.length > 0 && (
            <div
              className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4"
              style={{ animation: 'slideInUp 0.4s ease-out' }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold">Detected Weak Areas</h3>
              </div>
              <div className="space-y-2">
                {weakTopics.map((wt) => (
                  <div key={wt.topicId} className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-3">
                    <span className="text-sm font-medium">{wt.topicName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {wt.wrong} wrong
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-sm">Adaptive Quiz Ready</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We&apos;ve identified your weakest topic: <strong>{weakTopics[0].topicName}</strong>.
                  Take a focused adaptive quiz to reinforce these concepts.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    const wt = weakTopics[0];
                    const t = topics.find((t) => t.id === wt.topicId) || { id: wt.topicId, name: wt.topicName };
                    startQuiz(t, true);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Adaptive Quiz on &ldquo;{weakTopics[0].topicName}&rdquo;
                </Button>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView('select')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Choose Another Topic
            </Button>
            {selectedTopic && (
              <Button className="flex-1" onClick={() => startQuiz(selectedTopic, false)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry This Topic
              </Button>
            )}
          </div>
        </div>
        <style jsx global>{`
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </DashboardLayout>
    );
  }

  return null;
}
