'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { curriculumService, Course, Subject, Topic, Chapter, ChapterContentItem } from '@/services/curriculumService';
import { masteryService } from '@/services/masteryService';
import { aiService } from '@/services/aiService';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { useCourseStore } from '@/store/courseStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Lightbulb, Target, ChevronRight,
  FileText, MessageSquare, CheckCircle2, AlertTriangle, Layers, Loader2,
  ClipboardList, Calendar, Clock, PlayCircle, ExternalLink,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

type ChapterWithContent = Chapter;

type CourseTab = 'teacher' | 'adaptive' | 'assignments';

// ────────────────────────────────────────────────────────────────────────────────
// Sub-components: Assignments
// ────────────────────────────────────────────────────────────────────────────────

function AssignmentsTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    assessmentService.getAssignmentsByCourse(courseId)
      .then((data) => { if (!cancelled) setAssignments(data); })
      .catch(() => { if (!cancelled) setAssignments([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
            <div className="h-5 w-1/2 rounded bg-muted mb-2" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold">No assignments yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Check back once your teacher publishes assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const attempt = (a as any).studentAttempts?.[0];
        const submitted = !!attempt?.submittedAt;
        const due = new Date(a.dueDate);
        const overdue = !submitted && due < new Date();

        return (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => router.push(`/student/courses/${courseId}/assignments/${a.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                submitted ? 'bg-green-100 dark:bg-green-900/30' : overdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30',
              )}>
                <ClipboardList className={cn(
                  'h-5 w-5',
                  submitted ? 'text-green-600' : overdue ? 'text-red-600' : 'text-blue-600',
                )} />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{a.title}</p>
                {a.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {overdue && <span className="text-red-500 ml-1">• Overdue</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  submitted
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : overdue
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700',
                )}
              >
                {submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
              </Badge>
              <Button size="sm" variant="outline">
                {submitted ? 'View' : 'Submit'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Sub-components: Teacher Resources
// ────────────────────────────────────────────────────────────────────────────────

function TopicContentViewer({
  topic,
  courseId,
}: {
  topic: Topic;
  courseId: string;
}) {
  const router = useRouter();

  const topicContent = (topic as any).content as string | undefined;

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{topic.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs capitalize">
            {topic.difficultyLevel}
          </Badge>
        </div>
      </div>

      {topicContent ? (
        <div className="prose prose-sm max-w-none flex-1 overflow-y-auto text-card-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">{topicContent}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">No teacher notes for this topic yet.</p>
        </div>
      )}

      <div className="mt-6 flex gap-3 pt-4 border-t border-border">
        <Button
          size="sm"
          onClick={() => router.push(`/student/ai-tutor?topicId=${topic.id}&courseId=${courseId}`)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Ask AI Tutor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/student/practice?topicId=${topic.id}`)}
        >
          <Target className="mr-2 h-4 w-4" />
          Practice
        </Button>
      </div>
    </div>
  );
}

function TeacherResources({
  subjects,
  courseId,
}: {
  subjects: SubjectWithTopics[];
  courseId: string;
}) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    subjects[0]?.topics[0]?.id ?? null
  );
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(subjects.map((s) => s.id))
  );

  const selectedTopic = subjects.flatMap((s) => s.topics).find((t) => t.id === selectedTopicId);

  function toggleSubject(id: string) {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 min-h-[520px]">
      {/* Left: chapter/topic sidebar */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="sticky top-0 bg-card px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Curriculum
          </h3>
        </div>
        <ScrollArea className="h-[460px]">
          <div className="py-2">
            {subjects.map((subject) => (
              <div key={subject.id}>
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight
                    className={cn('h-3.5 w-3.5 transition-transform text-muted-foreground', {
                      'rotate-90': expandedSubjects.has(subject.id),
                    })}
                  />
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate text-left">{subject.name}</span>
                </button>
                {expandedSubjects.has(subject.id) && (
                  <div className="pl-8 pb-1">
                    {subject.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                          selectedTopicId === topic.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <FaBook className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-left">{topic.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: content viewer */}
      {selectedTopic ? (
        <TopicContentViewer topic={selectedTopic} courseId={courseId} />
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-sm">
          Select a topic from the left to view content.
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Sub-components: Adaptive Resources
// ────────────────────────────────────────────────────────────────────────────────

interface WeakTopicCardProps {
  topic: Topic & { subjectName?: string; masteryScore: number };
  courseId: string;
}

function WeakTopicCard({ topic, courseId }: WeakTopicCardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function fetchNotes() {
    if (notes !== null) { setExpanded((v) => !v); return; }
    setLoadingNotes(true);
    setExpanded(true);
    try {
      const res = await (aiService as any).getTopicContext(topic.id) as any;
      const content: string = res?.data?.summary ?? res?.summary ?? res?.content ?? 'No AI notes available for this topic yet.';
      setNotes(content);
    } catch {
      setNotes('Could not load AI notes. Try again later.');
    } finally {
      setLoadingNotes(false);
    }
  }

  const mastery = Math.round(topic.masteryScore ?? 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-card-foreground">{topic.name}</h4>
          {topic.subjectName && (
            <p className="text-xs text-muted-foreground mt-0.5">{topic.subjectName}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn('text-xs border shrink-0', mastery < 50
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-amber-50 border-amber-200 text-amber-600'
          )}
        >
          {mastery < 50 ? 'Needs Work' : 'Developing'}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Progress value={mastery} className="flex-1 h-1.5 [&>*]:bg-red-500" />
        <span className="text-xs text-muted-foreground w-12 text-right">{mastery}%</span>
      </div>

      {expanded && (
        <div className="mb-4 rounded-lg bg-muted/40 p-4 text-sm text-card-foreground">
          {loadingNotes ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating AI notes…
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{notes}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={fetchNotes}>
          <Lightbulb className="mr-2 h-3.5 w-3.5" />
          {expanded ? (notes !== null ? 'Hide Notes' : 'Loading…') : 'AI Notes'}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/student/ai-tutor?topicId=${topic.id}&courseId=${courseId}`)}
        >
          <MessageSquare className="mr-2 h-3.5 w-3.5" />
          Tutor
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => router.push(`/student/practice?topicId=${topic.id}`)}
        >
          <Target className="mr-2 h-3.5 w-3.5" />
          Practice
        </Button>
      </div>
    </div>
  );
}

function AdaptiveResources({
  subjects,
  courseId,
}: {
  subjects: SubjectWithTopics[];
  courseId: string;
}) {
  const [weakTopics, setWeakTopics] = useState<(Topic & { subjectName?: string; masteryScore: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await masteryService.getWeakTopics() as any;
        const raw: any[] = res?.data ?? res ?? [];
        if (!cancelled && Array.isArray(raw)) {
          // enrich with subjectName
          const subjectMap = new Map(subjects.flatMap((s) => s.topics.map((t) => [t.id, s.name])));
          const enriched = raw
            .map((t) => ({ ...t, subjectName: subjectMap.get(t.id) ?? '', masteryScore: t.masteryScore ?? t.mastery ?? 0 }))
            .sort((a, b) => a.masteryScore - b.masteryScore);
          setWeakTopics(enriched);
        }
      } catch {
        setWeakTopics([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [subjects]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
            <div className="h-5 w-3/4 rounded bg-muted mb-2" />
            <div className="h-3 w-1/2 rounded bg-muted mb-4" />
            <div className="h-1.5 rounded bg-muted mb-4" />
            <div className="flex gap-2"><div className="h-8 flex-1 rounded bg-muted" /><div className="h-8 flex-1 rounded bg-muted" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (weakTopics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">All topics strong!</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You have no weak topics for this course. Keep practising to maintain mastery.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        Showing <strong className="text-foreground">{weakTopics.length}</strong> topics that need attention, ordered by lowest mastery first.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {weakTopics.map((t) => (
          <WeakTopicCard key={t.id} topic={t} courseId={courseId} />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────────
// Sub-component: Chapters view (teacher-uploaded PDFs / videos)
// ────────────────────────────────────────────────────────────────────────────────

function ChaptersView({ chapters, courseId }: { chapters: ChapterWithContent[]; courseId: string }) {
  const router = useRouter();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(
    chapters[0]?.id ?? null
  );

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold">No content uploaded yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Your teacher will upload PDFs and videos here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => (
        <div key={chapter.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold shrink-0">
                {chapter.orderIndex + 1}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{chapter.name}</p>
                {chapter.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{chapter.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="outline" className="text-xs">
                {chapter.content.length} {chapter.content.length === 1 ? 'item' : 'items'}
              </Badge>
              <ChevronRight
                className={cn('h-4 w-4 text-muted-foreground transition-transform', {
                  'rotate-90': expandedChapter === chapter.id,
                })}
              />
            </div>
          </button>

          {expandedChapter === chapter.id && (
            <div className="border-t border-border px-5 py-3 space-y-2">
              {chapter.content.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No materials uploaded for this chapter yet.</p>
              ) : (
                chapter.content.map((item) => (
                  <a
                    key={item.id}
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                      item.type === 'youtube' ? 'bg-red-50 dark:bg-red-950' : 'bg-blue-50 dark:bg-blue-950'
                    )}>
                      {item.type === 'youtube'
                        ? <PlayCircle className="h-5 w-5 text-red-500" />
                        : <FileText className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))
              )}
              <div className="pt-1 pb-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => router.push(`/student/ai-tutor?chapterId=${chapter.id}&courseId=${courseId}`)}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Ask AI Tutor about this chapter
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const store = useCourseStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [chapters, setChapters] = useState<ChapterWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CourseTab>('teacher');

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [courseRes, subjectsRes, chaptersRes] = await Promise.all([
          curriculumService.getCourse(courseId) as Promise<any>,
          curriculumService.getSubjects(courseId) as Promise<any>,
          curriculumService.getChapters(courseId) as Promise<any>,
        ]);

        const courseData: Course = courseRes?.data ?? courseRes;
        const subjectsData: Subject[] = (Array.isArray(subjectsRes?.data)
          ? subjectsRes.data
          : Array.isArray(subjectsRes)
          ? subjectsRes
          : []);

        if (cancelled) return;
        if (courseData) setCourse(courseData);

        // Load chapters (teacher-uploaded content)
        const chaptersData: ChapterWithContent[] = Array.isArray(chaptersRes?.chapters)
          ? chaptersRes.chapters
          : [];
        if (!cancelled) setChapters(chaptersData);

        if (subjectsData.length > 0) {
          store.setSubjects(courseId, subjectsData);
          const withTopics = await Promise.all(
            subjectsData.map(async (s) => {
              try {
                const topicsRes = await curriculumService.getTopics(s.id) as any;
                const topics: Topic[] = Array.isArray(topicsRes?.data)
                  ? topicsRes.data
                  : Array.isArray(topicsRes)
                  ? topicsRes
                  : [];
                return { ...s, topics };
              } catch {
                return { ...s, topics: [] as Topic[] };
              }
            })
          );
          if (!cancelled) setSubjects(withTopics);
        } else {
          setSubjects([]);
        }
      } catch (e) {
        console.error('[CourseDetailPage] load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-2 mt-4"><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-32" /></div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold">Course Not Found</h2>
          <Link href="/student/courses" className="mt-4 text-primary hover:underline">
            Back to Courses
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/student/courses"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          My Courses
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
          {course.description && (
            <p className="mt-1 text-muted-foreground max-w-3xl">{course.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span><Layers className="inline h-3.5 w-3.5 mr-1" />{chapters.length > 0 ? chapters.length : subjects.length} chapters</span>
            {subjects.length > 0 && (
              <span>
                <FaBook className="inline h-3.5 w-3.5 mr-1" />
                {subjects.reduce((acc, s) => acc + s.topics.length, 0)} topics
              </span>
            )}
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
          {([ 
            { id: 'teacher', label: 'Teacher Resources', icon: FaBook },
            { id: 'adaptive', label: 'Adaptive Resources', icon: Lightbulb },
            { id: 'assignments', label: 'Assignments', icon: ClipboardList },
          ] as { id: CourseTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                tab === id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'assignments' ? (
          <AssignmentsTab courseId={courseId} />
        ) : tab === 'teacher' ? (
          // Show chapters view when chapters exist (course uses Chapter model),
          // fall back to legacy Subject→Topic view if only subjects are present
          chapters.length > 0 ? (
            <ChaptersView chapters={chapters} courseId={courseId} />
          ) : subjects.length > 0 ? (
            <TeacherResources subjects={subjects} courseId={courseId} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold">No curriculum content available yet.</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later or contact your instructor.</p>
            </div>
          )
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold">No curriculum content available yet.</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back later or contact your instructor.</p>
          </div>
        ) : (
          <AdaptiveResources subjects={subjects} courseId={courseId} />
        )}
      </div>
    </DashboardLayout>
  );
}