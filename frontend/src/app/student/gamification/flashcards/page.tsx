'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Brain, Layers, CheckCircle2, XCircle, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';

interface Flashcard {
  id: string;
  topicId: string;
  cardText: string;
  known: boolean;
  nextReview?: string;
  reviewCount: number;
}

export default function FlashcardsPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studying, setStudying] = useState(false);
  const [stats, setStats] = useState({ known: 0, unknown: 0 });

  useEffect(() => {
    loadTopics();
  }, []);

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
              const tops = await curriculumService.getTopics(s.id);
              allTopics.push(...(Array.isArray((tops as any)?.data || tops || []) ? ((tops as any)?.data || tops || []) : []));
            } catch {}
          }
        } catch {}
      }
      setTopics(allTopics);
    } catch {}
  };

  const loadFlashcards = async (topicId: string) => {
    setLoading(true);
    try {
      const res = await gamificationService.getFlashcards(topicId);
      const d = (res as any)?.data || res || [];
      setCards(Array.isArray(d) ? d : []);
      setCurrentIdx(0);
      setFlipped(false);
      setStats({ known: 0, unknown: 0 });
      setStudying(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const markCard = async (known: boolean) => {
    const card = cards[currentIdx];
    if (!card) return;
    try {
      await gamificationService.updateFlashcard(card.id, known);
    } catch {}
    setStats(s => known ? { ...s, known: s.known + 1 } : { ...s, unknown: s.unknown + 1 });
    if (currentIdx + 1 < cards.length) {
      setCurrentIdx(i => i + 1);
      setFlipped(false);
    } else {
      setStudying(false);
    }
  };

  const topicName = topics.find(t => t.id === selectedTopic)?.name || 'Unknown';

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground">
            Review key concepts with spaced-repetition flashcards.
          </p>
        </div>

        {!studying ? (
          <>
            {/* Topic selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Study Flashcards
                </CardTitle>
                <CardDescription>Choose a topic to review its flashcards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTopic} onValueChange={(v) => { setSelectedTopic(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedTopic && loadFlashcards(selectedTopic)}
                  disabled={!selectedTopic || loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Start Review
                </Button>
              </CardContent>
            </Card>

            {/* Show results if session just ended */}
            {(stats.known > 0 || stats.unknown > 0) && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Session Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-8 justify-center text-center">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{stats.known}</div>
                      <div className="text-sm text-muted-foreground">Known</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-500">{stats.unknown}</div>
                      <div className="text-sm text-muted-foreground">Need Review</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStudying(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Badge variant="outline" className="text-sm">
                {currentIdx + 1} / {cards.length}
              </Badge>
            </div>

            {cards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No flashcards available for this topic yet.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Flashcard */}
                <div
                  className="cursor-pointer perspective-1000"
                  onClick={() => setFlipped(!flipped)}
                >
                  <Card className={`min-h-[280px] flex items-center justify-center transition-all duration-300 ${
                    flipped ? 'bg-primary/5 border-primary/30' : ''
                  }`}>
                    <CardContent className="text-center p-8">
                      <p className="text-xs text-muted-foreground mb-4">
                        {flipped ? 'Answer' : 'Question'} — tap to flip
                      </p>
                      <p className="text-xl font-medium">
                        {cards[currentIdx]?.cardText || 'No content'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
                    onClick={() => markCard(false)}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Don&apos;t Know
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-xs border-green-500/30 text-green-600 hover:bg-green-500/10"
                    onClick={() => markCard(true)}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Know It
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
