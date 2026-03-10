'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { teacherService } from '@/services/teacherService';
import { Sparkles, Save, X, Loader2, User, Hash, BadgeCheck, CheckCircle2, Check, XCircle } from 'lucide-react';

export interface GradeSavePayload {
  submissionId: string;
  score: number;
  comment: string;
  rubricScores: Record<string, number>;
  gradedAt: string;
}

interface StudentReviewSheetProps {
  submission: any | null;
  onClose: () => void;
  onSaved: (payload: GradeSavePayload) => void;
  isQuiz?: boolean; // If true, show read-only view without grade editing
}

// ─── Rubric data ────────────────────────────────────────────────────
const RUBRIC_CRITERIA = [
  { key: 'correctness',     label: 'Correctness',     defaultScore: 9 },
  { key: 'codeQuality',     label: 'Code Quality',    defaultScore: 8 },
  { key: 'problemSolving',  label: 'Problem Solving', defaultScore: 9 },
  { key: 'efficiency',      label: 'Efficiency',      defaultScore: 7 },
  { key: 'documentation',   label: 'Documentation',   defaultScore: 8 },
];

// ─── Rubric Progress Bar ────────────────────────────────────────────
function RubricBar({ label, score, max = 10, onChange, disabled = false }: { label: string; score: number; max?: number; onChange: (v: number) => void; disabled?: boolean }) {
  const pct = (score / max) * 100;
  const color =
    pct >= 80 ? 'bg-emerald-500 dark:bg-emerald-400' :
    pct >= 60 ? 'bg-amber-500 dark:bg-amber-400' :
                'bg-red-500 dark:bg-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={max}
            value={score}
            onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
            disabled={disabled}
            className="w-10 text-center text-xs font-bold bg-muted/50 dark:bg-muted/20 border border-border/50 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-100 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] text-muted-foreground font-medium">/{max}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-muted dark:bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Quiz Answer Display ────────────────────────────────────────────
function QuizAnswerDisplay({ answer, index }: { answer: any; index: number }) {
  const question = answer.question;
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/30">
      {/* Question Header */}
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
          answer.isCorrect 
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {question.questionText}
          </p>
        </div>
        <div className="flex-shrink-0">
          {answer.isCorrect ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Check className="w-3 h-3" />
              <span className="text-xs font-semibold">Correct</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
              <XCircle className="w-3 h-3" />
              <span className="text-xs font-semibold">Wrong</span>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 pl-11">
        {options.map((option) => {
          const isStudentAnswer = answer.selectedOption === option.key;
          const isCorrectAnswer = question.correctOption === option.key;
          
          return (
            <div
              key={option.key}
              className={`flex items-start gap-2 p-3 rounded-lg border transition-all ${
                isCorrectAnswer
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                  : isStudentAnswer
                  ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30'
                  : 'bg-muted/20 border-border/40'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                isCorrectAnswer
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isStudentAnswer
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-muted border-border text-muted-foreground'
              }`}>
                {option.key}
              </div>
              <span className={`text-sm flex-1 ${
                isCorrectAnswer || isStudentAnswer ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}>
                {option.text}
              </span>
              {isCorrectAnswer && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              )}
              {isStudentAnswer && !isCorrectAnswer && (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudentReviewSheet({ submission, onClose, onSaved, isQuiz = false }: StudentReviewSheetProps) {
  const [score, setScore] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(RUBRIC_CRITERIA.map(c => [c.key, c.defaultScore]))
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSaveSuccess(false); // Reset success state when opening a new submission
    if (submission) {
      setScore(submission.score ? String(submission.score) : '');
      
      // Set comments based on whether it's a quiz or assignment
      if (isQuiz) {
        if (submission.answers && submission.answers.length > 0) {
          const correct = submission.answers.filter((a: any) => a.isCorrect).length;
          const total = submission.answers.length;
          const percentage = (correct / total) * 100;
          
          let summaryMessage = '';
          if (percentage >= 80) {
            summaryMessage = `Excellent performance! The student answered ${correct} out of ${total} questions correctly (${percentage.toFixed(0)}%).`;
          } else if (percentage >= 60) {
            summaryMessage = `Good effort. The student answered ${correct} out of ${total} questions correctly (${percentage.toFixed(0)}%). Review the incorrect answers above.`;
          } else {
            summaryMessage = `The student answered ${correct} out of ${total} questions correctly (${percentage.toFixed(0)}%). Consider reviewing the topics covered in this quiz.`;
          }
          setComments(summaryMessage);
        } else {
          setComments('Quiz scores are automatically calculated based on correct answers.');
        }
      } else {
        setComments(submission.teacherComment || '');
      }
      
      // Load existing rubric scores if available, otherwise use defaults
      if (submission.rubricScores) {
        setRubricScores(submission.rubricScores);
      } else {
        // Vary rubric scores based on submission id for realistic mock data
        const seed = parseInt(submission.id?.slice(-2) || '0', 16);
        setRubricScores({
          correctness:    Math.min(10, 6 + (seed % 5)),
          codeQuality:    Math.min(10, 5 + (seed % 6)),
          problemSolving: Math.min(10, 7 + (seed % 4)),
          efficiency:     Math.min(10, 4 + (seed % 7)),
          documentation:  Math.min(10, 6 + (seed % 5)),
        });
      }
    }
  }, [submission, isQuiz]);

  const handleSave = async () => {
    if (!submission) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: GradeSavePayload = {
        submissionId: submission.id,
        score: parseInt(score, 10) || 0,
        comment: comments,
        rubricScores,
        gradedAt: new Date().toISOString(),
      };
      
      // Call the actual grading API
      await teacherService.gradeSubmission(submission.id, {
        score: payload.score,
        comment: payload.comment,
        rubricScores: payload.rubricScores,
      });
      
      // Show success message
      setSaveSuccess(true);
      
      // Pass the payload to parent so it can update its state
      setTimeout(() => {
        onSaved(payload);
      }, 500);
    } catch (err) {
      console.error('Failed to save grade', err);
      alert('Failed to save grade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Derive a mock roll number from submission id
  const rollNumber = submission?.user?.rollNumber
    || (submission ? `22CS${100 + (parseInt(submission.id?.slice(-3) || '0', 16) % 100).toString().padStart(3, '0')}` : '—');
  const studentId = submission?.user?.id
    || (submission ? `STU${parseInt(submission.id?.slice(-4) || '0', 16).toString().padStart(5, '0')}` : '—');

  return (
    <Sheet open={!!submission} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background dark:bg-card border-l border-border/50 shadow-2xl p-0 flex flex-col h-full">

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/90 dark:bg-card/90 backdrop-blur-xl border-b border-border/50 px-6 py-5">
          <div className="flex justify-between items-start pr-8">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-bold flex flex-col items-start gap-1.5 tracking-tight">
                <span className="text-foreground">{submission?.user?.name || 'Student Review'}</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-md">
                  {submission?.user?.email}
                </span>
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 pb-28 overflow-y-auto">
          {submission ? (
            <div className="space-y-7">

              {/* Student Info Row */}
              <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 dark:bg-muted/10 rounded-xl overflow-hidden border border-border/40">
                <div className="flex flex-col items-center py-3 px-2 gap-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Name</span>
                  <span className="text-[12px] font-bold text-foreground text-center leading-tight">{submission.user?.name || '—'}</span>
                </div>
                <div className="flex flex-col items-center py-3 px-2 gap-1">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Roll No</span>
                  <span className="text-[12px] font-bold text-foreground">{rollNumber}</span>
                </div>
                <div className="flex flex-col items-center py-3 px-2 gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Student ID</span>
                  <span className="text-[12px] font-bold text-foreground">{studentId}</span>
                </div>
              </div>

              {/* Submission Preview - Only for non-quiz assignments */}
              {!isQuiz && (
                <div className="bg-card w-full h-36 rounded-2xl border border-border/40 dark:border-white/5 flex flex-col items-center justify-center text-sm text-muted-foreground relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0" />
                  <div className="w-10 h-10 bg-muted dark:bg-muted/40 rounded-full flex items-center justify-center mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="relative z-10 font-medium text-[13px]">Submission Preview</span>
                  <span className="text-[11px] opacity-50 relative z-10 mt-0.5">PDF Placeholder</span>
                </div>
              )}

              {/* AI Grading Section */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold text-[11px] tracking-widest uppercase bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-200/50 dark:border-violet-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  {isQuiz ? 'Auto-Graded Quiz' : 'AI Grading Insights'}
                </div>

                <div className="bg-card/60 dark:bg-muted/10 rounded-2xl border border-border/50 p-5 space-y-5">

                  {/* AI Score */}
                  <div>
                    <Label htmlFor="ai-score" className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-0.5">
                      {isQuiz ? 'Quiz Score' : 'AI Grading Score'}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="ai-score"
                        type="number"
                        value={score}
                        onChange={e => setScore(e.target.value)}
                        disabled={isQuiz}
                        className="pl-4 text-2xl font-bold h-14 bg-muted/40 dark:bg-muted/20 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 rounded-xl disabled:opacity-100 disabled:cursor-not-allowed"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-bold opacity-40">/ 100</div>
                    </div>
                  </div>

                  <div className="h-px bg-border/50" />

                  {/* Rubric Progress Bars OR Quiz Answers */}
                  {isQuiz ? (
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-0.5 block mb-3">
                        Student Answers
                      </Label>
                      <div className="space-y-3">
                        {submission.answers && submission.answers.length > 0 ? (
                          submission.answers.map((answer: any, index: number) => (
                            <QuizAnswerDisplay key={answer.id} answer={answer} index={index} />
                          ))
                        ) : (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No answers recorded for this quiz
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-0.5 block mb-3">Rubric Breakdown</Label>
                      <div className="space-y-3">
                        {RUBRIC_CRITERIA.map(crit => (
                          <RubricBar
                            key={crit.key}
                            label={crit.label}
                            score={rubricScores[crit.key] ?? crit.defaultScore}
                            onChange={val => setRubricScores(prev => ({ ...prev, [crit.key]: val }))}
                            disabled={isQuiz}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-border/50" />

                  {/* AI Comment */}
                  <div>
                    <Label htmlFor="ai-comments" className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-0.5">
                      {isQuiz ? 'Performance Summary' : 'AI Generated Comment'}
                    </Label>
                    <Textarea
                      id="ai-comments"
                      value={comments || (isQuiz ? 'Quiz scores are automatically calculated based on correct answers.' : 'The student demonstrated a solid understanding of the core concepts. The solution was mostly correct with minor inefficiencies in edge case handling.')}
                      onChange={e => setComments(e.target.value)}
                      placeholder={isQuiz ? 'Quiz scores are automatically calculated based on correct answers.' : 'Add your final personalized feedback here...'}
                      rows={4}
                      disabled={isQuiz}
                      className="mt-2 resize-none text-[13px] leading-relaxed bg-muted/30 dark:bg-muted/15 border-border/40 focus-visible:border-primary/40 focus-visible:ring-0 rounded-xl px-4 py-3 disabled:opacity-100 disabled:cursor-not-allowed"
                    />
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-pulse">
              <div className="h-16 bg-muted/50 dark:bg-muted/20 rounded-xl" />
              <div className="w-full h-36 bg-muted/50 dark:bg-muted/20 rounded-2xl" />
              <div className="h-7 w-40 bg-muted/50 rounded-full" />
              <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-muted/20 dark:bg-muted/10">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-12 bg-muted/50 rounded-xl" />
                <div className="h-px bg-border/40" />
                <div className="h-4 w-28 bg-muted/60 rounded" />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 bg-muted/60 rounded w-28" />
                      <div className="h-3 bg-muted/60 rounded w-8" />
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 bg-background/90 dark:bg-card/90 backdrop-blur-xl border-t border-border/50 px-6 py-4 flex gap-3 mt-auto">
          <Button variant="outline" className="flex-1 font-semibold h-11 rounded-xl transition-all" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" /> {isQuiz ? 'Close' : 'Cancel'}
          </Button>
          {!isQuiz && (
            <Button 
              onClick={handleSave} 
              disabled={saving || saveSuccess} 
              className={`flex-1 ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-primary hover:bg-primary/90'} text-primary-foreground shadow-md h-11 font-semibold rounded-xl transition-all`}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : saveSuccess ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Confirm Grade</>
              )}
            </Button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
