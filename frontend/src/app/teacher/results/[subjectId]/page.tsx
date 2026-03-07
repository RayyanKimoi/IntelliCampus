'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, PlayCircle, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_TEACHER_ASSIGNMENTS_FULL } from '@/lib/mockData';
import { motion, AnimatePresence } from 'motion/react';

// ─── Mock quiz data ────────────────────────────────────────────────────────
const MOCK_QUIZZES = [
  { id: 'q1', title: 'Quiz 1 — Fundamentals',           questions: 20, avgScore: 78 },
  { id: 'q2', title: 'Quiz 2 — Data Structures',        questions: 15, avgScore: 65 },
  { id: 'q3', title: 'Quiz 3 — Algorithms & Complexity', questions: 25, avgScore: 82 },
];

// ─── Skeleton Components ─────────────────────────────────────────────
function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-28 bg-muted/70 rounded-full" />
      <div className="h-8 w-64 bg-muted/70 rounded-lg" />
      <div className="h-4 w-96 bg-muted/50 rounded-md" />
    </div>
  );
}

function AssignmentCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card/30 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-muted/70 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted/70 rounded w-1/2" />
      </div>
      <div className="h-6 w-20 bg-muted/50 rounded-full" />
    </div>
  );
}

export default function SubjectEvaluationPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const router = useRouter();
  const { subjectId } = use(params);

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { MOCK_TEACHER_COURSES_RICH } = await import('@/lib/mockData');
      const course = MOCK_TEACHER_COURSES_RICH.find((c: any) => c.id === subjectId);
      setCourseName(course?.name || 'Unknown Subject');

      await new Promise(r => setTimeout(r, 500));
      const fetchedAssignments = MOCK_TEACHER_ASSIGNMENTS_FULL[subjectId] || [];
      setAssignments(fetchedAssignments);
      setQuizzes(MOCK_QUIZZES);
    } catch (err) {
      console.error('Error loading subject evaluation data', err);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssignments = assignments.filter(a => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'graded') return a.pendingCount === 0;
    if (assignmentFilter === 'ungraded') return a.pendingCount > 0;
    return true;
  });

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header with Back button */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4"
        >
          <button
            onClick={() => router.push('/teacher/results')}
            className="group flex items-center w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-1.5 rounded-full bg-muted/60 group-hover:bg-muted mr-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </button>

          {loading ? (
            <PageHeaderSkeleton />
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-xs font-semibold tracking-widest uppercase w-fit mb-2 border border-primary/20">
                Subject Evaluation
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {courseName}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mt-1.5">
                Manage assignments and quizzes. Review student submissions and auto-graded results.
              </p>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-8 pt-4">
            {/* Tab skeleton */}
            <div className="flex justify-center">
              <div className="h-12 w-72 bg-muted/60 rounded-full animate-pulse" />
            </div>
            {/* Assignment skeletons */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <AssignmentCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="assignments" className="w-full">
            {/* Centered pill toggle */}
            <div className="flex justify-center mb-8">
              <TabsList className="bg-muted dark:bg-slate-800 backdrop-blur-md w-[300px] h-11 p-1 rounded-full grid grid-cols-2 shadow-sm border border-border dark:border-slate-600">
                <TabsTrigger
                  value="assignments"
                  className="rounded-full text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground dark:text-slate-400 transition-all"
                >
                  Assignments
                </TabsTrigger>
                <TabsTrigger
                  value="quizzes"
                  className="rounded-full text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground dark:text-slate-400 transition-all"
                >
                  Quizzes
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Assignments Tab ── */}
            <TabsContent value="assignments" className="outline-none space-y-5 mt-0">
              <div className="flex justify-end">
                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-[180px] bg-card border-border/60 hover:bg-muted/40 transition-colors rounded-xl h-9 text-sm font-medium">
                    <SelectValue placeholder="Filter..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 shadow-lg">
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="graded">Fully Graded</SelectItem>
                    <SelectItem value="ungraded">Needs Grading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredAssignments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 flex flex-col items-center justify-center bg-muted/20 dark:bg-muted/10 border border-border/50 rounded-2xl"
                >
                  <div className="p-4 bg-muted/60 dark:bg-muted/30 rounded-full mb-4">
                    <FileText className="w-7 h-7 opacity-40 text-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">No assignments found</h3>
                  <p className="text-muted-foreground mt-1 max-w-xs text-sm">There are no assignments matching the current criteria.</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  <div className="grid gap-3">
                    {filteredAssignments.map((assignment, i) => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                        whileHover={{ x: 3 }}
                      >
                        <Card
                          className="group relative overflow-hidden cursor-pointer border border-border/60 dark:border-white/[0.06] bg-card shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-250 rounded-2xl"
                          onClick={() => router.push(`/teacher/results/${subjectId}/assignment/${assignment.id}`)}
                        >
                          {/* Left accent bar */}
                          <div className="absolute inset-y-0 left-0 w-[3px] bg-primary/0 group-hover:bg-primary transition-colors duration-300 rounded-l-2xl" />

                          <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-primary/10 dark:bg-primary/15 text-primary dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform duration-200">
                                <FileText className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                              </div>
                              <span className="font-semibold text-[15px] text-foreground group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
                                {assignment.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {assignment.pendingCount === 0 ? (
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold tracking-wide uppercase rounded-full border border-emerald-200/70 dark:border-emerald-500/20">
                                  Graded
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold tracking-wide uppercase rounded-full border border-amber-200/70 dark:border-amber-500/20">
                                  {assignment.pendingCount} Ungraded
                                </span>
                              )}
                              <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            {/* ── Quizzes Tab ── */}
            <TabsContent value="quizzes" className="outline-none space-y-5 mt-0">
              {quizzes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 flex flex-col items-center justify-center bg-muted/20 dark:bg-muted/10 border border-border/50 rounded-2xl"
                >
                  <div className="p-4 bg-muted/60 dark:bg-muted/30 rounded-full mb-4">
                    <PlayCircle className="w-7 h-7 opacity-40 text-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">No quizzes yet</h3>
                  <p className="text-muted-foreground mt-1 max-w-xs text-sm">There are no quizzes created for this subject.</p>
                </motion.div>
              ) : (
                <div className="grid gap-3">
                  {quizzes.map((quiz, i) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                    >
                      <Card
                        className="group relative overflow-hidden cursor-pointer border border-border/60 dark:border-white/[0.06] bg-card shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-250 rounded-2xl"
                        onClick={() => router.push(`/teacher/results/${subjectId}/quiz/${quiz.id}`)}
                      >
                        {/* Left accent bar */}
                        <div className="absolute inset-y-0 left-0 w-[3px] bg-primary/0 group-hover:bg-primary transition-colors duration-300 rounded-l-2xl" />
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg group-hover:scale-105 transition-transform duration-200">
                              <PlayCircle className="w-[18px] h-[18px]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[15px] text-foreground group-hover:text-primary dark:group-hover:text-blue-400 transition-colors leading-tight">{quiz.title}</p>
                              <p className="text-[12px] text-muted-foreground mt-0.5">{quiz.questions} questions · Avg {quiz.avgScore}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-[11px] font-bold tracking-wide uppercase rounded-full border border-violet-200/70 dark:border-violet-500/20">
                              Auto-graded
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
