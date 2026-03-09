'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Users } from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import { motion } from 'motion/react';
import { chapterCurriculumService } from '@/services/chapterCurriculumService';
import { teacherService } from '@/services/teacherService';
import {
  EvaluationTable,
  StudentEvaluationRow,
} from '@/components/teacher/EvaluationTable';

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-24 bg-muted/70 rounded-full" />
      <div className="h-8 w-56 bg-muted/70 rounded-lg" />
      <div className="h-4 w-80 bg-muted/50 rounded-md" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 animate-pulse">
      <div className="h-10 bg-muted/50" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 h-16 border-t border-border/40">
          <div className="w-8 h-8 rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted/60 rounded w-1/3" />
            <div className="h-3 bg-muted/40 rounded w-1/4" />
          </div>
          <div className="h-6 w-14 bg-muted/50 rounded" />
          <div className="h-6 w-14 bg-muted/50 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EvaluationCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const { courseId } = use(params);

  const [courseName, setCourseName] = useState('');
  const [students, setStudents] = useState<StudentEvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Course name
      const courses = await chapterCurriculumService.getTeacherCourses();
      const course = courses.find((c) => c.id === courseId);
      setCourseName(course?.name ?? 'Course');

      // Students with evaluation data
      const resp = await teacherService.getCourseStudents(courseId);
      const rows: StudentEvaluationRow[] = resp.data ?? resp ?? [];
      setStudents(rows);
    } catch (err) {
      console.error('[EvaluationCoursePage] Failed to load:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/teacher/results')}
          className="group flex items-center w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="p-1.5 rounded-full bg-muted/60 group-hover:bg-muted mr-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Evaluation
        </button>

        {/* Header */}
        {loading ? (
          <HeaderSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-xs font-semibold tracking-widest uppercase w-fit mb-2 border border-primary/20">
              <FaBook className="w-3.5 h-3.5" />
              Course Evaluation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {courseName}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              <span>{students.length} enrolled student{students.length !== 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        )}

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Enter a score (0–100) and optional feedback for each student, then click{' '}
                <span className="font-medium text-foreground">Save</span>. Saved evaluations
                persist across page reloads.
              </p>
            </div>

            <EvaluationTable
              courseId={courseId}
              students={students}
              onRefresh={loadData}
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
