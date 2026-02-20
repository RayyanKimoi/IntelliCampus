'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { curriculumService } from '@/services/curriculumService';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileQuestion, ChevronRight, Layers, Clock, CheckCircle2 } from 'lucide-react';

interface SubjectQuizMeta {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  quizCount: number;
  completedCount: number;
  hasPrerequisite: boolean;
  averageScore?: number;
}

export default function QuizzesPage() {
  const [subjects, setSubjects] = useState<SubjectQuizMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [quizzesRes, coursesRes] = await Promise.allSettled([
          assessmentService.getQuizzes() as Promise<any>,
          curriculumService.getCourses() as Promise<any>,
        ]);
        if (cancelled) return;

        const quizzes: Assignment[] = quizzesRes.status === 'fulfilled'
          ? (quizzesRes.value?.data ?? quizzesRes.value ?? [])
          : [];

        const courses: any[] = coursesRes.status === 'fulfilled'
          ? (coursesRes.value?.data ?? coursesRes.value ?? [])
          : [];

        if (!Array.isArray(quizzes)) {
          // Fallback: treat assignments as quizzes
        }

        const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];

        // Group by subjectId or courseId
        const map = new Map<string, SubjectQuizMeta>();

        const hasSubjects = safeQuizzes.some(q => q.subjectId);
        if (hasSubjects) {
          for (const q of safeQuizzes) {
            const key = q.subjectId ?? q.courseId;
            if (!key) continue;
            if (!map.has(key)) {
              map.set(key, {
                id: key,
                name: q.subjectName ?? q.courseName ?? 'Subject',
                courseId: q.courseId,
                courseName: q.courseName ?? '',
                quizCount: 0,
                completedCount: 0,
                hasPrerequisite: false,
              });
            }
            const entry = map.get(key)!;
            entry.quizCount += 1;
            if (q.status === 'graded' || q.status === 'submitted') entry.completedCount += 1;
            if (q.type === 'prerequisite') entry.hasPrerequisite = true;
          }
        } else {
          // Group by courseId, use courses list
          const byCourse = new Map<string, Assignment[]>();
          for (const q of safeQuizzes) {
            if (!q.courseId) continue;
            if (!byCourse.has(q.courseId)) byCourse.set(q.courseId, []);
            byCourse.get(q.courseId)!.push(q);
          }
          // If no quizzes at all, show courses as potential subjects
          const courseList = Array.isArray(courses) ? courses : [];
          for (const c of courseList) {
            const list = byCourse.get(c.id) ?? [];
            map.set(c.id, {
              id: c.id,
              name: c.name,
              courseId: c.id,
              courseName: c.name,
              quizCount: list.length,
              completedCount: list.filter(q => q.status === 'graded' || q.status === 'submitted').length,
              hasPrerequisite: list.some(q => q.type === 'prerequisite'),
            });
          }
          // Courses without any match from API
          if (map.size === 0 && safeQuizzes.length > 0) {
            byCourse.forEach((list, courseId) => {
              map.set(courseId, {
                id: courseId,
                name: list[0].courseName ?? courseId,
                courseId,
                courseName: list[0].courseName ?? '',
                quizCount: list.length,
                completedCount: list.filter(q => q.status === 'graded' || q.status === 'submitted').length,
                hasPrerequisite: false,
              });
            });
          }
        }

        if (!cancelled) setSubjects(Array.from(map.values()));
      } catch (e) {
        console.error('[QuizzesPage]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment</h1>
          <p className="text-muted-foreground mt-1">Graded quizzes — results count toward your academic record.</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Graded Assessment:</strong> These quizzes are graded and results feed into your mastery profile.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No quizzes available</h3>
            <p className="text-sm text-muted-foreground mt-1">Teacher-created quizzes will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subjects.map(s => {
              const pct = s.quizCount > 0 ? Math.round((s.completedCount / s.quizCount) * 100) : 0;
              return (
                <Link
                  key={s.id}
                  href={`/student/assessment/quizzes/${s.id}`}
                  className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileQuestion className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {s.hasPrerequisite && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-200 text-purple-600">Prerequisite</Badge>
                      )}
                      {pct === 100 && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Done</Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{s.name}</h3>
                  {s.courseName && s.courseName !== s.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{s.courseName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{s.quizCount} quiz{s.quizCount !== 1 ? 'zes' : ''}</span>
                    {s.completedCount > 0 && (
                      <span className="ml-auto text-green-600">{s.completedCount} done</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
