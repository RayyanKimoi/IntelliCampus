'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Globe,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import { assessmentStudioService, Assessment } from '@/services/assessmentStudioService';
import { chapterCurriculumService, Course } from '@/services/chapterCurriculumService';

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function AssessmentStudioPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[Assessment Studio] Loading assessments and courses...');
      const [assessmentRes, courseRes] = await Promise.allSettled([
        assessmentStudioService.getAssessments(selectedCourseId !== 'all' ? selectedCourseId : undefined),
        chapterCurriculumService.getTeacherCourses(),
      ]);
      
      if (assessmentRes.status === 'fulfilled') {
        console.log('[Assessment Studio] Assessments loaded:', assessmentRes.value?.length || 0);
        setAssessments(assessmentRes.value || []);
      } else {
        console.error('[Assessment Studio] Failed to load assessments:', assessmentRes.reason);
        setError('Failed to load assessments. Please refresh the page.');
      }
      
      if (courseRes.status === 'fulfilled') {
        console.log('[Assessment Studio] Courses loaded:', courseRes.value?.length || 0);
        setCourses(courseRes.value || []);
      } else {
        console.warn('[Assessment Studio] Failed to load courses:', courseRes.reason);
        // Don't set error for courses, as assignments can still be shown
      }
    } catch (err) {
      console.error('[Assessment Studio] Unexpected error:', err);
      setError('An unexpected error occurred. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      await assessmentStudioService.publishAssessment(id);
      setAssessments(prev => prev.map(a => a.id === id ? { ...a, isPublished: true } : a));
    } catch {
      setError('Failed to publish assessment');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assessment? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await assessmentStudioService.deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Failed to delete assessment');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = assessments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Studio</h1>
            <p className="text-muted-foreground mt-1">Create and manage assignments and quizzes for your courses.</p>
          </div>
          <Link href="/teacher/assessment-studio/create">
            <Button><Plus className="h-4 w-4 mr-2" /> Create New</Button>
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button className="ml-auto text-xs underline" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No assessments yet</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                {search ? 'No assessments match your search.' : 'Create your first assignment or quiz to get started.'}
              </p>
              {!search && (
                <Link href="/teacher/assessment-studio/create">
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create New</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(assessment => {
              const isQuiz = assessment.type === 'quiz';
              return (
                <div
                  key={assessment.id}
                  className="group relative flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full ${isQuiz ? 'bg-gradient-to-r from-primary to-sky-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}`} />

                  <div className="flex flex-col flex-1 p-5 gap-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl ring-1 shrink-0 ${isQuiz ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20'}`}>
                        {isQuiz ? <ClipboardList className="h-5 w-5" /> : <FaBook className="h-5 w-5" />}
                      </div>
                      {/* Status badge */}
                      {assessment.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Title + Type */}
                    <div>
                      <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isQuiz ? 'text-primary' : 'text-violet-600 dark:text-violet-400'}`}>
                        {isQuiz ? 'Quiz' : 'Assignment'}
                      </div>
                      <h3 className="font-semibold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                        {assessment.title}
                      </h3>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      {assessment.course && (
                        <span className="flex items-center gap-1.5">
                          <FaBook className="h-3 w-3 shrink-0" />
                          <span className="truncate">{assessment.course.name}</span>
                        </span>
                      )}
                      {assessment.chapter && (
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="h-3 w-3 shrink-0" />
                          <span className="truncate">{assessment.chapter.name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Due {new Date(assessment.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Footer: questions count + actions */}
                    <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {assessment._count ? `${assessment._count.questions} question${assessment._count.questions !== 1 ? 's' : ''}` : '—'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!assessment.isPublished && (
                          <Button size="sm" variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => handlePublish(assessment.id)}
                            disabled={publishing === assessment.id}>
                            <Globe className="h-3 w-3 mr-1" />
                            {publishing === assessment.id ? 'Publishing…' : 'Publish'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => router.push(`/teacher/assessment-studio/${assessment.id}`)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(assessment.id)}
                          disabled={deleting === assessment.id}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
