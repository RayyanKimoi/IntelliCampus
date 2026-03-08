'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookMarked, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { chapterCurriculumService, Course } from '@/services/chapterCurriculumService';

interface Subject {
  id: string;
  name: string;
  description: string;
  enrolledStudents?: number;
  avgMastery?: number;
}

// ─── Skeleton Card ─────────────────────────────────────────────
function SubjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-6 animate-pulse space-y-5">
      <div className="flex justify-between items-start">
        <div className="w-11 h-11 rounded-xl bg-muted/70" />
        <div className="w-7 h-7 rounded-full bg-muted/50" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-muted/70 rounded-lg w-3/4" />
        <div className="h-3 bg-muted/50 rounded-md w-1/2" />
      </div>
      <div className="h-px bg-border/40 w-full" />
      <div className="flex justify-between">
        <div className="h-3.5 bg-muted/50 rounded w-24" />
        <div className="h-3.5 bg-muted/50 rounded w-14" />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const courses = await chapterCurriculumService.getTeacherCourses();
      // Map Course[] to Subject[]
      const mappedSubjects = courses.map((course: Course) => ({
        id: course.id,
        name: course.name,
        description: course.description || '',
        enrolledStudents: 0, // TODO: Add enrollment count from DB
        avgMastery: 0, // TODO: Add mastery calculation
      }));
      setSubjects(mappedSubjects);
    } catch (err) {
      console.error('Failed to load subjects', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-1.5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-xs font-semibold tracking-widest uppercase w-fit mb-2 border border-primary/20">
            <BookMarked className="w-3.5 h-3.5" />
            Teacher Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Evaluation & Results
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            Select a subject to view grading progress, evaluate assignments, and monitor student performance across your courses.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SubjectCardSkeleton key={i} />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm"
          >
            <div className="p-4 bg-muted/60 rounded-full mb-4 ring-1 ring-border/50">
              <BookMarked className="w-8 h-8 opacity-40 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No subjects found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">You haven't been assigned any subjects to evaluate yet.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
                whileHover={{ y: -3 }}
              >
                <Card
                  className="group relative h-full flex flex-col overflow-hidden border border-border/60 dark:border-white/[0.06] bg-card shadow-sm hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 transition-all duration-400 cursor-pointer rounded-2xl"
                  onClick={() => router.push(`/teacher/results/${subject.id}`)}
                >
                  {/* Top gradient accent on hover */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Subtle gradient wash on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-sky-500/0 to-indigo-500/0 group-hover:from-primary/5 group-hover:via-sky-500/3 group-hover:to-indigo-500/5 transition-all duration-500 pointer-events-none" />

                  <CardContent className="p-6 flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-primary/10 dark:bg-primary/15 text-primary dark:text-blue-400 rounded-xl ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="p-1.5 rounded-full bg-muted/60 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-[17px] font-semibold mb-1 text-foreground group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-300 leading-snug">
                      {subject.name}
                    </h3>

                    <div className="mt-auto space-y-4 pt-4">
                      <div className="h-px w-full bg-border/60" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{subject.enrolledStudents || 0} Students</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
