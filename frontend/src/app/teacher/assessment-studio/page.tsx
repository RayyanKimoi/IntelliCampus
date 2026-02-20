'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  FlaskConical, Plus, Pencil, Trash2, Send, ChevronDown,
  ChevronUp, Loader2, X, AlertCircle, Check, Wand2,
  ClipboardList, Globe,
} from 'lucide-react';
import { MOCK_ALL_ASSIGNMENTS_FULL, MOCK_TEACHER_COURSES_LIST } from '@/lib/mockData';

// ───────────────────────────── Types
interface Course { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Assignment {
  id: string; title: string; dueDate: string; isPublished: boolean;
  course?: { name: string }; _count?: { questions: number };
}
interface Question {
  id?: string; text: string; options: string[];
  correctAnswer: string; explanation?: string;
}

type WizardStep = 'idle' | 'choose' | 'ai-form' | 'ai-review' | 'standard-form';

// ───────────────────────────── Helpers
function emptyQuestion(): Question {
  return { text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' };
}

// ───────────────────────────── Page
export default function AssessmentStudioPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('idle');

  // AI form
  const [aiForm, setAiForm] = useState<{
    title: string; courseId: string; topicId: string;
    difficulty: 'easy' | 'medium' | 'hard'; numberOfQuestions: number; dueDate: string;
  }>({
    title: '', courseId: '', topicId: '', difficulty: 'medium',
    numberOfQuestions: 5, dueDate: '',
  });

  // Standard form
  const [stdForm, setStdForm] = useState<{
    title: string; description: string; courseId: string; dueDate: string;
    type: 'assignment' | 'quiz';
  }>({
    title: '', description: '', courseId: '', dueDate: '', type: 'assignment',
  });

  // Generated questions
  const [genQuestions, setGenQuestions] = useState<Question[]>([]);
  const [createdAssignmentId, setCreatedAssignmentId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.allSettled([
        teacherService.getAllAssignments(),
        teacherService.getCourses(),
      ]);
      const assignmentList = a.status === 'fulfilled' ? (a.value ?? []) : [];
      const courseList = c.status === 'fulfilled' ? (c.value ?? []) : [];
      setAssignments(assignmentList.length > 0 ? assignmentList : (MOCK_ALL_ASSIGNMENTS_FULL as any[]));
      setCourses(courseList.length > 0 ? courseList : MOCK_TEACHER_COURSES_LIST);
    } catch { /* handled per-promise */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function loadSubjectsForCourse(courseId: string) {
    if (!courseId) return;
    const data = await teacherService.getSubjects(courseId).catch(() => []);
    setSubjects(data ?? []);
  }

  // ── AI Quiz: generate
  async function handleGenerateQuiz() {
    setSaving(true);
    setError('');
    try {
      const res = await teacherService.generateQuiz(aiForm);
      setCreatedAssignmentId(res.assignment?.id ?? '');
      setGenQuestions(
        (res.questions ?? []).length > 0
          ? res.questions
          : Array.from({ length: aiForm.numberOfQuestions }, emptyQuestion)
      );
      setWizardStep('ai-review');
    } catch { setError('Quiz generation failed. Fill in questions manually.'); setWizardStep('ai-review'); }
    finally { setSaving(false); }
  }

  function updateGenQuestion(index: number, patch: Partial<Question>) {
    setGenQuestions(qs => qs.map((q, i) => i === index ? { ...q, ...patch } : q));
  }

  function updateOption(qIdx: number, oIdx: number, val: string) {
    setGenQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = val;
      return { ...q, options: opts };
    }));
  }

  function addQuestion() {
    setGenQuestions(qs => [...qs, emptyQuestion()]);
  }

  function removeQuestion(idx: number) {
    setGenQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  async function publishQuiz() {
    setSaving(true);
    try {
      // Add all questions to the assignment
      for (const q of genQuestions) {
        if (q.text.trim()) {
          await teacherService.addQuestion(
            createdAssignmentId,
            {
              questionText: q.text,
              optionA: q.options[0] ?? '',
              optionB: q.options[1] ?? '',
              optionC: q.options[2] ?? '',
              optionD: q.options[3] ?? '',
              correctOption: q.correctAnswer,
            },
          ).catch(() => {});
        }
      }
      await teacherService.publishAssignment(createdAssignmentId);
      setWizardStep('idle');
      loadData();
    } catch { setError('Failed to publish quiz'); }
    finally { setSaving(false); }
  }

  // ── Standard: create
  async function handleCreateStandard() {
    setSaving(true);
    try {
      await teacherService.createAssignment(stdForm);
      setWizardStep('idle');
      setStdForm({ title: '', description: '', courseId: '', dueDate: '', type: 'assignment' });
      loadData();
    } catch { setError('Failed to create assignment'); }
    finally { setSaving(false); }
  }

  // ── Publish existing
  async function handlePublish(id: string) {
    await teacherService.publishAssignment(id).catch(() => {});
    loadData();
  }

  // ── Delete question
  async function handleDeleteQuestion(qId: string) {
    await teacherService.deleteQuestion(qId).catch(() => {});
    loadData();
  }

  // ────────────────────── RENDER
  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Studio</h1>
            <p className="text-sm text-gray-500 mt-1">Create, manage and publish quizzes and assignments.</p>
          </div>
          {wizardStep === 'idle' && (
            <button onClick={() => setWizardStep('choose')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create New
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── WIZARD ── */}
        {wizardStep !== 'idle' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            {/* Step: choose type */}
            {wizardStep === 'choose' && (
              <>
                <h2 className="text-lg font-semibold text-gray-800">What do you want to create?</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button onClick={() => setWizardStep('ai-form')}
                    className="group flex flex-col items-center gap-3 p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200">
                      <Wand2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">AI Quiz Generator</p>
                      <p className="text-xs text-gray-500 mt-1">Automatically generate questions using AI & RAG</p>
                    </div>
                  </button>
                  <button onClick={() => setWizardStep('standard-form')}
                    className="group flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200">
                      <ClipboardList className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">Standard Assignment</p>
                      <p className="text-xs text-gray-500 mt-1">Create manually with title, description and due date</p>
                    </div>
                  </button>
                </div>
                <button onClick={() => setWizardStep('idle')} className="text-sm text-gray-500 hover:text-gray-700">← Cancel</button>
              </>
            )}

            {/* Step: AI Quiz form */}
            {wizardStep === 'ai-form' && (
              <>
                <h2 className="text-lg font-semibold text-gray-800">AI Quiz — Configure</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={aiForm.title}
                      onChange={e => setAiForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Binary Trees Quiz" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={aiForm.courseId}
                      onChange={e => { setAiForm(f => ({ ...f, courseId: e.target.value })); loadSubjectsForCourse(e.target.value); }}>
                      <option value="">Select course…</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Topic (optional)</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={aiForm.topicId}
                      onChange={e => setAiForm(f => ({ ...f, topicId: e.target.value }))}>
                      <option value="">Select subject…</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={aiForm.difficulty}
                      onChange={e => setAiForm(f => ({ ...f, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}>
                      {(['easy', 'medium', 'hard'] as const).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. of Questions</label>
                    <input type="number" min={1} max={30} className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={aiForm.numberOfQuestions} onChange={e => setAiForm(f => ({ ...f, numberOfQuestions: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={aiForm.dueDate} onChange={e => setAiForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep('choose')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
                  <button onClick={handleGenerateQuiz} disabled={!aiForm.title || !aiForm.courseId || saving}
                    className="ml-auto flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {saving ? 'Generating…' : 'Generate Quiz'}
                  </button>
                </div>
              </>
            )}

            {/* Step: AI Quiz review */}
            {wizardStep === 'ai-review' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Review & Edit Questions</h2>
                  <button onClick={addQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {genQuestions.map((q, qi) => (
                    <div key={qi} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question {qi + 1}</span>
                        <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-16"
                        value={q.text} onChange={e => updateGenQuestion(qi, { text: e.target.value })}
                        placeholder="Question text…" />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <input key={oi} className={`border rounded-lg px-3 py-2 text-sm ${opt === q.correctAnswer ? 'border-green-400 bg-green-50' : ''}`}
                            value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Correct Answer</label>
                        <select className="w-full border rounded-lg px-3 py-2 text-sm" value={q.correctAnswer}
                          onChange={e => updateGenQuestion(qi, { correctAnswer: e.target.value })}>
                          <option value="">Select correct option…</option>
                          {q.options.filter(Boolean).map((o, i) => <option key={i} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" value={q.explanation ?? ''}
                        onChange={e => updateGenQuestion(qi, { explanation: e.target.value })}
                        placeholder="Explanation (optional)" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep('ai-form')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
                  <button onClick={publishQuiz} disabled={saving || genQuestions.length === 0}
                    className="ml-auto flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {saving ? 'Publishing…' : 'Publish Quiz'}
                  </button>
                </div>
              </>
            )}

            {/* Step: Standard assignment form */}
            {wizardStep === 'standard-form' && (
              <>
                <h2 className="text-lg font-semibold text-gray-800">Standard Assignment</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={stdForm.title}
                      onChange={e => setStdForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment title" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20"
                      value={stdForm.description} onChange={e => setStdForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Instructions or description…" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={stdForm.courseId}
                      onChange={e => setStdForm(f => ({ ...f, courseId: e.target.value }))}>
                      <option value="">Select course…</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={stdForm.type}
                      onChange={e => setStdForm(f => ({ ...f, type: e.target.value as 'assignment' | 'quiz' }))}>
                      {(['assignment', 'quiz'] as const).map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={stdForm.dueDate} onChange={e => setStdForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep('choose')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
                  <button onClick={handleCreateStandard} disabled={!stdForm.title || !stdForm.courseId || saving}
                    className="ml-auto flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? 'Creating…' : 'Create Assignment'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ASSIGNMENT LIST ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No assessments yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700">All Assessments ({assignments.length})</h2>
            {assignments.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center px-5 py-4 gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.isPublished ? 'bg-green-500' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {a.course?.name ?? 'No course'} ·{' '}
                      {a._count?.questions ?? 0} questions ·{' '}
                      {a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : 'No due date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                      ${a.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {!a.isPublished && (
                      <button onClick={() => handlePublish(a.id)}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                      className="text-gray-400 hover:text-gray-700">
                      {expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expandedId === a.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Assignment ID: <code className="bg-gray-200 px-1 rounded">{a.id}</code></p>
                    <p className="text-xs text-gray-400">Add questions from the AI Quiz flow, or questions were added on creation.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
