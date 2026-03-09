'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Play,
  Save,
  Send,
  Code2,
  FileText,
  Upload,
  BookOpen,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { assessmentService } from '@/services/assessmentService';
import { api } from '@/services/apiClient';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

// Dynamically import rich text editor
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

type Tab = 'instructions' | 'code' | 'lab-report' | 'files';

interface LabReportSection {
  theory: string;
  algorithm: string;
  conclusion: string;
}

export default function AssignmentWorkspacePage({ params }: { params: Promise<{ assignmentId: string; }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('instructions');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Assignment state
  const [assignment, setAssignment] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);

  // Code editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');

  // Lab report state
  const [labReport, setLabReport] = useState<LabReportSection>({
    theory: '',
    algorithm: '',
    conclusion: '',
  });
  const [labReportTab, setLabReportTab] = useState<keyof LabReportSection>('theory');

  // Files state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Load assignment and create/load attempt
  useEffect(() => {
    loadAssignment();
  }, [resolvedParams.assignmentId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!attempt || attempt.submittedAt) return;

    const interval = setInterval(() => {
      autoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [attempt, code, labReport, language, uploadedFiles]);

  async function loadAssignment() {
    try {
      setLoading(true);
      const result = await assessmentService.getAssignment(resolvedParams.assignmentId);
      const assignmentData = result?.data || result;
      setAssignment(assignmentData);

      // Create or load existing attempt
      const attemptResult = await assessmentService.startAttempt(resolvedParams.assignmentId);
      const attemptData = attemptResult?.data || attemptResult;
      setAttempt(attemptData);

      // Load draft if exists
      const answersData = attemptData.answers as any;
      if (answersData?.draft) {
        const draft = answersData.draft;
        setCode(draft.codeContent || '');
        setLanguage(draft.language || 'cpp');
        setLabReport(draft.labReportContent || { theory: '', algorithm: '', conclusion: '' });
        setUploadedFiles(draft.files || []);
        setLastSaved(draft.lastSaved ? new Date(draft.lastSaved) : null);
      }
    } catch (error: any) {
      console.error('[Assignment Workspace] Load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function autoSave() {
    if (!attempt || attempt.submittedAt || saving) return;

    try {
      setSaving(true);
      await api.patch(`/student/attempts/${attempt.id}/draft`, {
        codeContent: code,
        labReportContent: labReport,
        language,
        files: uploadedFiles,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('[Assignment Workspace] Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunCode() {
    if (!code.trim()) return;

    try {
      setRunning(true);
      setOutput('Running...');
      const result = await api.post<{ success: boolean; data: any }>('/compiler', {
        code,
        language,
        input,
      });

      if (result.success && result.data) {
        const { stdout, stderr, compile_output, status, time, memory } = result.data;
        let outputText = `Status: ${status}\nTime: ${time}s | Memory: ${memory}KB\n\n`;
        
        if (stdout) outputText += `Output:\n${stdout}\n\n`;
        if (stderr) outputText += `Errors:\n${stderr}\n\n`;
        if (compile_output) outputText += `Compilation:\n${compile_output}\n`;
        
        setOutput(outputText || 'No output');
      } else {
        setOutput('Compilation failed. Please check your code.');
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message || 'Failed to run code'}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const result = await assessmentService.uploadSubmissionFile(file);
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        url: result.url,
        size: result.size,
      }]);
    } catch (error) {
      console.error('[Assignment Workspace] File upload failed:', error);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit() {
    if (!attempt || attempt.submittedAt) return;

    const confirmSubmit = window.confirm(
      'Are you sure you want to submit? You will not be able to modify your submission after submitting.'
    );

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      await assessmentService.submitAssignmentWork(attempt.id, {
        codeContent: code,
        codeLanguage: language,
        labReportContent: JSON.stringify(labReport),
        submissionFileUrl: uploadedFiles.length > 0 ? uploadedFiles[0].url : undefined,
      } as any);

      router.push(`/student/assignments?submitted=true`);
    } catch (error: any) {
      alert(`Submission failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Assignment Not Found</h2>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isSubmitted = !!attempt?.submittedAt;
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <DashboardLayout requiredRole="student">
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{assignment.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  {assignment.courseName}
                </span>
                {isSubmitted ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                ) : isPastDue ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Past Due
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && !isSubmitted && (
              <span className="text-sm text-muted-foreground">
                {saving ? 'Saving...' : `Last saved: ${lastSaved.toLocaleTimeString()}`}
              </span>
            )}
            {!isSubmitted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Assignment
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-muted/30">
          <div className="px-6 flex gap-1">
            {[
              { key: 'instructions' as Tab, label: 'Instructions', icon: BookOpen },
              { key: 'code' as Tab, label: 'Code Solution', icon: Code2 },
              { key: 'lab-report' as Tab, label: 'Lab Report', icon: FileText },
              { key: 'files' as Tab, label: 'Files', icon: Upload },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-3 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-primary text-primary bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'instructions' && (
            <div className="p-6 max-w-4xl mx-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h2>Assignment Instructions</h2>
                <div className="whitespace-pre-wrap">{assignment.description || 'No instructions provided.'}</div>

                {assignment.attachmentUrl && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Assignment Document</h3>
                    <a
                      href={assignment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View/Download Guidelines
                    </a>
                  </div>
                )}

                {assignment.rubric && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Grading Rubric</h3>
                    <div className="space-y-2">
                      {assignment.rubric.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-primary font-semibold">{item.maxScore} points</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="h-full flex flex-col">
              {/* Code Editor Toolbar */}
              <div className="border-b px-6 py-3 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Language:</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    disabled={isSubmitted}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="c">C</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={running || isSubmitted || !code.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Run & Check
                </Button>
              </div>

              <div className="flex-1 flex">
                {/* Code Editor */}
                <div className="flex-1 border-r">
                  <MonacoEditor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    onChange={value => !isSubmitted && setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      readOnly: isSubmitted,
                      lineNumbers: 'on',
                      rulers: [80],
                      wordWrap: 'on',
                    }}
                  />
                </div>

                {/* Output Panel */}
                <div className="w-96 flex flex-col">
                  <div className="border-b px-4 py-2 bg-muted/30">
                    <h3 className="font-semibold text-sm">Output</h3>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="p-4">
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Input (optional)
                        </label>
                        <textarea
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          disabled={isSubmitted}
                          className="w-full h-20 rounded border border-input bg-background px-2 py-1.5 text-sm font-mono resize-none"
                          placeholder="Enter input for your program..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Result
                        </label>
                        <pre className="p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
                          {output || 'Click "Run & Check" to see output'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lab-report' && (
            <div className="h-full flex flex-col">
              {/* Lab Report Sub-tabs */}
              <div className="border-b px-6 py-2 flex gap-2 bg-muted/30">
                {(['theory', 'algorithm', 'conclusion'] as const).map(section => (
                  <button
                    key={section}
                    onClick={() => setLabReportTab(section)}
                    className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                      labReportTab === section
                        ? 'bg-background text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6">
                <RichTextEditor
                  value={labReport[labReportTab]}
                  onChange={value => !isSubmitted && setLabReport(prev => ({ ...prev, [labReportTab]: value }))}
                  placeholder={`Write your ${labReportTab} here...`}
                  readOnly={isSubmitted}
                />
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="p-6 max-w-3xl mx-auto">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Uploaded Files</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload additional files for your submission (PDFs, images, etc.)
                  </p>
                </div>

                {!isSubmitted && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-2">Drag and drop files here</p>
                    <p className="text-xs text-muted-foreground mb-4">or</p>
                    <label>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingFile}
                        onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                      >
                        {uploadingFile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Choose File
                      </Button>
                    </label>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
