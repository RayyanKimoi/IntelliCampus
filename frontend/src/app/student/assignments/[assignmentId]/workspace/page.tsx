'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Play, Save, Send, Code2, FileText, Upload,
  Loader2, Clock, CheckCircle2, AlertTriangle, Terminal,
  ChevronDown, X, Download,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import { assessmentService } from '@/services/assessmentService';
import { api } from '@/services/apiClient';
import { isPast, parseISO, formatDistanceToNow } from '@/lib/dateUtils';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-[#1e1e1e] rounded-b-xl">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  ),
});

// ─── Helpers ──────────────────────────────────────────────────────

function parseSubmissionTypes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  return ['text'];
}

const LANGUAGES = [
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];

// ─── Right Panel: Assignment Info ─────────────────────────────────

function AssignmentInfoPanel({ assignment }: { assignment: any }) {
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  const pastDue = dueDate ? isPast(dueDate) : false;
  const docUrl: string | undefined =
    assignment?.assignment_document_url ?? assignment?.attachmentUrl;
  const isPdf = docUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-5">
      <div>
        <Badge variant="outline" className="mb-3 text-xs gap-1">
          <FaBook className="h-3 w-3" /> Assignment Details
        </Badge>
        <h2 className="text-xl font-bold leading-tight">{assignment?.title}</h2>
        {assignment?.courseName && (
          <p className="text-sm text-muted-foreground mt-1">{assignment.courseName}</p>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/50 p-3 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
          <p className={cn('text-sm font-semibold', pastDue ? 'text-red-500' : 'text-foreground')}>
            {dueDate
              ? dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'No due date'}
          </p>
          {dueDate && !pastDue && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(dueDate, { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-muted/50 p-3 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Points</p>
          <p className="text-sm font-semibold">{assignment?.totalPoints ?? 100} pts</p>
        </div>
      </div>

      {/* Instructions */}
      {(assignment?.description || assignment?.instructions) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Instructions
          </p>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {assignment.instructions ?? assignment.description}
            </p>
          </div>
        </div>
      )}

      {/* Document preview */}
      {docUrl && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Attached Document
          </p>
          {isPdf ? (
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <span className="text-xs text-muted-foreground font-medium">PDF Preview</span>
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Open
                </a>
              </div>
              <iframe src={docUrl} className="w-full h-64 border-0" title="Assignment Document" />
            </div>
          ) : (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="flex-1 text-primary truncate">View Attached Document</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </div>
      )}

      {/* Rubric */}
      {assignment?.rubric && (assignment.rubric as any[]).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Grading Rubric
          </p>
          <div className="space-y-2">
            {(assignment.rubric as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/60">
                <span className="text-sm">{item.name ?? item.label}</span>
                <span className="text-sm font-semibold text-primary">
                  {item.maxScore ?? item.maxPoints} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Text Submission Section ───────────────────────────────────────

function TextSubmissionSection({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Text Answer</h3>
          <p className="text-xs text-muted-foreground">Write your answer in the editor below</p>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        className="w-full min-h-[280px] resize-y rounded-xl border border-border bg-background p-4 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ─── File Upload Section ───────────────────────────────────────────

function FileUploadSection({
  files,
  onUpload,
  onRemove,
  uploading,
  disabled,
}: {
  files: Array<{ name: string; url: string; size: number }>;
  onUpload: (file: File) => void;
  onRemove: (idx: number) => void;
  uploading: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
          <Upload className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">File Upload</h3>
          <p className="text-xs text-muted-foreground">Drag & drop or browse to upload your file</p>
        </div>
      </div>

      {!disabled && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all',
            dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.py,.js,.ts"
            disabled={uploading || disabled}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          {uploading ? (
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-3" />
          ) : (
            <Upload className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          )}
          <p className="font-semibold text-sm">
            {uploading ? 'Uploading...' : 'Drag files here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Supported: PDF, DOCX, ZIP, Images &middot; Max 50 MB
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mr-2"
              >
                View
              </a>
              {!disabled && (
                <button
                  onClick={() => onRemove(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Code Editor Section ───────────────────────────────────────────

function CodeEditorSection({
  code,
  language,
  output,
  onCodeChange,
  onLanguageChange,
  onRun,
  running,
  disabled,
}: {
  code: string;
  language: string;
  output: string;
  onCodeChange: (v: string) => void;
  onLanguageChange: (v: string) => void;
  onRun: () => void;
  running: boolean;
  disabled?: boolean;
}) {
  const selectedLang = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
          <Code2 className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Code Editor</h3>
          <p className="text-xs text-muted-foreground">Write, run, and debug your code</p>
        </div>
      </div>

      {/* IDE toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 rounded-t-xl border border-zinc-700">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-400 font-mono">Code Workspace</span>
          {/* Language selector */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={disabled}
              className="h-7 rounded border border-zinc-600 bg-zinc-800 text-white pl-2 pr-6 text-xs font-mono appearance-none cursor-pointer disabled:opacity-60"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-zinc-400 absolute right-1.5 pointer-events-none" />
          </div>
        </div>
        <Button
          size="sm"
          onClick={onRun}
          disabled={running || disabled || !code.trim()}
          className="bg-green-600 hover:bg-green-700 h-7 text-xs gap-1.5"
        >
          {running ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3 fill-current" />
          )}
          Run Code
        </Button>
      </div>

      {/* Monaco Editor */}
      <div className="rounded-b-xl overflow-hidden border border-t-0 border-zinc-700">
        <MonacoEditor
          height="360px"
          language={selectedLang.monaco}
          value={code}
          onChange={(v) => !disabled && onCodeChange(v ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            readOnly: disabled,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
          }}
        />
      </div>

      {/* Terminal output */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          <Terminal className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400 font-mono uppercase tracking-wide">
            Terminal / Output
          </span>
          {running && <Loader2 className="h-3 w-3 animate-spin text-green-400 ml-auto" />}
        </div>
        <pre
          className={cn(
            'p-4 text-xs font-mono min-h-[120px] max-h-[220px] overflow-auto whitespace-pre-wrap leading-relaxed',
            output.toLowerCase().includes('error')
              ? 'text-red-400'
              : output.toLowerCase().includes('successful')
              ? 'text-green-400'
              : 'text-zinc-300',
          )}
        >
          {output || '// Click "Run Code" to execute your program...'}
        </pre>
      </div>
    </div>
  );
}

// ─── Main Workspace Page ───────────────────────────────────────────

export default function AssignmentWorkspacePage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [assignment, setAssignment] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [started, setStarted] = useState(false);

  // Submission state
  const [textContent, setTextContent] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [executionResult, setExecutionResult] = useState<{
    stdout: string;
    stderr: string;
    executionTime: string;
  } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string; size: number }>
  >([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [resolvedParams.assignmentId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!attempt || attempt.submittedAt) return;
    const timer = setInterval(autoSave, 30_000);
    return () => clearInterval(timer);
  }, [attempt, code, textContent, language, uploadedFiles]);

  async function loadAssignment() {
    try {
      setLoading(true);
      const result = await assessmentService.getAssignment(resolvedParams.assignmentId);
      const data = result?.data || result;
      setAssignment(data);
      if (data?.status === 'submitted' || data?.status === 'graded') {
        await beginAttempt(data, true);
      }
    } catch (err) {
      console.error('[Workspace] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function beginAttempt(_assignmentData?: any, silent = false) {
    try {
      const result = await assessmentService.startAttempt(resolvedParams.assignmentId);
      const attemptData = result?.data || result;
      setAttempt(attemptData);

      // Restore draft if available
      const draft = (attemptData?.answers as any)?.draft;
      if (draft) {
        setCode(draft.codeContent ?? '');
        setLanguage(draft.language ?? 'python');
        setTextContent(draft.textContent ?? '');
        setUploadedFiles(draft.files ?? []);
        setLastSaved(draft.lastSaved ? new Date(draft.lastSaved) : null);
      }

      setStarted(true);
    } catch (err: any) {
      if (!silent) console.error('[Workspace] beginAttempt error:', err);
    }
  }

  async function autoSave() {
    if (!attempt || attempt.submittedAt || saving) return;
    try {
      setSaving(true);
      await api.patch(`/student/attempts/${attempt.id}/draft`, {
        codeContent: code,
        textContent,
        language,
        files: uploadedFiles,
        lastSaved: new Date().toISOString(),
      });
      setLastSaved(new Date());
    } catch (e) {
      console.error('[Workspace] Auto-save failed:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunCode() {
    if (!code.trim()) return;
    setRunning(true);
    setOutput('Running...');
    try {
      const result = await api.post<{ success: boolean; data: any }>('/compiler', {
        code,
        language,
      });
      if (result.success && result.data) {
        const { stdout, stderr, compile_output, status, time, memory } = result.data;
        let out = '';
        const normalizedStatus = typeof status === 'object' ? status?.description : status;
        if (normalizedStatus && normalizedStatus !== 'Accepted') {
          out += `${normalizedStatus}\n${'-'.repeat(40)}\n`;
          if (compile_output) out += compile_output + '\n';
          if (stderr) out += stderr + '\n';
          if (stdout) out += stdout + '\n';
        } else {
          out += `Compilation Successful\n${'-'.repeat(40)}\nOutput:\n`;
          out += stdout || '(no output)';
        }
        if (time) out += `\n\nTime: ${time}s | Memory: ${memory} KB`;
        setOutput(out);

        // Persist execution result for teacher review
        setExecutionResult({
          stdout: stdout || '',
          stderr: stderr || compile_output || '',
          executionTime: time || '0',
        });

        // Auto-save execution output to draft
        if (attempt && !attempt.submittedAt) {
          api.patch(`/student/attempts/${attempt.id}/draft`, {
            codeContent: code,
            textContent,
            language,
            files: uploadedFiles,
            lastSaved: new Date().toISOString(),
            executionResult: {
              stdout: stdout || '',
              stderr: stderr || compile_output || '',
              executionTime: time || '0',
            },
          }).catch(() => { /* silent */ });
        }
      } else {
        setOutput('Compilation failed. Check your code for syntax errors.');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message ?? 'Failed to reach compiler'}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploadingFile(true);
    try {
      const result = await assessmentService.uploadSubmissionFile(file);
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, url: result.url, size: file.size },
      ]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message ?? 'Unknown error'}`);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit() {
    if (!attempt || attempt.submittedAt) return;
    if (
      !confirm(
        'Submit this assignment? You will not be able to modify your answers after submitting.',
      )
    )
      return;

    try {
      setSubmitting(true);
      await assessmentService.submitAssignmentWork(attempt.id, {
        textContent,
        codeContent: code,
        codeLanguage: language,
        submissionFileUrl: uploadedFiles[0]?.url,
        executionResult: executionResult || undefined,
      });
      // Mark attempt as submitted locally so auto-save stops firing during navigation
      setAttempt(prev => prev ? { ...prev, submittedAt: new Date().toISOString() } : prev);
      router.push('/student/assignments?submitted=true');
    } catch (err: any) {
      alert(`Submission failed: ${err.message ?? 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="text-center py-20">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Assignment Not Found</h2>
          <Button onClick={() => router.back()} className="mt-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isSubmitted = !!attempt?.submittedAt;
  const isPastDue = assignment.dueDate ? isPast(parseISO(assignment.dueDate)) : false;
  const submissionTypes = parseSubmissionTypes(assignment?.submissionTypes);
  const hasText = submissionTypes.includes('text');
  const hasCode = submissionTypes.includes('code');
  const hasFile = submissionTypes.includes('file');

  // ── Start Screen ────────────────────────────────────────────────
  if (!started) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-5">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Assignments
            </Button>

            <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/80 to-primary p-6 text-white">
                <p className="text-sm opacity-80 mb-1">{assignment.courseName}</p>
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Due:{' '}
                      <strong>
                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </strong>
                    </span>
                    {isPastDue && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        Past Due
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Points: <strong>{assignment.totalPoints ?? 100}</strong>
                    </span>
                  </div>
                </div>

                {assignment.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      About this Assignment
                    </p>
                    <p className="text-sm leading-relaxed">{assignment.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Submission Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hasCode && (
                      <Badge variant="outline" className="gap-1.5">
                        <Code2 className="h-3.5 w-3.5" /> Code Solution
                      </Badge>
                    )}
                    {hasText && (
                      <Badge variant="outline" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Text Answer
                      </Badge>
                    )}
                    {hasFile && (
                      <Badge variant="outline" className="gap-1.5">
                        <Upload className="h-3.5 w-3.5" /> File Upload
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t px-6 py-4 bg-muted/20 flex justify-end">
                <Button size="lg" onClick={() => beginAttempt()} className="gap-2">
                  Start Assignment <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Two-Column Workspace ─────────────────────────────────────────
  return (
    <DashboardLayout requiredRole="student">
      {/* Sticky header bar */}
      <div className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 shrink-0">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">{assignment.title}</h1>
            {isSubmitted ? (
              <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Submitted
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">
                {saving
                  ? 'Saving...'
                  : lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString()}`
                  : 'Not saved yet'}
              </p>
            )}
          </div>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={autoSave}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit
            </Button>
          </div>
        )}
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-6 p-6 max-w-screen-xl mx-auto items-start">
        {/* ── LEFT: 60% — Submission interface ──────────────────── */}
        <div className="flex-[3] min-w-0 space-y-5">
          {/* Submitted banner */}
          {isSubmitted && (
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-400">
                  Assignment submitted successfully!
                </p>
                <p className="text-xs text-green-600 mt-0.5">Awaiting teacher review.</p>
              </div>
            </div>
          )}

          {/* Text submission — shown if 'text' is in submissionTypes */}
          {hasText && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <TextSubmissionSection
                value={textContent}
                onChange={setTextContent}
                disabled={isSubmitted}
              />
            </div>
          )}

          {/* Code editor — shown if 'code' is in submissionTypes */}
          {hasCode && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <CodeEditorSection
                code={code}
                language={language}
                output={output}
                onCodeChange={setCode}
                onLanguageChange={setLanguage}
                onRun={handleRunCode}
                running={running}
                disabled={isSubmitted}
              />
            </div>
          )}

          {/* File upload — shown if 'file' is in submissionTypes */}
          {hasFile && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <FileUploadSection
                files={uploadedFiles}
                onUpload={handleFileUpload}
                onRemove={(i) =>
                  setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                uploading={uploadingFile}
                disabled={isSubmitted}
              />
            </div>
          )}

          {/* Bottom submit button */}
          {!isSubmitted && (
            <div className="flex justify-end pb-8 pt-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 gap-2 px-8 shadow-md"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Submit Assignment
              </Button>
            </div>
          )}
        </div>

        {/* ── RIGHT: 40% — Assignment info panel (sticky) ────────── */}
        <div className="flex-[2] min-w-0 hidden lg:block">
          <div className="sticky top-[73px] rounded-2xl border border-border bg-card p-5 shadow-sm overflow-y-auto max-h-[calc(100vh-120px)]">
            <AssignmentInfoPanel assignment={assignment} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
