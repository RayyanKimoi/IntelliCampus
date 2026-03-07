'use client';

import { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, CheckCircle2, XCircle, Search, ChevronsUpDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// ─── Mock data ────────────────────────────────────────────────────────────────
const QUIZ_META: Record<string, { title: string; questions: number }> = {
  q1: { title: 'Quiz 1 — Fundamentals',            questions: 10 },
  q2: { title: 'Quiz 2 — Data Structures',         questions: 10 },
  q3: { title: 'Quiz 3 — Algorithms & Complexity', questions: 10 },
};

const MOCK_STUDENT_RESULTS = [
  { id: 's1', name: 'Aarav Sharma',   rollNo: '22CS101', score: 9,  total: 10 },
  { id: 's2', name: 'Priya Patel',    rollNo: '22CS102', score: 7,  total: 10 },
  { id: 's3', name: 'Riya Nair',      rollNo: '22CS103', score: 10, total: 10 },
  { id: 's4', name: 'Kiran Mehta',    rollNo: '22CS104', score: 5,  total: 10 },
  { id: 's5', name: 'Sneha Iyer',     rollNo: '22CS105', score: 8,  total: 10 },
  { id: 's6', name: 'Aditya Rao',     rollNo: '22CS106', score: 4,  total: 10 },
  { id: 's7', name: 'Divya Krishnan', rollNo: '22CS107', score: 9,  total: 10 },
  { id: 's8', name: 'Rohan Verma',    rollNo: '22CS108', score: 6,  total: 10 },
];

// Mock questions with options
const MOCK_QUESTIONS = [
  {
    q: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correct: 1, // B
  },
  {
    q: 'Which data structure uses LIFO ordering?',
    options: ['Queue', 'Heap', 'Stack', 'Graph'],
    correct: 2, // C
  },
  {
    q: 'What does RAM stand for?',
    options: ['Random Access Memory', 'Read Arithmetic Module', 'Runtime Array Manager', 'Register Allocation Map'],
    correct: 0, // A
  },
  {
    q: 'Which sorting algorithm has the best average case complexity?',
    options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
    correct: 2, // C
  },
  {
    q: 'In a linked list, what does a node contain?',
    options: ['Only data', 'Only a pointer', 'Data and a pointer', 'An index'],
    correct: 2, // C
  },
  {
    q: 'What is the output of: print(2 ** 3) in Python?',
    options: ['6', '8', '9', '5'],
    correct: 1, // B
  },
  {
    q: 'Which of the following is NOT a primitive data type in Java?',
    options: ['int', 'boolean', 'String', 'char'],
    correct: 2, // C
  },
  {
    q: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Core Program Utility', 'Computer Program User', 'Central Parallel Unit'],
    correct: 0, // A
  },
  {
    q: 'What is the base of hexadecimal number system?',
    options: ['8', '10', '16', '2'],
    correct: 2, // C
  },
  {
    q: 'Which keyword is used to define a function in Python?',
    options: ['function', 'define', 'fun', 'def'],
    correct: 3, // D
  },
];

// Deterministically generate which option the student picked per question
function getStudentAnswers(studentId: string, total: number, score: number) {
  const seed = studentId.charCodeAt(1) + studentId.charCodeAt(0);
  const correctCount = score;
  // Build list: first `correctCount` are correct, rest are wrong
  const results: { questionIndex: number; studentChoice: number; correct: boolean }[] = [];
  let wrongsUsed = 0;
  for (let i = 0; i < total; i++) {
    const q = MOCK_QUESTIONS[i % MOCK_QUESTIONS.length];
    const isCorrect = (seed + i * 3) % (total) < correctCount;
    let studentChoice: number;
    if (isCorrect) {
      studentChoice = q.correct;
    } else {
      // Pick a wrong option deterministically
      const wrongOpts = q.options.map((_, idx) => idx).filter(idx => idx !== q.correct);
      studentChoice = wrongOpts[(seed + wrongsUsed) % wrongOpts.length];
      wrongsUsed++;
    }
    results.push({ questionIndex: i, studentChoice, correct: isCorrect });
  }
  // Ensure score matches by adjusting
  const actualCorrect = results.filter(r => r.correct).length;
  const diff = correctCount - actualCorrect;
  if (diff > 0) {
    let fixed = 0;
    for (const r of results) {
      if (fixed >= diff) break;
      if (!r.correct) { r.studentChoice = MOCK_QUESTIONS[r.questionIndex % MOCK_QUESTIONS.length].correct; r.correct = true; fixed++; }
    }
  } else if (diff < 0) {
    let unfixed = 0;
    for (const r of results) {
      if (unfixed >= Math.abs(diff)) break;
      if (r.correct) {
        const q = MOCK_QUESTIONS[r.questionIndex % MOCK_QUESTIONS.length];
        const wrongOpts = q.options.map((_, idx) => idx).filter(idx => idx !== q.correct);
        r.studentChoice = wrongOpts[(seed + unfixed) % wrongOpts.length];
        r.correct = false; unfixed++;
      }
    }
  }
  return results;
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = (score / total) * 100;
  const cls = pct >= 80
    ? 'bg-emerald-50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-600/50'
    : pct >= 60
    ? 'bg-amber-50 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-600/50'
    : 'bg-red-50 dark:bg-red-900/60 text-red-700 dark:text-red-300 border-red-300/60 dark:border-red-600/50';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide border ${cls}`}>
      {score}/{total}
    </span>
  );
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ subjectId: string; quizId: string }>;
}) {
  const router = useRouter();
  const { subjectId, quizId } = use(params);
  const quiz = QUIZ_META[quizId] ?? { title: 'Quiz', questions: 10 };

  // ── List state ────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'high' | 'low' | 'default'>('default');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = MOCK_STUDENT_RESULTS.find(s => s.id === selectedStudentId) ?? null;
  const studentAnswers = selectedStudent
    ? getStudentAnswers(selectedStudent.id, quiz.questions, selectedStudent.score)
    : [];

  // Filtered + sorted list
  const displayedStudents = useMemo(() => {
    let list = MOCK_STUDENT_RESULTS.filter(s => {
      const q = search.toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
    });
    if (sortOrder === 'high') list = [...list].sort((a, b) => b.score - a.score);
    else if (sortOrder === 'low') list = [...list].sort((a, b) => a.score - b.score);
    return list;
  }, [search, sortOrder]);

  const sortLabel = sortOrder === 'high' ? 'High → Low' : sortOrder === 'low' ? 'Low → High' : 'Sort by Score';

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-7">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => selectedStudentId ? setSelectedStudentId(null) : router.push(`/teacher/results/${subjectId}`)}
          className="group flex items-center w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="p-1.5 rounded-full bg-muted/60 group-hover:bg-muted mr-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {selectedStudentId ? 'Back to Results' : 'Back to Subject'}
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[11px] font-semibold tracking-widest uppercase w-fit mb-2.5 border border-violet-500/20">
            Quiz Results
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{quiz.title}</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {selectedStudent
              ? `Answer breakdown for ${selectedStudent.name}`
              : `${MOCK_STUDENT_RESULTS.length} students · ${quiz.questions} questions`}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Student List ── */}
          {!selectedStudentId ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Search + Sort bar */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or roll number..."
                    className="pl-9 rounded-xl bg-card border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-xl border-border/60 bg-card font-medium text-sm min-w-[150px] justify-between">
                      <span className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        {sortLabel}
                      </span>
                      <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={() => setSortOrder('default')} className="cursor-pointer rounded-lg">
                      Default order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('high')} className="cursor-pointer rounded-lg">
                      Score: High → Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('low')} className="cursor-pointer rounded-lg">
                      Score: Low → High
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Student cards */}
              <div className="grid gap-3">
                {displayedStudents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    No students match your search.
                  </div>
                ) : displayedStudents.map((student, i) => {
                  const pct = (student.score / student.total) * 100;
                  const accentClass = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
                  const cardClass = pct >= 80
                    ? 'border-emerald-500/25 dark:border-emerald-500/20'
                    : pct >= 60 ? 'border-amber-500/25 dark:border-amber-500/20'
                    : 'border-red-500/25 dark:border-red-500/20';

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <Card
                        className={`cursor-pointer hover:shadow-md transition-all duration-200 rounded-2xl border overflow-hidden bg-card shadow-sm ${cardClass}`}
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <CardContent className="p-0 flex items-stretch">
                          <div className={`w-1 flex-shrink-0 ${accentClass} rounded-l-2xl`} />
                          <div className="flex-1 flex items-center justify-between px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-[15px] text-foreground leading-tight">{student.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Roll No: {student.rollNo}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <ScoreBadge score={student.score} total={student.total} />
                              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-50" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* ── Answer Breakdown ── */
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* Student summary banner */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-card border border-border/50 rounded-2xl shadow-sm">
                <div className="space-y-0.5">
                  <p className="font-bold text-lg text-foreground">{selectedStudent?.name}</p>
                  <p className="text-sm text-muted-foreground font-medium">Roll No: {selectedStudent?.rollNo}</p>
                </div>
                <div className="sm:ml-auto flex items-center gap-5 text-sm font-semibold">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {selectedStudent?.score} Correct
                  </div>
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" />
                    {(selectedStudent?.total ?? 0) - (selectedStudent?.score ?? 0)} Incorrect
                  </div>
                  <ScoreBadge score={selectedStudent!.score} total={selectedStudent!.total} />
                </div>
              </div>

              {/* Per-question detail cards */}
              <div className="space-y-3">
                {studentAnswers.map((ans, i) => {
                  const qData = MOCK_QUESTIONS[ans.questionIndex % MOCK_QUESTIONS.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`rounded-2xl border p-5 bg-card shadow-sm ${
                        ans.correct
                          ? 'border-emerald-400/30 dark:border-emerald-600/30'
                          : 'border-red-400/30 dark:border-red-600/30'
                      }`}
                    >
                      {/* Question header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          ans.correct
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                        }`}>
                          Q{i + 1}
                        </div>
                        <p className="text-[14px] font-semibold text-foreground leading-snug flex-1">{qData.q}</p>
                        <div className="flex-shrink-0">
                          {ans.correct
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                            : <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                          }
                        </div>
                      </div>

                      {/* Options grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {qData.options.map((opt, optIdx) => {
                          const isCorrectOpt = optIdx === qData.correct;
                          const isStudentChoice = optIdx === ans.studentChoice;

                          let optClass = 'bg-muted/40 dark:bg-muted/20 border-border/50 text-muted-foreground dark:text-slate-400';
                          let labelClass = 'bg-muted dark:bg-muted/40 text-muted-foreground dark:text-slate-400';

                          if (isCorrectOpt && isStudentChoice) {
                            // Student chose correctly
                            optClass = 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-400/50 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200';
                            labelClass = 'bg-emerald-500 text-white dark:text-white';
                          } else if (isCorrectOpt) {
                            // Correct answer (student missed it)
                            optClass = 'bg-emerald-50/60 dark:bg-emerald-900/30 border-emerald-400/40 dark:border-emerald-600/40 text-emerald-700 dark:text-emerald-300';
                            labelClass = 'bg-emerald-400/70 dark:bg-emerald-700 text-white dark:text-white';
                          } else if (isStudentChoice) {
                            // Student chose wrong
                            optClass = 'bg-red-50 dark:bg-red-900/40 border-red-400/50 dark:border-red-600/50 text-red-800 dark:text-red-200';
                            labelClass = 'bg-red-500 text-white dark:text-white';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-colors ${optClass}`}
                            >
                              <span className={`w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center text-[11px] font-bold ${labelClass}`}>
                                {OPTION_LABELS[optIdx]}
                              </span>
                              <span className="leading-snug">{opt}</span>
                              {isStudentChoice && !isCorrectOpt && (
                                <span className="ml-auto text-[10px] font-bold text-red-600 dark:text-red-400">Student</span>
                              )}
                              {isCorrectOpt && !isStudentChoice && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Correct</span>
                              )}
                              {isCorrectOpt && isStudentChoice && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium pt-1">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/80" /> Correct answer</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/80" /> Student's wrong choice</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
