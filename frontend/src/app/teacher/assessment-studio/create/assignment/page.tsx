'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Code2,
  FileUp,
  Loader2,
  PenLine,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { assessmentStudioService, RubricItem } from '@/services/assessmentStudioService';
import { chapterCurriculumService, Course, Chapter } from '@/services/chapterCurriculumService';

const DEFAULT_RUBRIC: RubricItem[] = [
  { name: 'Correctness', maxScore: 40 },
  { name: 'Code Quality', maxScore: 20 },
  { name: 'Problem Solving', maxScore: 20 },
  { name: 'Efficiency', maxScore: 10 },
  { name: 'Documentation', maxScore: 10 },
];

const QUICK_TEMPLATES: RubricItem[] = [
  { name: 'Correctness', maxScore: 40 },
  { name: 'Code Quality', maxScore: 20 },
  { name: 'Problem Solving', maxScore: 20 },
  { name: 'Efficiency', maxScore: 10 },
  { name: 'Documentation', maxScore: 10 },
];

const SUBMISSION_OPTIONS = [
  { key: 'code', label: 'Code Editor', icon: Code2 },
  { key: 'file', label: 'File Upload', icon: FileUp },
  { key: 'text', label: 'Text Editor', icon: PenLine },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    chapterId: '',
    title: '',
    description: '',
    dueDate: '',
    assignmentDocumentUrl: '',
    aiEvaluationPoints: '',
  });

  const [submissionTypes, setSubmissionTypes] = useState<string[]>(['file', 'text']);
  const [rubric, setRubric] = useState<RubricItem[]>(DEFAULT_RUBRIC);

  useEffect(() => {
    chapterCurriculumService.getTeacherCourses()
      .then(setCourses)
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoadingCourses(false));
  }, []);

  async function handleCourseChange(courseId: string) {
    setForm(f => ({ ...f, courseId, chapterId: '' }));
    setChapters([]);
    if (!courseId) return;
    setLoadingChapters(true);
    try {
      const res = await chapterCurriculumService.getCourseChapters(courseId);
      setChapters(res.chapters);
    } catch {
      setError('Failed to load chapters');
    } finally {
      setLoadingChapters(false);
    }
  }

  function toggleSubmissionType(key: string) {
    setSubmissionTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function updateRubricItem(index: number, patch: Partial<RubricItem>) {
    setRubric(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  }

  function removeRubricItem(index: number) {
    setRubric(prev => prev.filter((_, i) => i !== index));
  }

  function addCustomCriterion() {
    setRubric(prev => [...prev, { name: '', maxScore: 0 }]);
  }

  function toggleTemplate(tpl: RubricItem) {
    const exists = rubric.some(r => r.name === tpl.name);
    if (exists) {
      setRubric(prev => prev.filter(r => r.name !== tpl.name));
    } else {
      setRubric(prev => [...prev, { ...tpl }]);
    }
  }

  const rubricTotal = rubric.reduce((s, r) => s + Number(r.maxScore), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) { setError('Please select a course.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.dueDate) { setError('Due date is required.'); return; }
    if (rubricTotal !== 100) { setError(`Rubric marks must total 100. Currently: ${rubricTotal}`); return; }

    setSubmitting(true);
    setError('');
    try {
      const assignment = await assessmentStudioService.createAssignment({
        courseId: form.courseId,
        chapterId: form.chapterId || undefined,
        title: form.title,
        description: form.description,
        dueDate: new Date(form.dueDate).toISOString(),
        submissionTypes,
        rubric,
        assignmentDocumentUrl: form.assignmentDocumentUrl || undefined,
        evaluationPoints: 100,
      });
      router.push(`/teacher/assessment-studio/${assignment.id}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-3xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Assessment Studio</h1>
          <p className="text-muted-foreground mt-1">Create and manage assignments and quizzes</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button className="ml-auto text-xs underline" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6">
            <h2 className="text-xl font-semibold">Create Assignment</h2>

            {/* Row 1: Title + Course */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Assignment title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Course <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.courseId}
                  onChange={e => handleCourseChange(e.target.value)}
                  disabled={loadingCourses}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">{loadingCourses ? 'Loading...' : 'Select course...'}</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Chapter + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Chapter <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.chapterId}
                  onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}
                  disabled={loadingChapters || !form.courseId}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">{loadingChapters ? 'Loading...' : 'Select chapter...'}</option>
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
                {!form.courseId && (
                  <p className="text-xs text-muted-foreground">Select a course first</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Due Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Instructions..."
                rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Assignment Document */}
            <div className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assignment Document</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a PDF, DOCX, or PPT containing assignment questions (optional, max 10MB)
                </p>
                {selectedFileName && (
                  <p className="text-xs text-primary mt-1 font-medium">{selectedFileName}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.ppt,.pptx"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedFileName(file.name);
                  setUploadingFile(true);
                  setError('');
                  try {
                    const result = await assessmentStudioService.uploadFile(file);
                    setForm(f => ({ ...f, assignmentDocumentUrl: result.url }));
                  } catch {
                    setError('Failed to upload file. Please try again.');
                    setSelectedFileName('');
                  } finally {
                    setUploadingFile(false);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white gap-2"
              >
                {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingFile ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>

            {/* AI Evaluation Points */}
            <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Evaluation Points</p>
                  <p className="text-xs text-muted-foreground">
                    Add key points for the AI model to focus on when evaluating student submissions (optional)
                  </p>
                </div>
              </div>
              <textarea
                placeholder="e.g., Check for edge cases, proper error handling, code optimization, clean architecture, etc."
                rows={4}
                value={form.aiEvaluationPoints}
                onChange={e => setForm(f => ({ ...f, aiEvaluationPoints: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                These points help the AI provide more accurate and focused feedback to students
              </p>
            </div>

            {/* Submission Types */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Submission Types <span className="text-destructive">*</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SUBMISSION_OPTIONS.map(({ key, label, icon: Icon }) => {
                  const checked = submissionTypes.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSubmissionType(key)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
                        checked
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        checked ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {checked && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {label}
                    </button>
                  );
                })}
              </div>
              {submissionTypes.length === 0 && (
                <p className="text-xs text-destructive">Select at least one submission type.</p>
              )}
            </div>

            {/* Grading Rubric */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">Grading Rubric</p>
                  <p className="text-xs text-muted-foreground">Select criteria and adjust points (must total 100)</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold leading-none ${rubricTotal === 100 ? 'text-green-600' : 'text-destructive'}`}>
                    {rubricTotal} / 100
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Points</p>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Quick Templates:</span>
                {QUICK_TEMPLATES.map(tpl => {
                  const active = rubric.some(r => r.name === tpl.name);
                  return (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => toggleTemplate(tpl)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#1a3a5c] text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {active && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {tpl.name} ({tpl.maxScore}pt)
                    </button>
                  );
                })}
              </div>

              {/* Rubric rows */}
              <div className="space-y-2">
                {rubric.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateRubricItem(i, { name: e.target.value })}
                      placeholder="Criterion name"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.maxScore}
                      onChange={e => updateRubricItem(i, { maxScore: parseInt(e.target.value) || 0 })}
                      className="w-14 text-center rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground w-6">pts</span>
                    <button
                      type="button"
                      onClick={() => removeRubricItem(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Add Custom Criterion */}
                <button
                  type="button"
                  onClick={addCustomCriterion}
                  className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Custom Criterion
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <Button
                type="submit"
                disabled={submitting || submissionTypes.length === 0}
                className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white gap-2"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> Create Assignment</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
