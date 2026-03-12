'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { curriculumService } from '@/services/curriculumService';
import { FileQuestion, ChevronRight, Layers } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  name: string;
  description: string;
  assignmentCount?: number;
}

export default function QuizzesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await curriculumService.getCourses() as any;
        if (!cancelled) {
          const data: EnrolledCourse[] = res?.data ?? res ?? [];
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('[QuizzesPage]', e);
        if (!cancelled) setCourses([]);
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
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Select a course to view its quizzes.</p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg">No courses enrolled</h3>
            <p className="text-sm text-muted-foreground mt-1">Enroll in a course to see its quizzes.</p>
          </div>
        ) : (
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {courses.map((course) => (
              <motion.div
                key={course.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
              >
                <Link
                  href={`/student/assessment/quizzes/${course.id}`}
                  className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileQuestion className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{course.name}</h3>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    <span>View quizzes</span>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
