'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teacherService } from '@/services/teacherService';
import {
  FileBarChart, Download, Loader2, AlertCircle, Check,
  BarChart2,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import { MOCK_TEACHER_COURSES_FOR_REPORTS } from '@/lib/mockData';

// ───────────────────────────── Types
interface Course { id: string; name: string; }

// ───────────────────────────── Page
export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherService.getCourses();
      const list = data ?? [];
      setCourses(list.length > 0 ? list : MOCK_TEACHER_COURSES_FOR_REPORTS);
      if (list.length === 0) setSelectedCourseId(MOCK_TEACHER_COURSES_FOR_REPORTS[0]?.id ?? '');
    } catch {
      setCourses(MOCK_TEACHER_COURSES_FOR_REPORTS);
      setSelectedCourseId(MOCK_TEACHER_COURSES_FOR_REPORTS[0]?.id ?? '');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  async function handleExport() {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const result = await teacherService.exportReport(selectedCourseId || '');
      // result may be a CSV string or a blob
      let csvContent: string;
      if (typeof result === 'string') {
        csvContent = result;
      } else {
        csvContent = await (result as Blob).text();
      }
      // Trigger browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const courseName = selectedCourseId
        ? (courses.find(c => c.id === selectedCourseId)?.name ?? 'course').replace(/\s+/g, '_')
        : 'all_courses';
      link.href = url;
      link.download = `intellicampus_report_${courseName}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess('Report downloaded successfully!');
    } catch { setError('Export failed. Please try again.'); }
    finally { setExporting(false); }
  }

  const selectedCourseName = selectedCourseId
    ? courses.find(c => c.id === selectedCourseId)?.name
    : 'All Courses';

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-sm text-muted-foreground mt-1">Export student performance data as CSV for offline analysis.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 rounded-lg text-sm">
            <Check className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Export card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Student Performance Report</h2>
              <p className="text-xs text-muted-foreground">Includes: student name, email, assignment, score, status, submission date.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Course</label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading courses…
                </div>
              ) : (
                <select
                  className="w-full max-w-md border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground"
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}>
                  <option value="">All Courses (export everything)</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            {/* Preview */}
            <div className="bg-muted/50 border border-dashed border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Report Preview</p>
              <div className="font-mono text-xs text-muted-foreground space-y-1">
                <p className="opacity-60">Student,Email,Assignment,Course,Score,TotalPoints,Status,SubmittedAt</p>
                <p>Alice Sharma,alice@example.com,Quiz 1,{selectedCourseName},85,100,submitted,2024-11-01T10:00:00Z</p>
                <p>Bob Kumar,bob@example.com,Quiz 1,{selectedCourseName},72,100,submitted,2024-11-01T11:30:00Z</p>
                <p className="opacity-60 italic">… and all matching submissions</p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
              ) : (
                <><Download className="w-4 h-4" /> Export CSV</>
              )}
            </button>
          </div>
        </div>

        {/* Report types info */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
              bg: 'bg-indigo-50 dark:bg-indigo-950/40',
              title: 'Performance Report',
              desc: 'Student scores, submission status, and grading details for all assignments.',
            },
            {
              icon: <FaBook className="w-5 h-5 text-green-600 dark:text-green-400" />,
              bg: 'bg-green-50 dark:bg-green-950/40',
              title: 'Course Coverage',
              desc: 'Export includes course and assignment metadata alongside student data.',
            },
          ].map(card => (
            <div key={card.title} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
