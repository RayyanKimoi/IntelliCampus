'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatWindow } from '@/components/ai/ChatWindow';
import { useCourseStore } from '@/store/courseStore';
import { curriculumService, Course, Subject } from '@/services/curriculumService';
import { masteryService } from '@/services/masteryService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Brain,
  MessageSquare,
  Lightbulb,
  ImageIcon,
  Layers,
  ChevronDown,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TopicOption {
  topicId: string;
  topicName: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  masteryLevel?: number;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Explain simpler',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    prompt: 'Please explain this concept in a simpler way with an easy analogy.',
  },
  {
    label: 'Give example',
    icon: <Layers className="h-3.5 w-3.5" />,
    prompt: 'Give me a real-world example to better understand this.',
  },
  {
    label: 'Visual breakdown',
    icon: <ImageIcon className="h-3.5 w-3.5" />,
    prompt: 'Describe this concept visually, as if drawing it step by step.',
  },
  {
    label: 'Test me',
    icon: <Brain className="h-3.5 w-3.5" />,
    prompt: 'Ask me a quick question to test if I understand this topic.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Source Reference Panel
// ─────────────────────────────────────────────────────────────────────────────

function SourceReferencePanel({
  topic,
  masteryLevel,
}: {
  topic: TopicOption | null;
  masteryLevel: number;
}) {
  const masteryColor =
    masteryLevel >= 80 ? 'text-green-600' : masteryLevel >= 50 ? 'text-amber-600' : 'text-red-600';
  const masteryBarClass =
    masteryLevel >= 80
      ? '[&>*]:bg-green-500'
      : masteryLevel >= 50
      ? '[&>*]:bg-amber-500'
      : '[&>*]:bg-red-500';

  return (
    <aside className="w-72 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Session Info
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Current topic */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Current Topic</p>
          {topic ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-sm font-semibold">{topic.topicName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{topic.courseName}</p>
              <p className="text-xs text-muted-foreground">{topic.subjectName}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">No topic selected</p>
            </div>
          )}
        </div>

        {/* Mastery impact */}
        {topic && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Topic Mastery</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current level</span>
                <span className={cn('font-mono font-medium', masteryColor)}>
                  {masteryLevel > 0 ? `${masteryLevel}%` : 'Not assessed'}
                </span>
              </div>
              {masteryLevel > 0 && (
                <Progress value={masteryLevel} className={cn('h-2', masteryBarClass)} />
              )}
              {masteryLevel < 50 && masteryLevel > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Weak area — keep practicing!
                </p>
              )}
            </div>
          </div>
        )}

        {/* RAG governance notice */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">AI Governance</p>
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Answers use only your curriculum content
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                No external knowledge or hallucinations
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground">Sources verified by RAG retrieval</p>
            </div>
          </div>
        </div>

        {/* Mode explanation */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Learning Mode</p>
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium text-primary">Full Explanation Mode</p>
            </div>
            <p className="text-xs text-muted-foreground">
              The AI will explain, clarify, and guide using your course materials.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner content (needs useSearchParams — wrapped in Suspense)
// ─────────────────────────────────────────────────────────────────────────────

interface ChatState {
  topicId: string;
  courseId: string;
  topicName: string;
  selectedKey: string;
}

function AiTutorContent() {
  const searchParams = useSearchParams();
  const paramTopicId = searchParams.get('topicId');
  const paramCourseId = searchParams.get('courseId');

  const { courses, subjectsByCourse, topicsBySubject, masteryByCourse, setCourses, setSubjects, setTopics, coursesLoaded } =
    useCourseStore();

  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [chatState, setChatState] = useState<ChatState | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load courses + topics if not cached ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let courseList = courses;

        if (!coursesLoaded) {
          const res = await curriculumService.getCourses() as any;
          courseList = res?.data ?? res ?? [];
          if (!cancelled && Array.isArray(courseList)) setCourses(courseList);
        }

        const options: TopicOption[] = [];

        await Promise.allSettled(
          courseList.map(async (course: Course) => {
            let subjectList = subjectsByCourse[course.id];
            if (!subjectList) {
              const sRes = await curriculumService.getSubjects(course.id) as any;
              subjectList = sRes?.data ?? sRes ?? [];
              if (!cancelled && Array.isArray(subjectList)) setSubjects(course.id, subjectList);
            }

            for (const subject of (subjectList || [])) {
              let topicList = topicsBySubject[subject.id];
              if (!topicList) {
                const tRes = await curriculumService.getTopics(subject.id) as any;
                topicList = tRes?.data ?? tRes ?? [];
                if (!cancelled && Array.isArray(topicList)) setTopics(subject.id, topicList);
              }

              for (const topic of (topicList || [])) {
                options.push({
                  topicId: topic.id,
                  topicName: topic.name,
                  courseId: course.id,
                  courseName: course.name,
                  subjectName: subject.name,
                });
              }
            }
          })
        );

        if (!cancelled) {
          setTopicOptions(options);

          // Auto-select from URL params or first topic
          if (paramTopicId && paramCourseId) {
            const match = options.find((o) => o.topicId === paramTopicId);
            if (match) {
              setChatState({
                topicId: match.topicId,
                courseId: match.courseId,
                topicName: match.topicName,
                selectedKey: match.topicId,
              });
            }
          } else if (options.length > 0) {
            const first = options[0];
            setChatState({
              topicId: first.topicId,
              courseId: first.courseId,
              topicName: first.topicName,
              selectedKey: first.topicId,
            });
          }
        }
      } catch (e) {
        console.error('[AiTutor] load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const selectedTopic =
    chatState ? topicOptions.find((t) => t.topicId === chatState.topicId) ?? null : null;

  const masteryForTopic =
    selectedTopic && masteryByCourse[selectedTopic.courseId]
      ? Math.round(
          (masteryByCourse[selectedTopic.courseId].byTopic ?? []).find(
            (t) => t.topicId === selectedTopic.topicId
          )?.masteryLevel ?? 0
        )
      : 0;

  // Group topics by course for the select
  const courseGroups = courses.map((course) => ({
    courseId: course.id,
    courseName: course.name,
    topics: topicOptions.filter((t) => t.courseId === course.id),
  })).filter((g) => g.topics.length > 0);

  const handleTopicChange = (value: string) => {
    const topic = topicOptions.find((t) => t.topicId === value);
    if (topic) {
      setChatState({
        topicId: topic.topicId,
        courseId: topic.courseId,
        topicName: topic.topicName,
        selectedKey: topic.topicId,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + topic selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Tutor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ask anything about your curriculum. I use only teacher-approved content.
          </p>
        </div>

        {/* Topic selector */}
        <div className="w-full sm:w-72">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={chatState?.topicId ?? ''}
              onValueChange={handleTopicChange}
              disabled={topicOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={topicOptions.length === 0 ? 'No topics available' : 'Select a topic'}
                />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {courseGroups.map((group) => (
                  <SelectGroup key={group.courseId}>
                    <SelectLabel className="text-xs font-semibold text-primary px-2">
                      {group.courseName}
                    </SelectLabel>
                    {group.topics.map((t) => (
                      <SelectItem key={t.topicId} value={t.topicId}>
                        <div className="flex flex-col">
                          <span>{t.topicName}</span>
                          <span className="text-xs text-muted-foreground">{t.subjectName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      {chatState && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Badge
              key={action.label}
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors text-xs font-medium"
            >
              {action.icon}
              {action.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Main layout: Chat + Source Panel */}
      <div className="flex gap-4 h-[calc(100vh-16rem)] min-h-[500px]">
        {/* Chat window */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : chatState ? (
            <ChatWindow
              key={chatState.selectedKey}
              topicId={chatState.topicId}
              courseId={chatState.courseId}
              topicName={chatState.topicName}
              mode="learning"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card text-center p-8">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {topicOptions.length === 0
                    ? 'Enroll in a course to start chatting with your AI tutor.'
                    : 'Select a topic above to start a session.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Source reference panel */}
        <SourceReferencePanel topic={selectedTopic} masteryLevel={masteryForTopic} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentAiTutorPage() {
  return (
    <DashboardLayout requiredRole="student">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        }
      >
        <AiTutorContent />
      </Suspense>
    </DashboardLayout>
  );
}
