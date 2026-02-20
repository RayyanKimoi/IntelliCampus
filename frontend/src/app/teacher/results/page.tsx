'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  ClipboardList, ChevronDown, ChevronUp, Check, AlertCircle,
  Loader2, User, X, Star, MessageSquare,
} from 'lucide-react';

// ───────────────────────────── Types
interface Submission {
  id: string;
  userId: string;
  assignmentId: string;
  score?: number;
  teacherComment?: string;
  gradedAt?: string;
  completedAt?: string;
  createdAt: string;
  user?: { name: string; email: string };
  assignment?: { id: string; title: string; courseId: string };
}
interface Assignment { id: string; title: string; }

// ───────────────────────────── Page
export default function ResultsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gradeInputs, setGradeInputs] = useState<Record<string, { score: string; comment: string }>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, asgns] = await Promise.allSettled([
        teacherService.getAllSubmissions(),
        teacherService.getAllAssignments(),
      ]);
      if (subs.status === 'fulfilled') setSubmissions(subs.value ?? []);
      if (asgns.status === 'fulfilled') {
        const list = asgns.value ?? [];
        setAssignments(list);
      }
    } catch { /* individual */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter submissions
  const filtered = selectedAssignment === 'all'
    ? submissions
    : submissions.filter(s => s.assignmentId === selectedAssignment);

  // Init grade input
  function openGrade(sub: Submission) {
    setGradeInputs(prev => ({
      ...prev,
      [sub.id]: {
        score: String(sub.score ?? ''),
        comment: sub.teacherComment ?? '',
      },
    }));
    setExpandedId(sub.id);
  }

  async function submitGrade(subId: string) {
    const input = gradeInputs[subId];
    if (!input) return;
    setSaving(true);
    try {
      await teacherService.gradeSubmission(subId, {
        score: parseFloat(input.score),
        comment: input.comment,
      });
      await loadData();
      setExpandedId(null);
    } catch { setError('Failed to save grade'); }
    finally { setSaving(false); }
  }

  // ── Status helpers
  function statusBadge(sub: Submission) {
    if (sub.gradedAt) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Graded</span>;
    if (sub.completedAt) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Submitted</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">In Progress</span>;
  }

  // Build assignment lookup
  const assignmentMap = Object.fromEntries(assignments.map(a => [a.id, a.title]));

  // Stats
  const submitted = filtered.filter(s => s.completedAt).length;
  const graded = filtered.filter(s => s.gradedAt).length;
  const avgScore = (() => {
    const scored = filtered.filter(s => s.score !== null && s.score !== undefined);
    if (!scored.length) return null;
    return (scored.reduce((acc, s) => acc + (s.score ?? 0), 0) / scored.length).toFixed(1);
  })();

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluation & Results</h1>
          <p className="text-sm text-gray-500 mt-1">Review student submissions and assign grades.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Submissions', value: filtered.length },
            { label: 'Submitted', value: submitted },
            { label: 'Graded', value: graded },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by Assignment:</label>
          <select className="border rounded-lg px-3 py-2 text-sm max-w-xs"
            value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)}>
            <option value="all">All Assignments</option>
            {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          {avgScore && (
            <p className="ml-auto text-sm text-gray-500">
              Avg score: <span className="font-semibold text-gray-800">{avgScore}</span>
            </p>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No submissions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sub => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center px-5 py-4 gap-4">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{sub.user?.name ?? 'Unknown Student'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {assignmentMap[sub.assignmentId] ?? sub.assignment?.title ?? '—'} ·{' '}
                      {sub.completedAt
                        ? `Submitted ${new Date(sub.completedAt).toLocaleDateString()}`
                        : 'Not submitted'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sub.score !== null && sub.score !== undefined && (
                      <span className="text-sm font-semibold text-gray-700">{sub.score}%</span>
                    )}
                    {statusBadge(sub)}
                    <button onClick={() => expandedId === sub.id ? setExpandedId(null) : openGrade(sub)}
                      className="text-gray-400 hover:text-gray-700">
                      {expandedId === sub.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedId === sub.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div><span className="font-medium">Email:</span> {sub.user?.email ?? '—'}</div>
                      <div><span className="font-medium">Attempt ID:</span> <code className="text-xs bg-gray-200 px-1 rounded">{sub.id}</code></div>
                    </div>
                    {sub.teacherComment && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{sub.teacherComment}</span>
                      </div>
                    )}
                    {/* Grade form */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Grade this submission</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Score (0–100)</label>
                          <input type="number" min={0} max={100}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={gradeInputs[sub.id]?.score ?? ''}
                            onChange={e => setGradeInputs(p => ({ ...p, [sub.id]: { ...p[sub.id], score: e.target.value } }))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Comment</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={gradeInputs[sub.id]?.comment ?? ''}
                            onChange={e => setGradeInputs(p => ({ ...p, [sub.id]: { ...p[sub.id], comment: e.target.value } }))}
                            placeholder="Optional feedback…" />
                        </div>
                      </div>
                      <button onClick={() => submitGrade(sub.id)} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving…' : 'Save Grade'}
                      </button>
                    </div>
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
