'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Trophy, Shield, Heart, Zap, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';

interface Battle {
  id: string;
  topicId: string;
  topicName?: string;
  bossHP: number;
  currentHP: number;
  status: string;
  score: number;
  totalQuestions: number;
  xpEarned?: number;
  createdAt: string;
}

interface BattleQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

type View = 'select' | 'battle' | 'result';

export default function BossBattlePage() {
  const [view, setView] = useState<View>('select');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [history, setHistory] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; damage: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load topics from all courses
      const courses = await curriculumService.getCourses();
      const courseList = (courses as any)?.data || courses || [];
      const allTopics: any[] = [];
      for (const c of (Array.isArray(courseList) ? courseList : [])) {
        try {
          const subjects = await curriculumService.getSubjects(c.id);
          const subList = (subjects as any)?.data || subjects || [];
          for (const s of (Array.isArray(subList) ? subList : [])) {
            try {
              const topics = await curriculumService.getTopics(s.id);
              const topicList = (topics as any)?.data || topics || [];
              allTopics.push(...(Array.isArray(topicList) ? topicList : []));
            } catch {}
          }
        } catch {}
      }
      setTopics(allTopics);

      // Check for active battle
      try {
        const active = await gamificationService.getActiveBattle();
        const b = active?.data || active;
        if (b && b.id && b.status === 'active') {
          setBattle(b);
          setView('battle');
        }
      } catch {}

      // Load battle history
      try {
        const hist = await gamificationService.getBattleHistory();
        const list = hist?.data || hist || [];
        setHistory(Array.isArray(list) ? list : []);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const res = await gamificationService.startBossBattle(selectedTopic);
      const b = res?.data || res;
      setBattle(b);
      if (b.question) setQuestion(b.question);
      setView('battle');
    } catch (err: any) {
      alert(err.message || 'Failed to start battle');
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = async (option: string) => {
    if (!battle || !question || answering) return;
    setAnswering(true);
    setLastResult(null);
    try {
      const res = await gamificationService.answerBattle({
        battleId: battle.id,
        questionId: question.id,
        selectedOption: option,
      });
      const d = res?.data || res;
      setLastResult({ correct: d.correct, damage: d.damage || 0 });
      setBattle(prev => prev ? { ...prev, currentHP: d.currentHP ?? d.bossHP, score: d.score ?? prev.score } : prev);
      if (d.status === 'won' || d.status === 'lost' || d.status === 'completed') {
        setBattle(prev => prev ? { ...prev, status: d.status, xpEarned: d.xpEarned } : prev);
        setTimeout(() => setView('result'), 1500);
      } else if (d.nextQuestion) {
        setTimeout(() => {
          setQuestion(d.nextQuestion);
          setLastResult(null);
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setAnswering(false);
    }
  };

  const resetView = () => {
    setView('select');
    setBattle(null);
    setQuestion(null);
    setLastResult(null);
    loadData();
  };

  if (loading && view === 'select') {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl space-y-8">
        {view === 'select' && (
          <>
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Boss Battles</h1>
              <p className="text-muted-foreground">
                Challenge topic bosses to prove your mastery and earn epic rewards.
              </p>
            </div>

            <Card className="border-2 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-red-500" />
                  Start a New Battle
                </CardTitle>
                <CardDescription>Select a topic and challenge its boss</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic to battle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={startBattle}
                  disabled={!selectedTopic || loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Swords className="h-4 w-4 mr-2" />}
                  Challenge Boss
                </Button>
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Battle History</CardTitle>
                  <CardDescription>Your past battles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.slice(0, 10).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{b.topicName || 'Boss Battle'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono">Score: {b.score}/{b.totalQuestions}</span>
                          <Badge variant={b.status === 'won' ? 'default' : 'destructive'}>
                            {b.status === 'won' ? 'Victory' : b.status === 'lost' ? 'Defeat' : b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {view === 'battle' && battle && (
          <>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={resetView}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Boss Battle</h1>
            </div>

            {/* Boss HP Bar */}
            <Card className="border-red-500/30 bg-gradient-to-r from-card to-red-500/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-red-500" />
                    <span className="font-bold text-lg">Boss</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-mono font-bold">{battle.currentHP} / {battle.bossHP} HP</span>
                  </div>
                </div>
                <Progress
                  value={(battle.currentHP / battle.bossHP) * 100}
                  className="h-4"
                />
                {lastResult && (
                  <div className={`text-center font-bold text-lg animate-bounce ${lastResult.correct ? 'text-green-500' : 'text-red-500'}`}>
                    {lastResult.correct ? `Critical Hit! -${lastResult.damage} HP` : 'Miss! Boss attacks back!'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question */}
            {question && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{question.questionText}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <Button
                        key={opt}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start whitespace-normal"
                        onClick={() => answerQuestion(opt)}
                        disabled={answering}
                      >
                        <span className="mr-3 font-bold text-primary">{opt}.</span>
                        {question[`option${opt}` as keyof BattleQuestion]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {view === 'result' && battle && (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
              battle.status === 'won' ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              {battle.status === 'won' ? (
                <Trophy className="h-12 w-12 text-yellow-500" />
              ) : (
                <Shield className="h-12 w-12 text-red-500" />
              )}
            </div>
            <h1 className="text-3xl font-bold">
              {battle.status === 'won' ? 'Victory!' : 'Defeated!'}
            </h1>
            <p className="text-muted-foreground text-center max-w-md">
              {battle.status === 'won'
                ? 'You defeated the boss! Your mastery of this topic is impressive.'
                : 'The boss was too strong this time. Keep studying and try again!'}
            </p>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">{battle.score}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              {battle.xpEarned && (
                <div>
                  <div className="text-2xl font-bold text-yellow-600">+{battle.xpEarned}</div>
                  <div className="text-sm text-muted-foreground">XP Earned</div>
                </div>
              )}
            </div>
            <Button onClick={resetView} size="lg">
              Back to Battles
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
