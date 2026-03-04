'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { curriculumService } from '@/services/curriculumService';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClipboardCheck, ChevronRight, Layers } from 'lucide-react';
import { MOCK_ASSIGNMENT_SUBJECTS } from '@/lib/mockData';

interface SubjectMeta {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  totalAssignments: number;
  pendingCount: number;
}

export default function AssignmentsPage() {
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [assignmentsRes, coursesRes] = await Promise.allSettled([
          assessmentService.getAssignments() as Promise<any>,
          curriculumService.getCourses() as Promise<any>,
        ]);

        if (cancelled) return;

        const assignments: Assignment[] = assignmentsRes.status === 'fulfilled'
          ? (assignmentsRes.value?.data ?? assignmentsRes.value ?? [])
          : [];

        const courses: any[] = coursesRes.status === 'fulfilled'
          ? (coursesRes.value?.data ?? coursesRes.value ?? [])
          : [];

        if (!Array.isArray(assignments) || !Array.isArray(courses)) return;

        // Fetch subjects for all courses
        const subjectMap = new Map<string, SubjectMeta>();

        // Group assignments by courseId first
        const assignmentsByCourse = new Map<string, Assignment[]>();
        for (const a of assignments) {
          if (!a.courseId) continue;
          if (!assignmentsByCourse.has(a.courseId)) assignmentsByCourse.set(a.courseId, []);
          assignmentsByCourse.get(a.courseId)!.push(a);
        }

        // If assignments have subjectId, group by that — else group by courseId
        const hasSubjects = assignments.some(a => a.subjectId);

        if (hasSubjects) {
          const subjectIdSet = new Set(assignments.map(a => a.subjectId).filter(Boolean) as string[]);
          for (const subjectId of subjectIdSet) {
            const subAssignments = assignments.filter(a => a.subjectId === subjectId);
            const sample = subAssignments[0];
            subjectMap.set(subjectId, {
              id: subjectId,
              name: sample.subjectName ?? `Subject ${subjectId.slice(0, 6)}`,
              courseId: sample.courseId,
              courseName: sample.courseName ?? '',
              totalAssignments: subAssignments.length,
              pendingCount: subAssignments.filter(a => a.status === 'pending').length,
            });
          }
        } else {
          // Fall back to course-level grouping
          for (const course of courses) {
            const courseAssignments = assignmentsByCourse.get(course.id) ?? [];
            if (courseAssignments.length === 0 && assignments.length > 0) continue;
            subjectMap.set(course.id, {
              id: course.id,
              name: course.name,
              courseId: course.id,
              courseName: course.name,
              totalAssignments: courseAssignments.length,
              pendingCount: courseAssignments.filter(a => a.status === 'pending').length,
            });
          }
          // Handle case where we have assignments but couldn't match to courses
          if (subjectMap.size === 0 && assignments.length > 0) {
            const grouped = new Map<string, Assignment[]>();
            for (const a of assignments) {
              const key = a.courseId;
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(a);
            }
            grouped.forEach((list, courseId) => {
              subjectMap.set(courseId, {
                id: courseId,
                name: list[0].courseName ?? courseId,
                courseId,
                courseName: list[0].courseName ?? '',
                totalAssignments: list.length,
                pendingCount: list.filter(a => a.status === 'pending').length,
              });
            });
          }
        }

        const result = Array.from(subjectMap.values());
        if (!cancelled) setSubjects(result.length > 0 ? result : MOCK_ASSIGNMENT_SUBJECTS);
      } catch (e) {
        console.error('[AssignmentsPage]', e);
        if (!cancelled) setSubjects(MOCK_ASSIGNMENT_SUBJECTS);
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
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">Subject-wise assignments and submissions.</p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse h-36" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Assignments from your teachers will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subjects.map(s => (
              <Link
                key={s.id}
                href={`/student/assessment/assignments/${s.id}`}
                className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
              >
                <div className="relative inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary/60 to-primary/20 -mt-6 mx-0 mb-4 rounded-t-xl" />
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  {s.pendingCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{s.pendingCount} pending</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{s.name}</h3>
                {s.courseName && s.courseName !== s.name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{s.courseName}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{s.totalAssignments} assignment{s.totalAssignments !== 1 ? 's' : ''}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={cn('text-xs font-medium', s.pendingCount > 0 ? 'text-amber-600' : 'text-green-600')}>
                    {s.pendingCount > 0 ? `${s.pendingCount} to submit` : 'All submitted'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
