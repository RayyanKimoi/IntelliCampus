'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { curriculumService, Course, Subject } from '@/services/curriculumService';
import { masteryService } from '@/services/masteryService';
import { useCourseStore } from '@/store/courseStore';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MOCK_COURSES } from '@/lib/mockData';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface CourseWithMeta extends Course {
  subjectCount: number;
  mastery: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function masteryLabel(pct: number) {
  if (pct >= 80) return { text: 'Strong', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  if (pct >= 50) return { text: 'Developing', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  return { text: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
}

function masteryBarColor(pct: number) {
  if (pct >= 80) return '[&>*]:bg-green-500';
  if (pct >= 50) return '[&>*]:bg-amber-500';
  return '[&>*]:bg-red-500';
}

// ──────────────────────────────────────────────────────────────────────────────
// Subject Card
// ──────────────────────────────────────────────────────────────────────────────

function SubjectCard({ course }: { course: CourseWithMeta }) {
  const label = masteryLabel(course.mastery);

  return (
    <Link href={`/student/courses/${course.id}`} className="group block">
      <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary/60 to-primary/20" />
        <div className="flex items-start justify-between mb-4 mt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className={cn('text-xs font-medium border', label.bg, label.color)}>
            {label.text}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-card-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
          {course.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[32px]">
          {course.description || 'No description provided.'}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{course.subjectCount} {course.subjectCount === 1 ? 'chapter' : 'chapters'}</span>
          </div>
          {course.mastery > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              {course.mastery >= 80
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              <span className={label.color}>{Math.round(course.mastery)}% mastery</span>
            </div>
          )}
        </div>
        <Progress value={course.mastery} className={cn('h-1.5', masteryBarColor(course.mastery))} />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {course.mastery === 0 ? 'Not started' : `${Math.round(course.mastery)}% complete`}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CourseSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="h-10 w-10 rounded-lg bg-muted" />
        <div className="h-5 w-20 rounded-full bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded bg-muted mb-2" />
      <div className="h-4 w-full rounded bg-muted mb-1" />
      <div className="h-4 w-2/3 rounded bg-muted mb-4" />
      <div className="h-1.5 w-full rounded bg-muted" />
    </div>
  );
}

export default function StudentCoursesPage() {
  const { courses, subjectsByCourse, masteryByCourse, setCourses, setSubjects, setCourseMastery, coursesLoaded } =
    useCourseStore();
  const [loading, setLoading] = useState(!coursesLoaded);

  useEffect(() => {
    if (coursesLoaded) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const courseRes = await curriculumService.getCourses() as any;
        const rawCourses: Course[] = courseRes?.data ?? courseRes ?? [];
        if (cancelled || !Array.isArray(rawCourses)) return;

        // Fall back to mock data when API returns empty array
        const coursesToUse: Course[] = rawCourses.length > 0 ? rawCourses : (MOCK_COURSES as unknown as Course[]);
        setCourses(coursesToUse);
        if (rawCourses.length === 0) {
          MOCK_COURSES.forEach((c) => setSubjects(c.id, []));
          if (!cancelled) setLoading(false);
          return;
        }

        await Promise.allSettled(
          coursesToUse.map(async (course) => {
            try {
              const [subjectsRes, masteryRes] = await Promise.allSettled([
                curriculumService.getSubjects(course.id) as Promise<any>,
                masteryService.getCourseMastery(course.id) as Promise<any>,
              ]);
              if (subjectsRes.status === 'fulfilled') {
                const subs: Subject[] = subjectsRes.value?.data ?? subjectsRes.value ?? [];
                if (Array.isArray(subs) && !cancelled) setSubjects(course.id, subs);
              }
              if (masteryRes.status === 'fulfilled') {
                const m = masteryRes.value?.data ?? masteryRes.value;
                if (m && !cancelled) setCourseMastery(course.id, m);
              }
            } catch {}
          })
        );
      } catch (e) {
        console.error('[CoursesPage] failed to load courses', e);
        if (!cancelled) {
          setCourses(MOCK_COURSES as any);
          MOCK_COURSES.forEach((c) => setSubjects(c.id, []));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [coursesLoaded, setCourses, setSubjects, setCourseMastery]);

  const coursesWithMeta: CourseWithMeta[] = courses.map((c) => ({
    ...c,
    subjectCount: (c as any).subjectCount ?? (subjectsByCourse[c.id] ?? []).length,
    mastery: Math.round((c as any).mastery ?? masteryByCourse[c.id]?.overallMastery ?? 0),
  }));

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Select a subject to view resources, notes, and adaptive learning content.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)}
          </div>
        ) : coursesWithMeta.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold">No courses enrolled</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Your enrolled courses will appear here. Contact your instructor to get access.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coursesWithMeta.map((course) => (
              <SubjectCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {!loading && coursesWithMeta.length > 0 && (
          <div className="flex items-center gap-6 rounded-lg border border-border bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{coursesWithMeta.length}</strong> enrolled</span>
            <span><strong className="text-green-600">{coursesWithMeta.filter((c) => c.mastery >= 80).length}</strong> mastered</span>
            <span><strong className="text-amber-600">{coursesWithMeta.filter((c) => c.mastery < 50 && c.mastery > 0).length}</strong> need attention</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
