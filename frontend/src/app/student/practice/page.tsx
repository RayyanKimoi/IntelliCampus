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
import { MOCK_PRACTICE_TOPICS, MOCK_ADAPTIVE_TOPICS, MOCK_QUIZ_QUESTIONS } from '@/lib/mockData';
import {
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
  TrendingUp,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Types
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

type View = 'select' | 'quiz' | 'results';
type PracticeMode = 'curriculum' | 'adaptive';

const OPTIONS: { key: string; label: string }[] = [
  { key: 'A', label: 'optionA' },
  { key: 'B', label: 'optionB' },
  { key: 'C', label: 'optionC' },
  { key: 'D', label: 'optionD' },
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getScoreColor(pct: number) {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(pct: number) {
  if (pct === 100) return { emoji: '🏆', msg: 'Perfect score! Absolutely outstanding!' };
  if (pct >= 80)  return { emoji: '🌟', msg: "Great work! You're mastering this topic." };
  if (pct >= 60)  return { emoji: '📚', msg: "Good effort! A bit more practice and you'll nail it." };
  return { emoji: '💡', msg: 'Keep going — the adaptive quiz below will help close your gaps.' };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AnimatedScore
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AnimatedScore({ value, max }: { value: number; max: number }) {
  const [displayed, setDisplayed] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const duration = 900;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * pct));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [pct]);

  const color = getScoreColor(displayed);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center w-36 h-36 rounded-full"
        style={{
          background: `conic-gradient(${color} ${displayed * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
          boxShadow: `0 0 32px ${color}33`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-white dark:bg-card flex flex-col items-center justify-center">
          <span className="font-black text-4xl tabular-nums leading-none" style={{ color }}>
            {displayed}
            <span className="text-xl" style={{ color: 'hsl(var(--muted-foreground))' }}>%</span>
          </span>
        </div>
      </div>
      <span className="mt-3 text-sm text-muted-foreground font-medium">
        {value} / {max} correct
      </span>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HintPanel
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      setHint((d as any)?.reply || (d as any)?.answer || 'Think about the core concept behind this question.');
      setVisible(true);
    } catch {
      setHint('Think about the core concept behind this question.');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      {!visible ? (
        <button
          onClick={fetchHint}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{ borderColor: 'rgba(245,158,11,0.35)', color: '#b45309', backgroundColor: 'rgba(245,158,11,0.05)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
          {loading ? 'Asking AI…' : 'Get AI Hint'}
        </button>
      ) : (
        <div
          className="rounded-xl border px-4 py-3.5 flex gap-3"
          style={{ backgroundColor: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.3)', animation: 'practiceSlideDown 0.3s ease-out' }}
        >
          <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#d97706' }}>AI Hint</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// ─────────────────────────────────────────────────────────────────────────────
// AnimatedGenerateButton
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedGenerateButtonProps {
  labelIdle: string;
  labelActive: string;
  generating: boolean;
  highlightHueDeg?: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

function AnimatedGenerateButton({
  labelIdle,
  labelActive,
  generating,
  highlightHueDeg = 210,
  disabled = false,
  onClick,
  className,
}: AnimatedGenerateButtonProps) {
  const hue = highlightHueDeg;
  return (
    <div className={className}>
      <button
        onClick={onClick}
        disabled={disabled || generating}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        style={{
          background: generating
            ? `hsl(${hue}, 70%, 35%)`
            : `linear-gradient(135deg, hsl(${hue}, 80%, 30%), hsl(${hue}, 70%, 44%))`,
          boxShadow: generating ? 'none' : `0 4px 18px hsl(${hue} 70% 35% / 0.35)`,
        }}
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {generating ? labelActive : labelIdle}
      </button>
    </div>
  );
}

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
  const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null);

  // Results
  const [weakTopics, setWeakTopics] = useState<{ topicId: string; topicName: string; wrong: number }[]>([]);

  // Completed topics (per session)
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

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
        if (!cancelled) {
          setWeakTopicsAdaptive(prev => prev.length === 0 ? MOCK_ADAPTIVE_TOPICS : prev);
          setLoadingAdaptive(false);
        }
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
    finally {
      // Fall back to mock topics if nothing loaded from API
      setTopics(prev => prev.length === 0 ? MOCK_PRACTICE_TOPICS : prev);
      setLoadingTopics(false);
    }
  };

  const startQuiz = async (topic: Topic, adaptive = false) => {
    setLoadingQuiz(true);
    setSelectedTopic(topic);
    setIsAdaptive(adaptive);
    try {
      const res = await gamificationService.startSprintQuiz(topic.id);
      const d = (res as any)?.data || res;
      const qs: Question[] = d?.questions || d || [];
      const questionsToUse = Array.isArray(qs) && qs.length > 0 ? qs : MOCK_QUIZ_QUESTIONS;
      setQuestions(questionsToUse);
      setCurrentIdx(0);
      setAnswers([]);
      setChosen(null);
      setRevealed(false);
      setXpEarned(0);
      setAnswerAnim(null);
      setView('quiz');
    } catch {
      // API failed — use mock questions so the quiz still works
      setQuestions(MOCK_QUIZ_QUESTIONS);
      setCurrentIdx(0);
      setAnswers([]);
      setChosen(null);
      setRevealed(false);
      setXpEarned(0);
      setAnswerAnim(null);
      setView('quiz');
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
    } catch {
      // Check locally against mock questions
      const mockQ = MOCK_QUIZ_QUESTIONS.find(mq => mq.id === q.id);
      correct = mockQ ? (mockQ as any).correctOption === chosen : false;
      if (correct) setXpEarned(x => x + 15);
    }

    setAnswerAnim(correct ? 'correct' : 'wrong');
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
      setAnswerAnim(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const wrongMap: Record<string, { topicId: string; topicName: string; wrong: number }> = {};
    for (const a of answers) {
      if (!a.correct) {
        if (!wrongMap[a.topicId]) wrongMap[a.topicId] = { topicId: a.topicId, topicName: a.topicName, wrong: 0 };
        wrongMap[a.topicId].wrong += 1;
      }
    }
    setWeakTopics(Object.values(wrongMap).sort((a, b) => b.wrong - a.wrong));
    if (selectedTopic) setCompletedTopics(prev => new Set([...prev, selectedTopic.id]));
    setView('results');
  };

  const correctCount = answers.filter((a) => a.correct).length;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const adaptiveTopicList = weakTopicsAdaptive.length > 0 ? weakTopicsAdaptive : topics.slice(0, 6);

  const globalStyles = (
    <style jsx global>{`
      @keyframes practiceSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes practiceSlideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes practicePopIn {
        0%   { opacity: 0; transform: scale(0.92); }
        60%  { transform: scale(1.03); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes practiceShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      @keyframes practicePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
      }
      @keyframes practiceStagger {
        from { opacity: 0; transform: translateX(-10px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .practice-slide-up   { animation: practiceSlideUp   0.3s ease-out both; }
      .practice-pop-in     { animation: practicePopIn     0.35s ease-out both; }
      .practice-shake      { animation: practiceShake     0.4s ease-out; }
      .practice-stagger    { animation: practiceStagger   0.3s ease-out both; }
      .practice-card       { background-color: hsl(var(--card)); }
      .dark .practice-card { background-color: rgba(0, 110, 178, 0.13) !important; border-color: rgba(0, 110, 178, 0.28) !important; }
      .dark .practice-card-hi { background-color: rgba(0, 110, 178, 0.22) !important; border-color: rgba(0, 110, 178, 0.45) !important; }
    `}</style>
  );

  // â”€â”€â”€ VIEW: SELECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'select') {
    return (
      <DashboardLayout requiredRole="student">
        {globalStyles}
        <div className="space-y-7 max-w-3xl mx-auto">

          {/* Page Header */}
          <div className="practice-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)', boxShadow: '0 4px 16px rgba(0,110,178,0.3)' }}
              >
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Practice Tests</h1>
                <p className="text-sm text-muted-foreground">Fear-free practice with AI hints — no pressure, just learning.</p>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div
            className="practice-slide-up rounded-2xl border p-1.5 flex gap-1 w-fit"
            style={{ animationDelay: '60ms', backgroundColor: 'rgba(0,47,76,0.04)', borderColor: 'rgba(0,110,178,0.15)' }}
          >
            {([
              { id: 'curriculum', label: 'Curriculum Quiz', icon: FaBook },
              { id: 'adaptive', label: 'Adaptive Quiz', icon: Brain },
            ] as { id: PracticeMode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPracticeMode(id)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={
                  practiceMode === id
                    ? { background: 'linear-gradient(135deg, #002F4C, #006EB2)', color: '#fff', boxShadow: '0 2px 12px rgba(0,110,178,0.35)' }
                    : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Info Banner */}
          <div
            className="practice-slide-up rounded-2xl border px-5 py-4 flex gap-3.5"
            style={{ animationDelay: '120ms', backgroundColor: 'rgba(0,110,178,0.05)', borderColor: 'rgba(0,110,178,0.18)', boxShadow: '0 2px 16px rgba(0,110,178,0.06)' }}
          >
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#006EB2' }} />
            <div className="text-sm">
              {practiceMode === 'curriculum' ? (
                <>
                  <p className="font-bold" style={{ color: '#006EB2' }}>Curriculum Quiz</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">Pick any topic from your curriculum and practice at your own pace. AI hints available anytime.</p>
                </>
              ) : (
                <>
                  <p className="font-bold" style={{ color: '#006EB2' }}>Adaptive Quiz</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">AI-selected topics based on your weakest areas. Targeted practice to close your knowledge gaps fastest.</p>
                </>
              )}
            </div>
          </div>

          {/* Topic Grid */}
          {practiceMode === 'curriculum' ? (
            <div
              className="practice-slide-up rounded-2xl border overflow-hidden"
              style={{ animationDelay: '180ms', borderColor: 'rgba(0,110,178,0.13)', boxShadow: '0 4px 24px rgba(0,110,178,0.07), 0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: 'rgba(0,110,178,0.1)', backgroundColor: 'rgba(0,47,76,0.02)' }}
              >
                <FaBook className="h-4 w-4" style={{ color: '#006EB2' }} />
                <h2 className="font-bold text-sm tracking-wide text-foreground">Choose a Topic</h2>
              </div>
              <div className="p-5">
                {loadingTopics ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(0,110,178,0.06)' }} />
                    ))}
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No topics yet. Enroll in a course first.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {topics.map((topic, i) => {
                      const done = completedTopics.has(topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => startQuiz(topic)}
                          disabled={loadingQuiz}
                          className={`group relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 practice-card${done ? ' practice-card-hi' : ''}`}
                          style={{ borderColor: done ? 'rgba(16,185,129,0.35)' : 'rgba(0,110,178,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = done ? 'rgba(16,185,129,0.6)' : 'rgba(0,110,178,0.5)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,110,178,0.12)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = done ? 'rgba(16,185,129,0.35)' : 'rgba(0,110,178,0.15)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: done ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, rgba(0,47,76,0.08), rgba(0,110,178,0.12))' }}>
                              {done
                                ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                                : <FaBook className="h-3.5 w-3.5" style={{ color: '#006EB2' }} />}
                            </div>
                            {done
                              ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#10b981' }} />
                              : <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: '#006EB2' }} />}
                          </div>
                          <p className="text-sm font-semibold mt-1.5 text-foreground">{topic.name}</p>
                          {(topic.subjectName || topic.courseName) && (
                            <p className="text-xs text-muted-foreground">{topic.subjectName}{topic.courseName ? ` · ${topic.courseName}` : ''}</p>
                          )}
                          {done && <p className="text-[10px] font-bold mt-0.5" style={{ color: '#10b981' }}>Completed ✓</p>}
                          {loadingQuiz && selectedTopic?.id === topic.id && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'hsl(var(--card) / 0.85)' }}>
                              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#006EB2' }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // â”€â”€ ADAPTIVE MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            <div
              className="practice-slide-up rounded-2xl border overflow-hidden"
              style={{ animationDelay: '180ms', borderColor: 'rgba(0,110,178,0.2)', boxShadow: '0 4px 24px rgba(0,110,178,0.1), 0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div
                className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: 'rgba(0,110,178,0.15)', background: 'linear-gradient(135deg, rgba(0,47,76,0.06), rgba(0,110,178,0.08))' }}
              >
                <Brain className="h-4 w-4" style={{ color: '#006EB2' }} />
                <h2 className="font-bold text-sm tracking-wide text-foreground">Adaptive Topics — Your Weakest Areas</h2>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,110,178,0.12)', color: '#006EB2' }}>
                  AI Powered
                </span>
              </div>
              <div className="p-5">
                {loadingAdaptive ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(0,110,178,0.06)' }} />
                    ))}
                  </div>
                ) : adaptiveTopicList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: '#10b981' }} />
                    <p className="text-sm font-semibold">No weak topics detected — great work!</p>
                    <p className="text-xs mt-1">Switch to Curriculum Quiz to keep practicing.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {weakTopicsAdaptive.length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-1">No mastery data yet — showing curriculum topics. Practice more to unlock adaptive recommendations.</p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {adaptiveTopicList.map((topic, idx) => {
                        const done = completedTopics.has(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => startQuiz(topic, true)}
                            disabled={loadingQuiz}
                            className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 practice-card${idx === 0 || done ? ' practice-card-hi' : ''}`}
                            style={{
                              borderColor: done ? 'rgba(16,185,129,0.4)' : idx === 0 ? 'rgba(0,110,178,0.3)' : 'rgba(0,110,178,0.12)',
                              boxShadow: idx === 0 ? '0 2px 12px rgba(0,110,178,0.1)' : '0 1px 4px rgba(0,0,0,0.03)',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = done ? 'rgba(16,185,129,0.65)' : 'rgba(0,110,178,0.5)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,110,178,0.15)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = done ? 'rgba(16,185,129,0.4)' : idx === 0 ? 'rgba(0,110,178,0.3)' : 'rgba(0,110,178,0.12)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = idx === 0 ? '0 2px 12px rgba(0,110,178,0.1)' : '0 1px 4px rgba(0,0,0,0.03)'; }}
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                              style={done
                                ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                                : { background: idx === 0 ? 'linear-gradient(135deg, #002F4C, #006EB2)' : 'rgba(0,110,178,0.1)', color: idx === 0 ? '#fff' : '#006EB2' }}
                            >
                              {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{topic.name}</p>
                              {(topic.subjectName || topic.courseName) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{topic.subjectName}{topic.courseName ? ` · ${topic.courseName}` : ''}</p>
                              )}
                              {done && <p className="text-[10px] font-bold mt-1" style={{ color: '#10b981' }}>Completed ✓</p>}
                            </div>
                            {done
                              ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                              : <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" style={{ color: '#006EB2' }} />}
                            {loadingQuiz && selectedTopic?.id === topic.id && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'hsl(var(--card) / 0.85)' }}>
                                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#006EB2' }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* â”€â”€ Animated Generate Button CTA â”€â”€ */}
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground mb-3 text-center">
                        Start a focused adaptive session on your top weak area:
                        <strong className="ml-1 text-foreground">{adaptiveTopicList[0]?.name}</strong>
                      </p>
                      <div className="flex justify-center">
                        <AnimatedGenerateButton
                          labelIdle="Start Adaptive Quiz"
                          labelActive="Loading Quiz…"
                          generating={loadingQuiz}
                          highlightHueDeg={210}
                          disabled={loadingQuiz}
                          onClick={() => startQuiz(adaptiveTopicList[0], true)}
                          className="w-full max-w-sm [&>button]:w-full [&>button]:justify-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // â”€â”€â”€ VIEW: QUIZ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'quiz') {
    const q = questions[currentIdx];
    if (!q) return null;
    const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;
    const lastAnswer = revealed ? answers[answers.length - 1] ?? null : null;

    return (
      <DashboardLayout requiredRole="student">
        {globalStyles}
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Top bar */}
          <div className="practice-slide-up flex items-center justify-between" style={{ animationDelay: '0ms' }}>
            <button
              onClick={() => setView('select')}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg text-muted-foreground"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,110,178,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-2.5">
              {isAdaptive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'linear-gradient(135deg, rgba(0,47,76,0.1), rgba(0,110,178,0.15))', color: '#006EB2', border: '1px solid rgba(0,110,178,0.2)' }}>
                  <Brain className="h-3 w-3" /> Adaptive
                </span>
              )}
              <span className="text-xs font-mono text-muted-foreground font-semibold">{currentIdx + 1} / {questions.length}</span>
              {xpEarned > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full practice-pop-in"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Zap className="h-3 w-3" />+{xpEarned} XP
                </span>
              )}
            </div>
          </div>

          {/* Progress track */}
          <div className="practice-slide-up h-1.5 rounded-full overflow-hidden" style={{ animationDelay: '40ms', backgroundColor: 'rgba(0,110,178,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #002F4C, #006EB2)' }} />
          </div>

          {/* Topic label */}
          {selectedTopic && (
            <p className="practice-slide-up text-xs font-bold uppercase tracking-widest text-muted-foreground" style={{ animationDelay: '60ms' }}>
              {selectedTopic.name}
            </p>
          )}

          {/* Question Card */}
          <div
            key={`q-${currentIdx}`}
            className="practice-pop-in rounded-2xl border p-7"
            style={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'rgba(0,110,178,0.13)',
              boxShadow: '0 4px 32px rgba(0,110,178,0.08), 0 1px 4px rgba(0,0,0,0.05)',
              ...(answerAnim === 'correct' ? { animation: 'practicePopIn 0.4s ease-out' } : {}),
              ...(answerAnim === 'wrong'   ? { animation: 'practiceShake 0.4s ease-out' } : {}),
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)', color: '#fff' }}>
                Q{currentIdx + 1}
              </span>
            </div>

            <p className="text-base font-semibold leading-relaxed text-foreground mb-6">{q.questionText}</p>

            {/* Options */}
            <div className="space-y-3">
              {OPTIONS.map(({ key, label }, optIdx) => {
                const optionText = (q as any)[label] as string;
                if (!optionText) return null;
                const isSelected = chosen === key;
                const isCorrectResult = revealed && isSelected && !!lastAnswer?.correct;
                const isWrongResult   = revealed && isSelected && !lastAnswer?.correct;
                const isDimmed        = revealed && !isSelected;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    disabled={revealed}
                    className="w-full flex items-center gap-3.5 rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition-all duration-200 practice-stagger"
                    style={{
                      animationDelay: `${optIdx * 50}ms`,
                      ...(isDimmed
                        ? { borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'rgba(0,0,0,0.02)', opacity: 0.45 }
                        : isCorrectResult
                        ? { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', boxShadow: '0 0 0 3px rgba(16,185,129,0.15)', animationName: 'practicePulse', animationDuration: '0.5s', animationTimingFunction: 'ease-out' }
                        : isWrongResult
                        ? { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.07)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
                        : isSelected
                        ? { borderColor: '#006EB2', backgroundColor: 'rgba(0,110,178,0.07)', boxShadow: '0 0 0 3px rgba(0,110,178,0.1)' }
                        : { borderColor: 'rgba(0,110,178,0.12)', backgroundColor: 'hsl(var(--card))' }),
                    }}
                    onMouseEnter={e => { if (!revealed && !isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,110,178,0.4)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,110,178,0.04)'; } }}
                    onMouseLeave={e => { if (!revealed && !isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,110,178,0.12)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--card))'; } }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-200"
                      style={
                        isCorrectResult ? { background: '#10b981', color: '#fff' }
                        : isWrongResult  ? { background: '#ef4444', color: '#fff' }
                        : isSelected     ? { background: 'linear-gradient(135deg, #002F4C, #006EB2)', color: '#fff' }
                        : { backgroundColor: 'rgba(0,110,178,0.08)', color: '#006EB2' }
                      }
                    >
                      {key}
                    </span>
                    <span className="flex-1 leading-snug">{optionText}</span>
                    {isCorrectResult && <CheckCircle2 className="h-5 w-5 shrink-0 practice-pop-in" style={{ color: '#10b981' }} />}
                    {isWrongResult   && <XCircle      className="h-5 w-5 shrink-0 practice-pop-in" style={{ color: '#ef4444' }} />}
                  </button>
                );
              })}
            </div>

            {/* Hint */}
            {selectedTopic && <HintPanel question={q} topicId={selectedTopic.id} />}

            {/* Result feedback */}
            {revealed && lastAnswer && (
              <div
                className="mt-5 rounded-xl border px-4 py-3 flex items-center gap-3 practice-slide-up"
                style={lastAnswer.correct
                  ? { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }
                  : { backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}
              >
                {lastAnswer.correct
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#10b981' }} />
                  : <XCircle      className="h-5 w-5 shrink-0" style={{ color: '#ef4444' }} />}
                <p className="text-sm font-semibold" style={{ color: lastAnswer.correct ? '#059669' : '#dc2626' }}>
                  {lastAnswer.correct ? 'Correct! Well done.' : 'Wrong answer. Review and keep going!'}
                </p>
              </div>
            )}

            {/* Action */}
            <div className="mt-6 flex justify-end">
              {!revealed ? (
                <button
                  onClick={handleConfirm}
                  disabled={!chosen}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: chosen ? 'linear-gradient(135deg, #002F4C, #006EB2)' : 'rgba(0,0,0,0.15)',
                    boxShadow: chosen ? '0 4px 16px rgba(0,110,178,0.35)' : 'none',
                  }}
                >
                  Confirm Answer <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 practice-pop-in"
                  style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)', boxShadow: '0 4px 16px rgba(0,110,178,0.35)' }}
                >
                  {currentIdx + 1 < questions.length ? 'Next Question' : 'See Results'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // â”€â”€â”€ VIEW: RESULTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === 'results') {
    const { emoji, msg } = getScoreLabel(pct);
    return (
      <DashboardLayout requiredRole="student">
        {globalStyles}
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Score Hero */}
          <div className="practice-pop-in rounded-2xl border p-8 text-center"
            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(0,110,178,0.15)', boxShadow: '0 8px 40px rgba(0,110,178,0.1), 0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 text-muted-foreground">
              {isAdaptive ? 'Adaptive Quiz Complete' : 'Practice Complete'}
            </p>
            <div className="flex justify-center mb-5">
              <AnimatedScore value={correctCount} max={answers.length} />
            </div>
            <div className="flex justify-center gap-5 text-sm mb-5">
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#10b981' }}><CheckCircle2 className="h-4 w-4" /> {correctCount} correct</span>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#ef4444' }}><XCircle className="h-4 w-4" /> {answers.length - correctCount} wrong</span>
              {xpEarned > 0 && <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#d97706' }}><Zap className="h-4 w-4" /> +{xpEarned} XP</span>}
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'rgba(0,110,178,0.06)', border: '1px solid rgba(0,110,178,0.15)', color: '#334155' }}>
              <span>{emoji}</span><span>{msg}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="practice-slide-up rounded-2xl border overflow-hidden"
            style={{ animationDelay: '150ms', borderColor: 'rgba(0,110,178,0.13)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-4 border-b flex items-center gap-2"
              style={{ borderColor: 'rgba(0,110,178,0.1)', backgroundColor: 'rgba(0,47,76,0.02)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#006EB2' }} />
              <h2 className="font-bold text-sm tracking-wide text-foreground">Question Breakdown</h2>
            </div>
            <div className="p-5 space-y-2.5">
              {answers.map((a, idx) => (
                <div key={a.questionId}
                  className="flex items-start gap-3 rounded-xl border px-4 py-3 practice-stagger"
                  style={{ animationDelay: `${idx * 40}ms`, borderColor: a.correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)', backgroundColor: a.correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.04)' }}>
                  {a.correct
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    : <XCircle      className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 text-foreground">{a.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Answered: <span className="font-semibold">{a.selected}</span> · {a.topicName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak topics adaptive CTA */}
          {weakTopics.length > 0 && (
            <div className="practice-slide-up rounded-2xl border p-6 space-y-4"
              style={{ animationDelay: '250ms', borderColor: 'rgba(0,110,178,0.2)', background: 'linear-gradient(135deg, rgba(0,47,76,0.03), rgba(0,110,178,0.06))', boxShadow: '0 4px 24px rgba(0,110,178,0.08)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />
                <h3 className="font-bold text-foreground">Detected Weak Areas</h3>
              </div>
              <div className="space-y-2">
                {weakTopics.map((wt) => (
                  <div key={wt.topicId} className="flex items-center justify-between rounded-xl border px-4 py-3"
                    style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(0,110,178,0.12)' }}>
                    <span className="text-sm font-semibold text-foreground">{wt.topicName}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>{wt.wrong} wrong</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(0,110,178,0.15)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-5 w-5" style={{ color: '#006EB2' }} />
                  <p className="font-bold text-sm text-foreground">Adaptive Quiz Ready</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Weakest topic: <strong className="text-foreground">{weakTopics[0].topicName}</strong>. Take a focused adaptive session to reinforce these concepts.
                </p>
                <div className="flex justify-center">
                  <AnimatedGenerateButton
                    labelIdle="Start Adaptive Quiz"
                    labelActive="Loading Quiz…"
                    generating={loadingQuiz}
                    highlightHueDeg={210}
                    disabled={loadingQuiz}
                    onClick={() => {
                      const wt = weakTopics[0];
                      const t = topics.find((t) => t.id === wt.topicId) || { id: wt.topicId, name: wt.topicName };
                      startQuiz(t, true);
                    }}
                    className="w-full max-w-sm [&>button]:w-full [&>button]:justify-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-3 practice-slide-up" style={{ animationDelay: '300ms' }}>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ borderColor: 'rgba(0,110,178,0.2)', color: '#006EB2', backgroundColor: 'rgba(0,110,178,0.04)' }}
              onClick={() => setView('select')}
            >
              <RotateCcw className="h-4 w-4" /> Choose Another Topic
            </button>
            {selectedTopic && (
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)', boxShadow: '0 4px 16px rgba(0,110,178,0.3)' }}
                onClick={() => startQuiz(selectedTopic, false)}
              >
                <RotateCcw className="h-4 w-4" /> Retry This Topic
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
