'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { teacherService } from '@/services/teacherService';

interface TopicInfo { id: string; name: string; subjectName: string; }

export default function TeacherContentPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [content, setContent] = useState('');
  const [existingContent, setExistingContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await teacherService.getCourses();
        const list = Array.isArray((res as any)?.data || res) ? ((res as any)?.data || res) : [];
        setCourses(list);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourse) { setTopics([]); return; }
    loadTopics(selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedTopic) { setExistingContent(''); return; }
    loadContent(selectedTopic);
  }, [selectedTopic]);

  const loadTopics = async (courseId: string) => {
    try {
      const course = await teacherService.getCourse(courseId);
      const d = (course as any)?.data || course;
      const allTopics: TopicInfo[] = [];
      if (d?.subjects) {
        for (const s of d.subjects) {
          for (const t of (s.topics || [])) {
            allTopics.push({ id: t.id, name: t.name, subjectName: s.name });
          }
        }
      }
      setTopics(allTopics);
    } catch { setTopics([]); }
  };

  const loadContent = async (topicId: string) => {
    try {
      const res = await teacherService.getTopicContent(topicId);
      const d = (res as any)?.data || res;
      setExistingContent(d?.content || d?.textContent || '');
    } catch { setExistingContent(''); }
  };

  const uploadContent = async () => {
    if (!selectedTopic || !content.trim()) return;
    setUploading(true);
    setSuccess(false);
    try {
      await teacherService.uploadContent(selectedTopic, { content: content.trim() });
      setSuccess(true);
      setContent('');
      loadContent(selectedTopic);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Upload and manage curriculum content for AI-powered learning</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedTopic(''); }}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={topics.length === 0}>
              <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
              <SelectContent>
                {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.subjectName} → {t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {existingContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Existing Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto text-sm bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                {existingContent}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Content
            </CardTitle>
            <CardDescription>
              Paste curriculum content for the selected topic. This will be chunked, embedded, and stored in the vector database for RAG-powered AI responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste your curriculum content here. This can be lecture notes, textbook content, or any educational material..."
              rows={12}
              disabled={!selectedTopic}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {content.length > 0 ? `${content.length} characters` : 'No content'}
              </span>
              <div className="flex items-center gap-2">
                {success && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Uploaded!
                  </Badge>
                )}
                <Button onClick={uploadContent} disabled={!selectedTopic || !content.trim() || uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload & Embed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
