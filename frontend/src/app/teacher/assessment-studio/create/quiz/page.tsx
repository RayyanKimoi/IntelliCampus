'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { assessmentStudioService, Question as ServiceQuestion } from '@/services/assessmentStudioService';
import { chapterCurriculumService, Course, Chapter } from '@/services/chapterCurriculumService';

type QuizMode = 'choose' | 'manual' | 'ai';

interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D' | '';
  explanation: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

function emptyQuestion(): QuizQuestion {
  return {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: '',
    explanation: '',
    difficultyLevel: 'intermediate',
  };
}

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CreateQuizPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<QuizMode>('choose');
  const [aiGenerating, setAiGenerating] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    chapterId: '',
    title: '',
    description: '',
    dueDate: '',
    difficultyLevel: 'intermediate',
    questionCount: 5,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [createdAssignmentId, setCreatedAssignmentId] = useState('');

  useEffect(() => {
    chapterCurriculumService.getTeacherCourses()
      .then(setCourses)
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoadingCourses(false));
  }, []);

  async function handleCourseChange(courseId: string) {
    setForm(f => ({ ...f, courseId, chapterId: '' }));
    setChapters([]);
    if (!courseId) return;
    setLoadingChapters(true);
    try {
      const res = await chapterCurriculumService.getCourseChapters(courseId);
      setChapters(res.chapters);
    } catch {
      setError('Failed to load chapters');
    } finally {
      setLoadingChapters(false);
    }
  }

  function addQuestion() {
    setQuestions(prev => [...prev, emptyQuestion()]);
  }

  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }

  async function handleGenerateAI() {
    if (!form.courseId) { setError('Please select a course.'); return; }
    if (!form.chapterId) { setError('Please select a chapter for AI generation.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }

    setAiGenerating(true);
    setError('');
    try {
      const result = await assessmentStudioService.generateAIQuiz({
        courseId: form.courseId,
        chapterId: form.chapterId,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        difficultyLevel: form.difficultyLevel,
        questionCount: form.questionCount,
      });
      setCreatedAssignmentId(result.assignment.id);
      if (result.questions.length > 0) {
        setQuestions(result.questions.map((q: ServiceQuestion) => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption as 'A' | 'B' | 'C' | 'D',
          explanation: q.explanation || '',
          difficultyLevel: (q.difficultyLevel as any) || 'intermediate',
        })));
      } else {
        setQuestions(Array.from({ length: form.questionCount }, emptyQuestion));
      }
      setMode('manual');
    } catch {
      setError('AI generation failed. You can still fill in questions manually.');
      setMode('manual');
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleCreateManualQuiz() {
    if (!form.courseId) { setError('Please select a course.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.dueDate) { setError('Due date is required.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const quiz = await assessmentStudioService.createQuiz({
        courseId: form.courseId,
        chapterId: form.chapterId || undefined,
        title: form.title,
        description: form.description,
        dueDate: new Date(form.dueDate).toISOString(),
      });
      setCreatedAssignmentId(quiz.id);
      setMode('manual');
    } catch (e: any) {
      setError(e?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveQuestions() {
    if (!createdAssignmentId) { setError('Quiz not created yet.'); return; }
    const validQuestions = questions.filter(q =>
      q.questionText.trim() && q.optionA && q.optionB && q.optionC && q.optionD && q.correctOption
    );
    if (validQuestions.length === 0) { setError('Add at least one complete question.'); return; }

    setSubmitting(true);
    setError('');
    try {
      for (const q of validQuestions) {
        await assessmentStudioService.addQuestion(createdAssignmentId, {
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption as 'A' | 'B' | 'C' | 'D',
          explanation: q.explanation || undefined,
          difficultyLevel: q.difficultyLevel,
        });
      }
      router.push(`/teacher/assessment-studio/${createdAssignmentId}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to save questions');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Quiz</h1>
            <p className="text-muted-foreground mt-0.5">Build a multiple choice quiz manually or with AI assistance.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button className="ml-auto text-xs underline" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {/* Quiz Details Form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Quiz Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Course <span className="text-destructive">*</span></Label>
                <Select value={form.courseId} onValueChange={handleCourseChange} disabled={loadingCourses}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCourses ? 'Loading...' : 'Select course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Chapter</Label>
                <Select
                  value={form.chapterId}
                  onValueChange={v => setForm(f => ({ ...f, chapterId: v }))}
                  disabled={loadingChapters || !form.courseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingChapters ? 'Loading...' : 'Select chapter (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Chapter 3 Review Quiz"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Due Date <span className="text-destructive">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficultyLevel}
                  onValueChange={v => setForm(f => ({ ...f, difficultyLevel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode Selection (only if quiz not yet created) */}
        {mode === 'choose' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all"
              onClick={handleCreateManualQuiz}
            >
              <CardContent className="flex flex-col items-center py-8 text-center gap-3">
                {submitting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <BookOpen className="h-8 w-8 text-primary" />
                )}
                <div>
                  <h3 className="font-semibold">Manual Quiz</h3>
                  <p className="text-sm text-muted-foreground mt-1">Write questions yourself.</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 hover:border-purple-500 hover:shadow-md transition-all"
              onClick={handleGenerateAI}
            >
              <CardContent className="flex flex-col items-center py-8 text-center gap-3">
                {aiGenerating ? (
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                ) : (
                  <Wand2 className="h-8 w-8 text-purple-600" />
                )}
                <div>
                  <h3 className="font-semibold">AI Generated Quiz</h3>
                  <p className="text-sm text-muted-foreground mt-1">Generate questions from chapter content using AI.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Builder */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions</h2>
              <Badge variant="outline">{questions.length} question{questions.length !== 1 ? 's' : ''}</Badge>
            </div>

            {questions.map((q, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-muted-foreground">Question {idx + 1}</CardTitle>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeQuestion(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Question Text <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Enter your question..."
                      rows={2}
                      value={q.questionText}
                      onChange={e => updateQuestion(idx, { questionText: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt} className="space-y-1.5">
                        <Label className="text-xs">Option {opt}</Label>
                        <Input
                          placeholder={`Option ${opt}`}
                          value={q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']}
                          onChange={e => updateQuestion(idx, { [`option${opt}`]: e.target.value } as any)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Correct Answer <span className="text-destructive">*</span></Label>
                      <Select
                        value={q.correctOption}
                        onValueChange={v => updateQuestion(idx, { correctOption: v as 'A' | 'B' | 'C' | 'D' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct option" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <SelectItem key={opt} value={opt}>Option {opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Difficulty</Label>
                      <Select
                        value={q.difficultyLevel}
                        onValueChange={v => updateQuestion(idx, { difficultyLevel: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Explanation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      placeholder="Explain why this answer is correct..."
                      rows={2}
                      value={q.explanation}
                      onChange={e => updateQuestion(idx, { explanation: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>

            <div className="flex justify-end gap-3 pb-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveQuestions} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  'Save Quiz'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
