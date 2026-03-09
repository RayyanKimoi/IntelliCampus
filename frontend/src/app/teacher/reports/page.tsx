'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  FileBarChart, Download, Loader2, AlertCircle, Check,
  BarChart2, Filter, FileText, Users, ShieldAlert, BookOpen,
  Calendar, TrendingDown, Package,
} from 'lucide-react';
import { api } from '@/services/apiClient';

// ───────────────────────────── Types
interface Course { id: string; name: string; }
interface Chapter { id: string; name: string; courseId: string; }
interface Assignment { id: string; title: string; courseId: string; chapterId: string | null; type: string; }
interface Student { id: string; name: string; email: string; }

interface ReportFilters {
  courseId: string;
  chapterId: string;
  assignmentId: string;
  studentId: string;
  status: string;
  dateRange: string;
  reportType: string;
}

interface ReportData {
  data: any[];
  summary: any;
}

// ───────────────────────────── Page
export default function ReportsPage() {
  // Filter options
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filter values
  const [filters, setFilters] = useState<ReportFilters>({
    courseId: '',
    chapterId: '',
    assignmentId: '',
    studentId: '',
    status: 'all',
    dateRange: 'all',
    reportType: 'performance',
  });

  // Report data
  const [reportData, setReportData] = useState<ReportData>({ data: [], summary: {} });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load filter options
  const loadFilters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/filters');
      setCourses(response.courses || []);
      setChapters(response.chapters || []);
      setAssignments(response.assignments || []);
      setStudents(response.students || []);
    } catch (err) {
      console.error('Error loading filters:', err);
      setError('Failed to load filter options');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load report data
  const loadReportData = useCallback(async () => {
    setLoadingReport(true);
    setError('');
    try {
      const response = await api.post('/reports/data', filters);
      setReportData(response);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report data');
      setReportData({ data: [], summary: {} });
    } finally {
      setLoadingReport(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (!loading) {
      loadReportData();
    }
  }, [filters, loading]);

  // Update filter
  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === 'courseId') {
        newFilters.chapterId = '';
        newFilters.assignmentId = '';
      }
      if (key === 'chapterId') {
        newFilters.assignmentId = '';
      }
      
      return newFilters;
    });
  };

  // Helper to get auth token
  const getAuthToken = () => {
    try {
      const stored = localStorage.getItem('intellicampus-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.state?.token || 'dev-token-mock-authentication';
      }
    } catch {}
    return 'dev-token-mock-authentication';
  };

  // Export handlers
  const handleExportCSV = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const token = getAuthToken();
      const response = await fetch('/api/reports/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: reportData.data,
          reportType: filters.reportType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSuccess('CSV exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportZIP = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const token = getAuthToken();
      const response = await fetch('/api/reports/export-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: reportData.data,
          summary: reportData.summary,
          reportType: filters.reportType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSuccess('ZIP exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export ZIP');
    } finally {
      setExporting(false);
    }
  };

  // Filter chapters by selected course
  const filteredChapters = chapters.filter(ch => 
    !filters.courseId || ch.courseId === filters.courseId
  );

  // Filter assignments by selected course/chapter
  const filteredAssignments = assignments.filter(a => 
    (!filters.courseId || a.courseId === filters.courseId) &&
    (!filters.chapterId || a.chapterId === filters.chapterId)
  );

  // Report type options
  const reportTypes = [
    { value: 'performance', label: 'Student Performance', icon: BarChart2 },
    { value: 'assignment', label: 'Assignment Analytics', icon: FileText },
    { value: 'weak_students', label: 'Weak Students', icon: TrendingDown },
    { value: 'integrity', label: 'Integrity / Cheating Flags', icon: ShieldAlert },
    { value: 'coverage', label: 'Course Coverage', icon: BookOpen },
  ];

  const currentReportType = reportTypes.find(rt => rt.value === filters.reportType);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate comprehensive analytics reports and export data for offline analysis.
          </p>
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

        {/* Report Type Selector */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Report Type</h2>
              <p className="text-xs text-muted-foreground">Select the type of report to generate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {reportTypes.map(rt => {
              const Icon = rt.icon;
              const isActive = filters.reportType === rt.value;
              return (
                <button
                  key={rt.value}
                  onClick={() => updateFilter('reportType', rt.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-border bg-background hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                  }`} />
                  <p className={`text-xs font-medium text-center ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                  }`}>
                    {rt.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Filters</h2>
              <p className="text-xs text-muted-foreground">Refine your report data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Course</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.courseId}
                onChange={e => updateFilter('courseId', e.target.value)}
                disabled={loading}
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Chapter Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Chapter</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.chapterId}
                onChange={e => updateFilter('chapterId', e.target.value)}
                disabled={loading || !filters.courseId}
              >
                <option value="">All Chapters</option>
                {filteredChapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            </div>

            {/* Assignment Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Assignment</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.assignmentId}
                onChange={e => updateFilter('assignmentId', e.target.value)}
                disabled={loading}
              >
                <option value="">All Assignments</option>
                {filteredAssignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>

            {/* Student Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Student</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.studentId}
                onChange={e => updateFilter('studentId', e.target.value)}
                disabled={loading}
              >
                <option value="">All Students</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.status}
                onChange={e => updateFilter('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="late">Late</option>
                <option value="missing">Missing</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={filters.dateRange}
                onChange={e => updateFilter('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {!loadingReport && reportData.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filters.reportType === 'performance' && (
              <>
                <SummaryCard
                  label="Total Students"
                  value={reportData.summary.totalStudents || 0}
                  icon={Users}
                  color="blue"
                />
                <SummaryCard
                  label="Total Submissions"
                  value={reportData.summary.totalSubmissions || 0}
                  icon={FileText}
                  color="green"
                />
                <SummaryCard
                  label="Average Score"
                  value={`${reportData.summary.averageScore || 0}%`}
                  icon={BarChart2}
                  color="purple"
                />
                <SummaryCard
                  label="Late Submissions"
                  value={reportData.summary.lateSubmissions || 0}
                  icon={AlertCircle}
                  color="orange"
                />
              </>
            )}
            {filters.reportType === 'assignment' && (
              <>
                <SummaryCard
                  label="Total Assignments"
                  value={reportData.summary.totalAssignments || 0}
                  icon={FileText}
                  color="blue"
                />
                <SummaryCard
                  label="Total Attempts"
                  value={reportData.summary.totalAttempts || 0}
                  icon={Users}
                  color="green"
                />
                <SummaryCard
                  label="Average Score"
                  value={`${reportData.summary.averageScore || 0}%`}
                  icon={BarChart2}
                  color="purple"
                />
                <SummaryCard
                  label="Total Submitted"
                  value={reportData.summary.totalSubmitted || 0}
                  icon={Check}
                  color="green"
                />
              </>
            )}
            {filters.reportType === 'weak_students' && (
              <>
                <SummaryCard
                  label="Weak Students"
                  value={reportData.summary.totalWeakStudents || 0}
                  icon={TrendingDown}
                  color="red"
                />
                <SummaryCard
                  label="High Risk"
                  value={reportData.summary.highRisk || 0}
                  icon={AlertCircle}
                  color="red"
                />
                <SummaryCard
                  label="Medium Risk"
                  value={reportData.summary.mediumRisk || 0}
                  icon={AlertCircle}
                  color="orange"
                />
                <SummaryCard
                  label="Average Score"
                  value={`${reportData.summary.averageScore || 0}%`}
                  icon={BarChart2}
                  color="blue"
                />
              </>
            )}
            {filters.reportType === 'integrity' && (
              <>
                <SummaryCard
                  label="Total Flags"
                  value={reportData.summary.totalFlags || 0}
                  icon={ShieldAlert}
                  color="red"
                />
                <SummaryCard
                  label="Unique Students"
                  value={reportData.summary.uniqueStudents || 0}
                  icon={Users}
                  color="orange"
                />
                <SummaryCard
                  label="Unique Assignments"
                  value={reportData.summary.uniqueAssignments || 0}
                  icon={FileText}
                  color="blue"
                />
              </>
            )}
            {filters.reportType === 'coverage' && (
              <>
                <SummaryCard
                  label="Total Courses"
                  value={reportData.summary.totalCourses || 0}
                  icon={BookOpen}
                  color="blue"
                />
                <SummaryCard
                  label="Total Chapters"
                  value={reportData.summary.totalChapters || 0}
                  icon={FileText}
                  color="green"
                />
                <SummaryCard
                  label="Total Assignments"
                  value={reportData.summary.totalAssignments || 0}
                  icon={FileText}
                  color="purple"
                />
                <SummaryCard
                  label="Average Coverage"
                  value={`${reportData.summary.averageCoverage || 0}%`}
                  icon={BarChart2}
                  color="blue"
                />
              </>
            )}
          </div>
        )}

        {/* Report Preview */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Report Preview</h2>
              <p className="text-xs text-muted-foreground">
                {reportData.data.length} records • {currentReportType?.label}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exporting || loadingReport || reportData.data.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {exporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                ) : (
                  <><Download className="w-4 h-4" /> Export CSV</>
                )}
              </button>
              <button
                onClick={handleExportZIP}
                disabled={exporting || loadingReport || reportData.data.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {exporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                ) : (
                  <><Package className="w-4 h-4" /> Export ZIP</>
                )}
              </button>
            </div>
          </div>

          {loadingReport ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : reportData.data.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ReportTable data={reportData.data} reportType={filters.reportType} />
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

// ───────────────────────────── Components
interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

interface ReportTableProps {
  data: any[];
  reportType: string;
}

function ReportTable({ data, reportType }: ReportTableProps) {
  // Show first 50 records
  const displayData = data.slice(0, 50);

  if (reportType === 'performance') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-3 font-medium text-foreground">Student</th>
            <th className="text-left p-3 font-medium text-foreground">Course</th>
            <th className="text-left p-3 font-medium text-foreground">Assignment</th>
            <th className="text-right p-3 font-medium text-foreground">Score</th>
            <th className="text-center p-3 font-medium text-foreground">Status</th>
            <th className="text-center p-3 font-medium text-foreground">Flag</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="font-medium text-foreground">{row.studentName}</div>
                <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
              </td>
              <td className="p-3 text-muted-foreground">{row.courseName}</td>
              <td className="p-3 text-foreground">{row.assignmentTitle}</td>
              <td className="p-3 text-right">
                <span className="font-mono font-medium text-foreground">
                  {row.score}/{row.totalPoints}
                </span>
                <span className="text-xs text-muted-foreground ml-2">({row.percentage}%)</span>
              </td>
              <td className="p-3 text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  row.status === 'Submitted' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                  row.status === 'Late' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="p-3 text-center">
                {row.integrityFlag && (
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reportType === 'assignment') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-3 font-medium text-foreground">Assignment</th>
            <th className="text-left p-3 font-medium text-foreground">Course</th>
            <th className="text-right p-3 font-medium text-foreground">Attempts</th>
            <th className="text-right p-3 font-medium text-foreground">Submitted</th>
            <th className="text-right p-3 font-medium text-foreground">Avg Score</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="font-medium text-foreground">{row.assignmentTitle}</div>
                <div className="text-xs text-muted-foreground">{row.assignmentType}</div>
              </td>
              <td className="p-3 text-muted-foreground">{row.courseName}</td>
              <td className="p-3 text-right font-mono text-foreground">{row.attempts}</td>
              <td className="p-3 text-right font-mono text-foreground">{row.submitted}</td>
              <td className="p-3 text-right font-mono font-medium text-foreground">{row.averageScore}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reportType === 'weak_students') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-3 font-medium text-foreground">Student</th>
            <th className="text-right p-3 font-medium text-foreground">Avg Score</th>
            <th className="text-right p-3 font-medium text-foreground">Assignments</th>
            <th className="text-center p-3 font-medium text-foreground">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="font-medium text-foreground">{row.studentName}</div>
                <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
              </td>
              <td className="p-3 text-right font-mono font-medium text-foreground">{row.averageScore}%</td>
              <td className="p-3 text-right font-mono text-muted-foreground">{row.totalAssignments}</td>
              <td className="p-3 text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  row.riskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                  row.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                }`}>
                  {row.riskLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reportType === 'integrity') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-3 font-medium text-foreground">Student</th>
            <th className="text-left p-3 font-medium text-foreground">Assignment</th>
            <th className="text-left p-3 font-medium text-foreground">Course</th>
            <th className="text-right p-3 font-medium text-foreground">Score</th>
            <th className="text-left p-3 font-medium text-foreground">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="font-medium text-foreground">{row.studentName}</div>
                <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
              </td>
              <td className="p-3 text-foreground">{row.assignmentTitle}</td>
              <td className="p-3 text-muted-foreground">{row.courseName}</td>
              <td className="p-3 text-right font-mono text-foreground">{row.score}</td>
              <td className="p-3 text-muted-foreground">{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reportType === 'coverage') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left p-3 font-medium text-foreground">Course</th>
            <th className="text-left p-3 font-medium text-foreground">Chapter</th>
            <th className="text-right p-3 font-medium text-foreground">Assignments</th>
            <th className="text-right p-3 font-medium text-foreground">Attempts</th>
            <th className="text-right p-3 font-medium text-foreground">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-3 text-foreground">{row.courseName}</td>
              <td className="p-3 text-muted-foreground">{row.chapterName}</td>
              <td className="p-3 text-right font-mono text-foreground">{row.totalAssignments}</td>
              <td className="p-3 text-right font-mono text-foreground">{row.totalAttempts}</td>
              <td className="p-3 text-right font-mono font-medium text-foreground">{row.coveragePercentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return null;
}
