'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { StudentReviewSheet, type GradeSavePayload } from '@/components/evaluation/StudentReviewSheet';
import { teacherService } from '@/services/teacherService';

type CategoryFilter = 'all' | 'toppers' | 'average' | 'risky';
type StatusFilter = 'all' | 'not-submitted' | 'ai-graded' | 'teacher-graded';

// ─── Skeleton Components ─────────────────────────────────────────────
function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-24 bg-muted/70 rounded-full" />
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted/70 rounded-lg" />
          <div className="h-8 w-72 bg-muted/80 rounded-xl" />
        </div>
        <div className="w-64 space-y-2 hidden lg:block">
          <div className="h-3 bg-muted/50 rounded w-full" />
          <div className="h-2.5 bg-muted/40 rounded-full w-full" />
        </div>
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex gap-2.5 animate-pulse">
      {['w-28', 'w-36', 'w-36', 'w-32'].map((w, i) => (
        <div key={i} className={`h-9 ${w} bg-muted/50 rounded-full`} />
      ))}
    </div>
  );
}

function ActionBarSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-border/40 bg-card/30 animate-pulse">
      <div className="h-10 w-64 bg-muted/50 rounded-xl" />
      <div className="h-10 w-36 bg-muted/50 rounded-xl" />
      <div className="ml-auto h-10 w-44 bg-muted/50 rounded-xl" />
    </div>
  );
}

function StudentCardSkeleton() {
  return (
    <div className="flex items-center p-5 rounded-2xl border border-border/40 bg-card/30 animate-pulse">
      <div className="w-1 h-12 rounded-full bg-muted/50 mr-4 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted/70 rounded w-40" />
        <div className="h-3 bg-muted/40 rounded w-24" />
      </div>
      <div className="h-7 w-28 bg-muted/50 rounded-full" />
    </div>
  );
}

export default function AssignmentGradingPage({
  params,
}: {
  params: Promise<{ subjectId: string; assignmentId: string }>;
}) {
  const router = useRouter();
  const { subjectId, assignmentId } = use(params);

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewSubmission, setReviewSubmission] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch assignment results (submissions)
      const resultsResponse = await teacherService.getAssignmentResults(assignmentId);
      const results = resultsResponse.data || resultsResponse || [];
      
      // Map results to submission format
      const mappedSubmissions = results.map((result: any) => ({
        id: result.id,
        assignmentId: result.assignmentId,
        user: {
          id: result.student?.id || result.studentId,
          name: result.student?.name || 'Unknown Student',
          email: result.student?.email || '',
          avatarUrl: result.student?.profile?.avatarUrl,
        },
        score: result.score,
        completedAt: result.submittedAt,
        gradedAt: result.gradedAt,
        gradedBy: result.gradedBy,
        teacherComment: result.teacherComment,
        rubricScores: result.rubricScores,
        answers: result.studentAnswers || [],
      }));
      
      setSubmissions(mappedSubmissions);

      // Fetch assignment details
      const allAssignmentsResponse = await teacherService.getAssignments(subjectId);
      const allAssignments = allAssignmentsResponse.data || allAssignmentsResponse || [];
      const currentAssignment = allAssignments.find((a: any) => a.id === assignmentId);
      
      if (currentAssignment) {
        setAssignment({
          ...currentAssignment,
          _count: {
            attempts: mappedSubmissions.length,
          },
        });
      }
    } catch (err) {
      console.error('Failed to load grading view data', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId, assignmentId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived metrics
  const totalStudents = submissions.length || assignment?._count?.attempts || 0;
  const gradedCount = submissions.filter((s: any) => s.gradedAt).length;
  const isCompleted = totalStudents > 0 && gradedCount === totalStudents;
  const progressPercent = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;

  const avgScoreCalc =
    submissions.filter((s: any) => s.score !== undefined && s.score !== null)
      .reduce((acc: number, curr: any) => acc + curr.score, 0) /
    (submissions.filter((s: any) => s.score !== undefined).length || 1);

  const filteredSubmissions = submissions.filter((sub: any) => {
    if (searchQuery && !sub.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'teacher-graded' && !sub.gradedAt) return false;
    if (statusFilter === 'ai-graded' && (sub.gradedAt || !sub.completedAt)) return false;
    if (statusFilter === 'not-submitted' && sub.completedAt) return false;
    if (category === 'toppers' && sub.score < 85) return false;
    if (category === 'average' && (sub.score >= 85 || sub.score < 60)) return false;
    if (category === 'risky' && (sub.score === undefined || sub.score >= 60)) return false;
    return true;
  });

  const toggleSelectMode = () => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSubmissions.map((s: any) => s.id)));
  };
  const handleBatchMarkAsDone = () => {
    setSubmissions(prev =>
      prev.map((s: any) => selectedIds.has(s.id) ? { ...s, gradedAt: new Date().toISOString() } : s)
    );
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // Handle grade save from StudentReviewSheet
  const handleGradeSaved = (payload: GradeSavePayload) => {
    // Update the submission in the local state
    setSubmissions(prev =>
      prev.map((s: any) =>
        s.id === payload.submissionId
          ? {
              ...s,
              score: payload.score,
              teacherComment: payload.comment,
              rubricScores: payload.rubricScores,
              gradedAt: payload.gradedAt,
            }
          : s
      )
    );
    // Close the review sheet
    setReviewSubmission(null);
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-7">

        {/* ── Back button ── */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.push(`/teacher/results/${subjectId}`)}
          className="group flex items-center w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="p-1.5 rounded-full bg-muted/60 group-hover:bg-muted mr-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Subject
        </motion.button>

        {/* ── Header ── */}
        {loading ? (
          <HeaderSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row lg:items-start justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-[11px] font-semibold tracking-widest uppercase w-fit mb-2.5 border border-primary/20">
                Assignment Grading
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {assignment?.title || 'Assignment Details'}
              </h1>
            </div>

            {/* Progress / Completion */}
            {isCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-5 px-5 py-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/[0.08] border border-emerald-500/20 dark:border-emerald-500/15 shadow-sm w-fit flex-shrink-0"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs tracking-widest uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Grading Complete
                </div>
                <div className="border-l border-emerald-500/20 pl-5 text-muted-foreground text-sm font-medium flex items-center gap-1.5">
                  Avg Score:
                  <span className="font-bold text-foreground text-base">{avgScoreCalc.toFixed(2)}</span>
                </div>
              </motion.div>
            ) : (
              <div className="w-full lg:w-72 space-y-2.5 bg-card/60 dark:bg-card/30 border border-border/60 p-4 rounded-2xl shadow-sm flex-shrink-0">
                <div className="flex justify-between text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                  <span>Grading Progress</span>
                  <span className="text-foreground font-bold">{gradedCount}/{totalStudents}</span>
                </div>
                <div className="h-2 w-full bg-muted dark:bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-sky-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.round(progressPercent)}% complete</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Category Filters ── */}
        {loading ? (
          <FilterBarSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {([
              { id: 'all',     label: 'All Students',     count: submissions.length,                                      activeBg: 'bg-primary/10 dark:bg-primary/15',    border: 'border-primary/30',    text: 'text-primary dark:text-blue-400',    dot: 'bg-primary' },
              { id: 'toppers', label: 'Good Students',    count: submissions.filter((s:any) => s.score >= 85).length,    activeBg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-400/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
              { id: 'average', label: 'Average Students', count: submissions.filter((s:any) => s.score >= 60 && s.score < 85).length, activeBg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-400/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
              { id: 'risky',   label: 'Risky Students',  count: submissions.filter((s:any) => s.score !== undefined && s.score < 60).length, activeBg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-400/40', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
            ] as const).map(cat => {
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as CategoryFilter)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    isActive
                      ? `${cat.activeBg} ${cat.border} shadow-sm`
                      : 'bg-card border-border/50 hover:bg-muted/40 dark:hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? cat.dot : 'bg-muted-foreground/40'}`} />
                    <span className={`text-[13px] font-semibold ${isActive ? cat.text : 'text-muted-foreground'}`}>{cat.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isActive ? `${cat.activeBg} ${cat.text}` : 'bg-muted/60 text-muted-foreground'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* ── Action Bar ── */}
        {loading ? (
          <ActionBarSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card/50 dark:bg-card/30 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm"
          >
            <div className="flex flex-col md:flex-row w-full md:w-auto items-stretch md:items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/60 dark:bg-muted/20 border-transparent focus-visible:border-primary/40 focus-visible:ring-0 rounded-xl h-10 text-sm w-full md:w-64"
                />
              </div>

              {!isSelectMode ? (
                <button
                  onClick={toggleSelectMode}
                  className="px-4 py-2.5 bg-primary/10 dark:bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-400 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors border border-primary/20"
                >
                  Select Students
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleBatchMarkAsDone}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold rounded-xl whitespace-nowrap transition-opacity shadow-sm"
                  >
                    Mark Done ({selectedIds.size})
                  </button>
                  <button
                    onClick={toggleSelectMode}
                    className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold rounded-xl whitespace-nowrap transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <Select value={statusFilter} onValueChange={(val: StatusFilter) => setStatusFilter(val)}>
              <SelectTrigger className="w-full md:w-52 bg-background/60 dark:bg-muted/20 border-transparent focus:ring-0 rounded-xl h-10 text-sm font-medium">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 shadow-lg">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not-submitted">Not Submitted</SelectItem>
                <SelectItem value="ai-graded">AI Graded Preview</SelectItem>
                <SelectItem value="teacher-graded">Teacher Verified</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* ── Student List ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <StudentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {isSelectMode && filteredSubmissions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-2 bg-muted/40 dark:bg-muted/20 rounded-xl w-fit"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Select All</span>
              </motion.div>
            )}

            <AnimatePresence>
              {filteredSubmissions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 flex flex-col items-center bg-muted/20 dark:bg-muted/10 border border-border/50 rounded-2xl"
                >
                  <div className="p-4 bg-muted/60 dark:bg-muted/30 rounded-full mb-3">
                    <Search className="w-7 h-7 opacity-40 text-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">No students found</h3>
                  <p className="text-muted-foreground mt-1 text-sm max-w-xs">Try adjusting your search or filter criteria.</p>
                </motion.div>
              ) : (
                filteredSubmissions.map((sub: any, i: number) => {
                  // Premium card styles: left-border accent + subtle tint
                  let cardClass = 'border-border/60 dark:border-white/[0.06] bg-card';
                  let accentClass = 'bg-muted/50 dark:bg-muted/20';
                  let badgeClass = 'bg-muted/60 dark:bg-muted/30 text-muted-foreground';
                  let statusText = 'Not Submitted';

                  if (sub.gradedAt) {
                    cardClass = 'border-emerald-500/25 dark:border-emerald-500/15 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04]';
                    accentClass = 'bg-emerald-500';
                    badgeClass = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/20';
                    statusText = 'Teacher Verified';
                  } else if (sub.completedAt) {
                    cardClass = 'border-sky-500/25 dark:border-sky-500/15 bg-sky-500/[0.03] dark:bg-sky-500/[0.04]';
                    accentClass = 'bg-sky-400 dark:bg-sky-500';
                    badgeClass = 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/70 dark:border-sky-500/20';
                    statusText = 'AI Graded';
                  }

                  return (
                    <motion.div
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3">
                        {isSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sub.id)}
                            onChange={() => {
                              const newSet = new Set(selectedIds);
                              if (newSet.has(sub.id)) newSet.delete(sub.id);
                              else newSet.add(sub.id);
                              setSelectedIds(newSet);
                            }}
                            className="w-4 h-4 rounded accent-primary cursor-pointer flex-shrink-0"
                          />
                        )}
                        <Card
                          className={`flex-1 cursor-pointer border overflow-hidden shadow-sm hover:shadow-md transition-all duration-250 rounded-2xl ${cardClass} ${
                            !sub.gradedAt && !sub.completedAt ? 'opacity-60 dark:opacity-50' : ''
                          }`}
                          onClick={() => {
                            if (isSelectMode) {
                              const newSet = new Set(selectedIds);
                              if (newSet.has(sub.id)) newSet.delete(sub.id);
                              else newSet.add(sub.id);
                              setSelectedIds(newSet);
                            } else {
                              if (sub.completedAt || sub.gradedAt) setReviewSubmission(sub);
                            }
                          }}
                        >
                          <CardContent className="p-0 flex items-stretch">
                            {/* Left accent bar */}
                            <div className={`w-1 flex-shrink-0 ${accentClass} rounded-l-2xl`} />
                            <div className="flex-1 flex items-center justify-between px-5 py-3.5">
                              <div>
                                <p className="font-semibold text-[15px] text-foreground leading-tight">
                                  {sub.user?.name || 'Unknown Student'}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                                  Roll No: {sub.user?.rollNumber || `22CS${100 + (parseInt(sub.id?.slice(-3) || '0', 16) % 100).toString().padStart(3, '0')}`}
                                </p>
                              </div>
                              <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeClass}`}>
                                {statusText}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <StudentReviewSheet
        submission={reviewSubmission}
        onClose={() => setReviewSubmission(null)}
        onSaved={handleGradeSaved}
        isQuiz={assignment?.type === 'quiz'}
      />
    </DashboardLayout>
  );
}
