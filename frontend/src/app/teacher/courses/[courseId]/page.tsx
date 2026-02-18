'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, BookOpen, PlusCircle, Brain, FileText, ChevronRight } from 'lucide-react';
import { teacherService } from '@/services/teacherService';

interface Subject {
  id: string;
  name: string;
  description: string;
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  description: string;
  difficultyLevel: string;
  orderIndex: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject form
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [subjectLoading, setSubjectLoading] = useState(false);

  // Topic form
  const [topicSubjectId, setTopicSubjectId] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState('intermediate');
  const [topicLoading, setTopicLoading] = useState(false);

  // Content form
  const [contentTopicId, setContentTopicId] = useState('');
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentText, setContentText] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getCourse(courseId);
      const c = (res as any)?.data || res;
      setCourse(c);
      // Also load subjects tree
      const subRes = await teacherService.getCourses(); // fallback - get subjects from within course
      // Try direct endpoint
      try {
        const courseDetail = await teacherService.getCourse(courseId);
        const d = (courseDetail as any)?.data || courseDetail;
        if (d?.subjects) {
          setSubjects(d.subjects);
        }
      } catch {}
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setSubjectLoading(true);
    try {
      await teacherService.createSubject(courseId, { name: subjectName.trim(), description: subjectDesc.trim() });
      setSubjectName('');
      setSubjectDesc('');
      setShowSubjectForm(false);
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !topicSubjectId) return;
    setTopicLoading(true);
    try {
      const existingTopics = subjects.find(s => s.id === topicSubjectId)?.topics || [];
      await teacherService.createTopic(topicSubjectId, {
        name: topicName.trim(),
        description: topicDesc.trim(),
        difficultyLevel: topicDifficulty,
        orderIndex: existingTopics.length + 1,
      });
      setTopicName('');
      setTopicDesc('');
      setShowTopicForm(false);
      loadCourse();
    } catch (err: any) {
      alert(err.message || 'Failed to create topic');
    } finally {
      setTopicLoading(false);
    }
  };

  const uploadContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentText.trim() || !contentTopicId) return;
    setContentLoading(true);
    try {
      await teacherService.uploadContent(contentTopicId, { content: contentText.trim() });
      setContentText('');
      setShowContentForm(false);
      alert('Content uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload content');
    } finally {
      setContentLoading(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => router.push('/teacher/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{course?.name || 'Course'}</h1>
            <p className="text-muted-foreground">{course?.description}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={showSubjectForm} onOpenChange={setShowSubjectForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={createSubject} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject Name *</Label>
                  <Input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g., Data Structures" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)} placeholder="Brief description..." />
                </div>
                <Button type="submit" disabled={subjectLoading} className="w-full">
                  {subjectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Subject
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showTopicForm} onOpenChange={setShowTopicForm}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={subjects.length === 0}>
                <Brain className="h-4 w-4 mr-2" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Topic</DialogTitle>
              </DialogHeader>
              <form onSubmit={createTopic} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={topicSubjectId} onValueChange={setTopicSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic Name *</Label>
                  <Input value={topicName} onChange={e => setTopicName(e.target.value)} placeholder="e.g., Binary Trees" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder="Brief description..." />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={topicDifficulty} onValueChange={setTopicDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={topicLoading} className="w-full">
                  {topicLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Topic
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showContentForm} onOpenChange={setShowContentForm}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={subjects.length === 0}>
                <FileText className="h-4 w-4 mr-2" /> Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Content</DialogTitle>
              </DialogHeader>
              <form onSubmit={uploadContent} className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Select value={contentTopicId} onValueChange={setContentTopicId}>
                    <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                    <SelectContent>
                      {subjects.flatMap(s => (s.topics || []).map(t => (
                        <SelectItem key={t.id} value={t.id}>{s.name} → {t.name}</SelectItem>
                      )))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={contentText}
                    onChange={e => setContentText(e.target.value)}
                    placeholder="Paste your curriculum content here..."
                    rows={12}
                  />
                </div>
                <Button type="submit" disabled={contentLoading} className="w-full">
                  {contentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upload Content
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Curriculum Tree */}
        {subjects.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No subjects yet. Add a subject to start building your curriculum.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={subjects.map(s => s.id)}>
            {subjects.map(subject => (
              <AccordionItem key={subject.id} value={subject.id}>
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{subject.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {subject.topics?.length || 0} topics
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                  {subject.topics && subject.topics.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {subject.topics.map(topic => (
                        <div key={topic.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            <span className="font-medium">{topic.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[topic.difficultyLevel] || ''}`}>
                              {topic.difficultyLevel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </DashboardLayout>
  );
}
