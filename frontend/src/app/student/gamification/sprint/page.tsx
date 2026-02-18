'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Timer, Flame, CheckCircle2, XCircle, ArrowLeft, Loader2, Trophy } from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';

interface SprintQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

type View = 'setup' | 'quiz' | 'result';

export default function SprintQuizPage() {
  const [view, setView] = useState<View>('setup');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState<SprintQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (view === 'quiz' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (view === 'quiz' && timeLeft <= 0) {
      endSprint();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view, timeLeft]);

  const loadTopics = async () => {
    try {
      const courses = await curriculumService.getCourses();
      const courseList = (courses as any)?.data || courses || [];
      const allTopics: any[] = [];
      for (const c of (Array.isArray(courseList) ? courseList : [])) {
        try {
          const subjects = await curriculumService.getSubjects(c.id);
          for (const s of (Array.isArray((subjects as any)?.data || subjects || []) ? ((subjects as any)?.data || subjects || []) : [])) {
            try {
              const topics = await curriculumService.getTopics(s.id);
              allTopics.push(...(Array.isArray((topics as any)?.data || topics || []) ? ((topics as any)?.data || topics || []) : []));
            } catch {}
          }
        } catch {}
      }
      setTopics(allTopics);
    } catch {}
  };

  const startSprint = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const res = await gamificationService.startSprintQuiz(selectedTopic);
      const d = res?.data || res;
      const qs = d?.questions || d || [];
      setQuestions(Array.isArray(qs) ? qs : []);
      setCurrentIdx(0);
      setScore(0);
      setXpEarned(0);
      setAnswers({ correct: 0, wrong: 0 });
      setTimeLeft(60);
      startTimeRef.current = Date.now();
      setView('quiz');
    } catch (err: any) {
      alert(err.message || 'Failed to start sprint');
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = async (option: string) => {
    const q = questions[currentIdx];
    if (!q) return;
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = Date.now();

    try {
      const res = await gamificationService.submitSprintAnswer({
        questionId: q.id,
        selectedOption: option,
        timeTaken,
      });
      const d = res?.data || res;
      if (d.correct) {
        setScore(s => s + 1);
        setAnswers(a => ({ ...a, correct: a.correct + 1 }));
        setXpEarned(x => x + (d.xpAwarded || 10));
      } else {
        setAnswers(a => ({ ...a, wrong: a.wrong + 1 }));
      }
    } catch {
      // Continue even if API fails
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
    } else {
      endSprint();
    }
  };

  const endSprint = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setView('result');
  };

  const resetView = () => {
    setView('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setTimeLeft(60);
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl space-y-8">
        {view === 'setup' && (
          <>
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Sprint Quiz</h1>
              <p className="text-muted-foreground">
                Race against the clock! Answer as many questions as you can in 60 seconds.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-card to-yellow-500/10 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Start Sprint
                  </CardTitle>
                  <CardDescription>Select a topic and start your speed challenge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Timer className="h-5 w-5 text-muted-foreground" /> 60s
                      </div>
                      <div className="text-xs text-muted-foreground">Time Limit</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Flame className="h-5 w-5 text-orange-500" /> 2x
                      </div>
                      <div className="text-xs text-muted-foreground">XP Multiplier</div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                    onClick={startSprint}
                    disabled={!selectedTopic || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Start Sprint
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Sprint quiz rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>1. You get 60 seconds to answer as many MCQs as possible.</p>
                  <p>2. Each correct answer earns you XP with a 2x streak multiplier.</p>
                  <p>3. Wrong answers don&apos;t deduct XP, but break your streak.</p>
                  <p>4. Your mastery for the topic is updated based on performance.</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {view === 'quiz' && questions[currentIdx] && (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={endSprint}>
                <ArrowLeft className="h-4 w-4 mr-2" /> End Early
              </Button>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg px-3 py-1 font-mono">
                  <Timer className="h-4 w-4 mr-1" /> {timeLeft}s
                </Badge>
                <Badge className="text-lg px-3 py-1">
                  Score: {score}
                </Badge>
              </div>
            </div>

            <Progress value={(timeLeft / 60) * 100} className="h-2" />

            <Card>
              <CardHeader>
                <CardDescription>Question {currentIdx + 1} of {questions.length}</CardDescription>
                <CardTitle className="text-lg">{questions[currentIdx].questionText}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <Button
                      key={opt}
                      variant="outline"
                      className="h-auto p-4 text-left justify-start whitespace-normal"
                      onClick={() => answerQuestion(opt)}
                    >
                      <span className="mr-3 font-bold text-primary">{opt}.</span>
                      {questions[currentIdx][`option${opt}` as keyof SprintQuestion]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {view === 'result' && (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="h-24 w-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold">Sprint Complete!</h1>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{answers.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">{answers.wrong}</div>
                <div className="text-sm text-muted-foreground">Wrong</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">+{xpEarned}</div>
                <div className="text-sm text-muted-foreground">XP Earned</div>
              </div>
            </div>
            <Button onClick={resetView} size="lg">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
