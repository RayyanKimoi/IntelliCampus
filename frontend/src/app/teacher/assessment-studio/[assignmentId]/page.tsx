'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Edit2,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import {
  assessmentStudioService,
  Assessment,
  Question,
  RubricItem,
  CreateQuestionPayload,
} from '@/services/assessmentStudioService';

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SUBMISSION_TYPE_OPTIONS = [
  { value: 'code', label: 'Code Editor' },
  { value: 'file', label: 'File Upload' },
  { value: 'text', label: 'Text Editor' },
];

function emptyQuestion(): Omit<Question, 'id' | 'assignmentId'> & { _new: true } {
  return {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: '',
    explanation: '',
    difficultyLevel: 'intermediate',
    _new: true,
  };
}

export default function AssessmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<(Question & { _new?: true; _editing?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable assessment fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [submissionTypes, setSubmissionTypes] = useState<string[]>([]);
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [editingDetails, setEditingDetails] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newQuestion, setNewQuestion] = useState<ReturnType<typeof emptyQuestion>>(emptyQuestion());
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await assessmentStudioService.getAssessment(assignmentId);
      setAssessment(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setDueDate(data.dueDate ? data.dueDate.slice(0, 16) : '');
      setDocumentUrl(data.assignmentDocumentUrl ?? '');
      setSubmissionTypes((data.submissionTypes as string[]) ?? []);
      setRubric((data.rubric as RubricItem[]) ?? []);
      setQuestions((data as any).questions ?? []);
    } catch {
      setError('Failed to load assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveDetails() {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!dueDate) { setError('Due date is required.'); return; }
    const rubricTotal = rubric.reduce((sum, r) => sum + Number(r.maxScore), 0);
    if (rubric.length > 0 && rubricTotal !== 100) {
      setError(`Rubric scores must total 100. Currently: ${rubricTotal}`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await assessmentStudioService.updateAssessment(assignmentId, {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        assignmentDocumentUrl: documentUrl || undefined,
        submissionTypes: submissionTypes.length > 0 ? submissionTypes : undefined,
        rubric: rubric.length > 0 ? rubric : undefined,
      });
      setAssessment(prev => ({ ...prev!, ...updated }));
      setEditingDetails(false);
      setSuccessMsg('Changes saved.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError('');
    try {
      const updated = await assessmentStudioService.publishAssessment(assignmentId);
      setAssessment(prev => ({ ...prev!, isPublished: true }));
      setSuccessMsg(`Assessment published successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Failed to publish assessment.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleAddQuestion() {
    if (!newQuestion.questionText.trim()) { setError('Question text is required.'); return; }
    if (!newQuestion.optionA || !newQuestion.optionB || !newQuestion.optionC || !newQuestion.optionD) {
      setError('All four options are required.'); return;
    }
    if (!newQuestion.correctOption) { setError('Select the correct option.'); return; }

    setSavingQuestion(true);
    setError('');
    try {
      const added = await assessmentStudioService.addQuestion(assignmentId, {
        questionText: newQuestion.questionText,
        optionA: newQuestion.optionA,
        optionB: newQuestion.optionB,
        optionC: newQuestion.optionC,
        optionD: newQuestion.optionD,
        correctOption: newQuestion.correctOption as 'A' | 'B' | 'C' | 'D',
        explanation: newQuestion.explanation || undefined,
        difficultyLevel: newQuestion.difficultyLevel as any,
      });
      setQuestions(prev => [...prev, added]);
      setNewQuestion(emptyQuestion());
      setAddingQuestion(false);
    } catch {
      setError('Failed to add question.');
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Delete this question?')) return;
    try {
      await assessmentStudioService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch {
      setError('Failed to delete question.');
    }
  }

  function toggleSubmissionType(type: string) {
    setSubmissionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  function updateRubricItem(idx: number, patch: Partial<RubricItem>) {
    setRubric(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assessment) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-muted-foreground">{error || 'Assessment not found.'}</p>
          <Button onClick={() => router.push('/teacher/assessment-studio')}>
            Back to Assessment Studio
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const rubricTotal = rubric.reduce((sum, r) => sum + Number(r.maxScore), 0);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/teacher/assessment-studio')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
                <Badge variant={assessment.isPublished ? 'default' : 'secondary'}>
                  {assessment.isPublished ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline" className="capitalize">{assessment.type}</Badge>
              </div>
              {assessment.course && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {assessment.course.name}{assessment.chapter ? ` · ${assessment.chapter.name}` : ''}
                </p>
              )}
            </div>
          </div>
          {!assessment.isPublished && (
            <Button onClick={handlePublish} disabled={publishing} className="shrink-0">
              {publishing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Publish</>
              )}
            </Button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button className="ml-auto text-xs underline" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{successMsg}</div>
        )}

        {/* Details card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Assessment Details</CardTitle>
              {!editingDetails ? (
                <Button variant="outline" size="sm" onClick={() => setEditingDetails(true)}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingDetails(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveDetails} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editingDetails ? (
              /* Read-only view */
              <div className="text-sm space-y-2">
                <div className="flex gap-2">
                  <span className="font-medium w-32 text-muted-foreground">Description</span>
                  <span>{assessment.description || <span className="text-muted-foreground">—</span>}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium w-32 text-muted-foreground">Due Date</span>
                  <span>{assessment.dueDate ? new Date(assessment.dueDate).toLocaleString() : '—'}</span>
                </div>
                {assessment.type === 'assignment' && (
                  <>
                    {assessment.assignmentDocumentUrl && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <span className="font-medium w-32 text-muted-foreground">Document</span>
                          <a
                            href={assessment.assignmentDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            View Document
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {assessment.assignmentDocumentUrl.endsWith('.pdf') && (
                          <div className="rounded-xl overflow-hidden border bg-muted/30">
                            <iframe
                              src={assessment.assignmentDocumentUrl}
                              className="w-full h-80"
                              title="Assignment Document Preview"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {assessment.submissionTypes && (assessment.submissionTypes as string[]).length > 0 && (
                      <div className="flex gap-2">
                        <span className="font-medium w-32 text-muted-foreground">Submission</span>
                        <div className="flex flex-wrap gap-1">
                          {(assessment.submissionTypes as string[]).map(t => (
                            <Badge key={t} variant="outline" className="capitalize">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {assessment.rubric && (assessment.rubric as RubricItem[]).length > 0 && (
                      <div className="flex gap-2">
                        <span className="font-medium w-32 text-muted-foreground">Rubric</span>
                        <div className="flex flex-wrap gap-1">
                          {(assessment.rubric as RubricItem[]).map((r, i) => (
                            <Badge key={i} variant="outline">{r.name}: {r.maxScore}pts</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Editable form */
              <>
                <div className="space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date <span className="text-destructive">*</span></Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>

                {assessment.type === 'assignment' && (
                  <>
                    {/* Document Upload Zone */}
                    <div className="rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center gap-3 text-center">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Assignment Document</p>
                        {documentUrl ? (
                          <p className="text-xs text-primary mt-0.5 break-all font-medium">
                            {documentUrl.split('/').pop() ?? documentUrl}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            PDF, DOCX, or PPT (optional, max 10MB)
                          </p>
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
                          setUploadingFile(true);
                          setError('');
                          try {
                            const result = await assessmentStudioService.uploadFile(file);
                            setDocumentUrl(result.url);
                          } catch {
                            setError('Failed to upload file. Please try again.');
                          } finally {
                            setUploadingFile(false);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          className="gap-1.5"
                        >
                          {uploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploadingFile ? 'Uploading...' : documentUrl ? 'Replace File' : 'Choose File'}
                        </Button>
                        {documentUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive gap-1.5"
                            onClick={() => setDocumentUrl('')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Submission Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {SUBMISSION_TYPE_OPTIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleSubmissionType(value)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                              submissionTypes.includes(value)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-input hover:bg-muted'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {rubric.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Rubric</Label>
                          <span className={`text-xs font-medium ${rubricTotal === 100 ? 'text-green-600' : 'text-destructive'}`}>
                            Total: {rubricTotal}/100
                          </span>
                        </div>
                        <div className="space-y-2">
                          {rubric.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Input
                                className="flex-1"
                                value={r.name}
                                onChange={e => updateRubricItem(i, { name: e.target.value })}
                              />
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="w-20"
                                value={r.maxScore}
                                onChange={e => updateRubricItem(i, { maxScore: Number(e.target.value) })}
                              />
                              <span className="text-xs text-muted-foreground">pts</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRubric(prev => prev.filter((_, ri) => ri !== i))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRubric(prev => [...prev, { name: '', maxScore: 0 }])}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Criterion
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Questions section (quiz type) */}
        {assessment.type === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaBook className="h-5 w-5" />
                Questions
                <Badge variant="outline">{questions.length}</Badge>
              </h2>
              {!addingQuestion && (
                <Button size="sm" onClick={() => setAddingQuestion(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              )}
            </div>

            {/* Existing questions */}
            {questions.map((q, idx) => (
              <Card key={q.id || idx} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-0">
                  {/* Question row */}
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="flex-1 pt-0.5 text-base font-semibold leading-snug">{q.questionText}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 -mt-0.5"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Options grid */}
                  <div className="grid grid-cols-2 gap-2 px-5 pb-5">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const text = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'];
                      const isCorrect = q.correctOption === opt;
                      return (
                        <div
                          key={opt}
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                            isCorrect
                              ? 'bg-green-50 border-green-300 text-green-800 font-medium dark:bg-green-950/40 dark:border-green-700 dark:text-green-300'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCorrect ? 'bg-green-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'
                          }`}>{opt}</span>
                          <span className="flex-1 leading-tight">{text}</span>
                          {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                        </div>
                      );
                    })}
                  </div>
                  {/* Footer */}
                  <div className="border-t border-border bg-muted/20 px-5 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground italic flex-1">{q.explanation || '\u00a0'}</p>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{q.difficultyLevel}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && !addingQuestion && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No questions yet. Click "Add Question" to start.
                </CardContent>
              </Card>
            )}

            {/* Add new question form */}
            {addingQuestion && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-sm">New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Question Text <span className="text-destructive">*</span></Label>
                    <Textarea
                      rows={2}
                      placeholder="Enter question..."
                      value={newQuestion.questionText}
                      onChange={e => setNewQuestion(q => ({ ...q, questionText: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt} className="space-y-1.5">
                        <Label className="text-xs">Option {opt}</Label>
                        <Input
                          placeholder={`Option ${opt}`}
                          value={newQuestion[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']}
                          onChange={e => setNewQuestion(q => ({ ...q, [`option${opt}`]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Correct Answer <span className="text-destructive">*</span></Label>
                      <Select
                        value={newQuestion.correctOption}
                        onValueChange={v => setNewQuestion(q => ({ ...q, correctOption: v as 'A' | 'B' | 'C' | 'D' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <SelectItem key={opt} value={opt}>Option {opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Difficulty</Label>
                      <Select
                        value={newQuestion.difficultyLevel}
                        onValueChange={v => setNewQuestion(q => ({ ...q, difficultyLevel: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Explanation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      rows={2}
                      placeholder="Explain why this answer is correct..."
                      value={newQuestion.explanation ?? ''}
                      onChange={e => setNewQuestion(q => ({ ...q, explanation: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAddingQuestion(false); setNewQuestion(emptyQuestion()); }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddQuestion} disabled={savingQuestion}>
                      {savingQuestion ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Add Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
