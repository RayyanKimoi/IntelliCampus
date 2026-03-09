'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Code2,
  FileText,
  FileUp,
  Loader2,
  PenLine,
  Send,
  Upload,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RubricItem {
  name: string;
  maxScore: number;
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: string;
  submissionTypes: string[] | null;
  rubric: RubricItem[] | null;
  assignmentDocumentUrl?: string | null;
  evaluationPoints?: number | null;
  isPublished: boolean;
  course?: { id: string; name: string };
  chapter?: { id: string; name: string } | null;
  studentAttempts?: { id: string; score: number; submittedAt: string | null }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ submitted, overdue }: { submitted: boolean; overdue: boolean }) {
  if (submitted)
    return (
      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
        Submitted
      </Badge>
    );
  if (overdue)
    return (
      <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 text-xs">
        Overdue
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
      Pending
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components: submission editors
// ─────────────────────────────────────────────────────────────────────────────

function CodeEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <Code2 className="h-4 w-4 text-zinc-400" />
        <span className="text-xs text-zinc-400 font-mono">Code Editor</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        rows={16}
        placeholder="// Write your code here…"
        className="w-full bg-zinc-950 text-green-400 font-mono text-sm px-4 py-3 resize-none focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}

function TextEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Written Response</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={10}
        placeholder="Type your answer here…"
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-60"
      />
    </div>
  );
}

function FileDropZone({
  onFile,
  fileName,
  uploading,
  disabled,
}: {
  onFile: (f: File) => void;
  fileName: string;
  uploading: boolean;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 text-center transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <FileUp className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-sm">Drag & drop your file here</p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX, images — max 10 MB</p>
        {fileName && (
          <p className="text-xs text-primary font-medium mt-1">{fileName}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
        {uploading ? 'Uploading…' : 'Choose File'}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AssignmentSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Submission state
  const [textContent, setTextContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch assignment
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.resolve(assessmentService.getAssignment(assignmentId))
      .then((res: any) => {
        if (cancelled) return;
        const data: AssignmentDetail = res?.data ?? res;
        setAssignment(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load assignment. Please go back and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId]);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadingFile(true);
    setError('');
    try {
      const result = await assessmentService.uploadSubmissionFile(file);
      setFileUrl(result.url);
      setFileName(result.filename);
    } catch {
      setError('File upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;

    const types: string[] = (assignment.submissionTypes as string[] | null) ?? [];
    if (types.includes('text') && !textContent.trim()) {
      setError('Please enter your written response before submitting.');
      return;
    }
    if (types.includes('code') && !codeContent.trim()) {
      setError('Please enter your code before submitting.');
      return;
    }
    if (types.includes('file') && !fileUrl) {
      setError('Please upload a file before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // 1. Start an attempt (idempotent – returns existing if already open)
      const attemptRes: any = await assessmentService.startAttempt(assignmentId);
      const attempt = attemptRes?.data ?? attemptRes;

      // 2. Submit with content
      await assessmentService.submitAssignmentWork(attempt.id, {
        textContent: textContent || undefined,
        codeContent: codeContent || undefined,
        submissionFileUrl: fileUrl || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !assignment) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-3xl flex flex-col items-center justify-center py-20 text-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) return null;

  const types: string[] = (assignment.submissionTypes as string[] | null) ?? ['text'];
  const existingAttempt = assignment.studentAttempts?.[0];
  const alreadySubmitted = !!existingAttempt?.submittedAt;
  const dueDate = new Date(assignment.dueDate);
  const overdue = !alreadySubmitted && dueDate < new Date();

  // ─── Success banner ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-xl flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Submitted Successfully!</h2>
          <p className="text-muted-foreground max-w-sm">
            Your work has been saved. Your teacher will review it and provide feedback.
          </p>
          <Button onClick={() => router.push(`/student/courses/${courseId}?tab=assignments`)}>
            Back to Assignments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Already submitted view ─────────────────────────────────────────────────

  if (alreadySubmitted) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href={`/student/courses/${courseId}?tab=assignments`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Assignments
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
              <StatusBadge submitted={true} overdue={false} />
            </div>
            {assignment.course && (
              <p className="text-sm text-muted-foreground">{assignment.course.name}</p>
            )}
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Assignment submitted</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                Submitted on{' '}
                {new Date(existingAttempt!.submittedAt!).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {existingAttempt!.score > 0 && (
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mt-1">
                  Score: {Math.round(existingAttempt!.score)}
                  {assignment.evaluationPoints ? ` / ${assignment.evaluationPoints}` : '%'}
                </p>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Submission form ────────────────────────────────────────────────────────

  return (
    <DashboardLayout requiredRole="student">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {/* Back link */}
        <Link
          href={`/student/courses/${courseId}?tab=assignments`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Assignments
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-start gap-3 mb-1">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
                <StatusBadge submitted={false} overdue={overdue} />
              </div>
              {assignment.course && (
                <p className="text-sm text-muted-foreground mt-0.5">{assignment.course.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Due{' '}
              {dueDate.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Instructions</p>
            </div>
            <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">
              {assignment.description}
            </p>
          </div>
        )}

        {/* Reference document */}
        {assignment.assignmentDocumentUrl && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold mb-2">Assignment Document</p>
            <a
              href={assignment.assignmentDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline hover:no-underline"
            >
              <FileText className="h-4 w-4" />
              View document
            </a>
          </div>
        )}

        {/* Grading Rubric */}
        {assignment.rubric && (assignment.rubric as RubricItem[]).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold mb-3">Grading Rubric</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(assignment.rubric as RubricItem[]).map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg bg-muted/40 px-3 py-2 text-sm flex items-center justify-between gap-2"
                >
                  <span className="text-card-foreground truncate">{item.name}</span>
                  <span className="font-semibold text-muted-foreground shrink-0">{item.maxScore}pt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button type="button" className="ml-auto text-xs underline" onClick={() => setError('')}>
              Dismiss
            </button>
          </div>
        )}

        {/* ── Submission editors (conditional on submissionTypes) ── */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Your Submission</h2>

          {types.includes('code') && (
            <CodeEditor value={codeContent} onChange={setCodeContent} disabled={submitting} />
          )}

          {types.includes('file') && (
            <FileDropZone
              onFile={handleFileUpload}
              fileName={fileName}
              uploading={uploadingFile}
              disabled={submitting}
            />
          )}

          {types.includes('text') && (
            <TextEditor value={textContent} onChange={setTextContent} disabled={submitting} />
          )}
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/student/courses/${courseId}?tab=assignments`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || uploadingFile}
            className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? 'Submitting…' : 'Submit Assignment'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
