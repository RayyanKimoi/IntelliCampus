'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck, Download, BarChart3, Users,
  CheckCircle2, Clock, FileText, GraduationCap, Loader2,
  Shield, Calendar, TrendingUp, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { FaBook } from 'react-icons/fa';
import { api } from '@/services/apiClient';

type ReportStatus = 'ready' | 'generating' | 'scheduled';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  lastGenerated: string;
  status: ReportStatus;
  format: 'PDF' | 'CSV' | 'XLSX' | 'ZIP';
  sizeKb?: number;
}

interface AccreditationCriterion {
  label: string;
  complete: boolean;
  value: number;
  details?: string;
}

interface InstitutionStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  totalAssignments: number;
  totalSubmissions: number;
  averageScore: string;
  aiSessions: number;
}

const STATUS_META: Record<ReportStatus, { label: string; color: string }> = {
  ready:      { label: 'Ready',      color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  generating: { label: 'Generating', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  scheduled:  { label: 'Scheduled',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Performance:   <TrendingUp className="h-4 w-4" />,
  'Student Data': <Users className="h-4 w-4" />,
  Governance:    <Shield className="h-4 w-4" />,
  'AI Analytics': <BarChart3 className="h-4 w-4" />,
  Retention:     <AlertTriangle className="h-4 w-4" />,
  Inclusion:     <GraduationCap className="h-4 w-4" />,
  Accreditation: <FileCheck className="h-4 w-4" />,
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [accreditation, setAccreditation] = useState<AccreditationCriterion[]>([]);
  const [accreditationProgress, setAccreditationProgress] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [generating, setGenerating] = useState('');
  const [error, setError] = useState('');

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

  // Load reports and stats
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reportsData, accreditationData] = await Promise.all([
        api.get('/admin/reports/list'),
        api.get('/admin/reports/accreditation')
      ]);

      setReports(reportsData.reports || []);
      setStats(reportsData.stats || null);
      setAccreditation(accreditationData.criteria || []);
      setAccreditationProgress(accreditationData.summary?.progress || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = async (report: Report) => {
    setDownloading(report.id);
    setError('');
    
    try {
      // First generate the report data
      const generatedData = await api.post('/admin/reports/generate', {
        reportId: report.id
      });

      // Then download in requested format
      const token = getAuthToken();
      const response = await fetch('/api/admin/reports/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: report.id,
          format: report.format,
          data: generatedData.data
        })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const ext = report.format.toLowerCase();
      link.download = `${report.id}_${new Date().toISOString().split('T')[0]}.${ext}`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download report');
    } finally {
      setDownloading('');
    }
  };

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    setError('');
    
    try {
      await api.post('/admin/reports/generate', { reportId });
      
      // Reload reports to update last generated date
      await loadData();
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to generate report');
    } finally {
      setGenerating('');
    }
  };

  const readyCount = reports.filter(r => r.status === 'ready').length;

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Accreditation</h1>
            <p className="text-muted-foreground">Generate, download and manage institutional reports for audits and accreditation bodies.</p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground mt-1">available templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Download</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyCount}</div>
              <p className="text-xs text-muted-foreground mt-1">generated and available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accreditation Ready</CardTitle>
              <GraduationCap className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accreditationProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {accreditation.filter(c => c.complete).length}/{accreditation.length} criteria met
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">across {stats?.totalCourses || 0} courses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accreditation readiness */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Accreditation Readiness
              </CardTitle>
              <CardDescription>{accreditationProgress}% of criteria met</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress 
                value={accreditationProgress} 
                className={`h-2.5 mb-4 ${
                  accreditationProgress >= 80 ? '[&>*]:bg-green-500' : 
                  accreditationProgress >= 60 ? '[&>*]:bg-amber-500' : 
                  '[&>*]:bg-red-400'
                }`} 
              />
              {accreditation.map(({ label, complete, value }) => (
                <div key={label} className="flex items-start gap-2">
                  {complete
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{label}</p>
                    {!complete && value > 0 && (
                      <Progress value={value} className="h-1 mt-1 [&>*]:bg-amber-400" />
                    )}
                    {!complete && value === 0 && (
                      <p className="text-[10px] text-muted-foreground">Not started</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Report index */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Available Reports
              </CardTitle>
              <CardDescription>Download or regenerate any institutional report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map(report => {
                  const s = STATUS_META[report.status];
                  const icon = CATEGORY_ICONS[report.category];
                  const isDownloading = downloading === report.id;
                  const isGenerating = generating === report.id;
                  return (
                    <div key={report.id} className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{report.title}</p>
                            <Badge className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{report.format}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{report.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="inline h-3 w-3 mr-0.5" />
                            Last: {report.lastGenerated}
                            {report.sizeKb && ` · ${(report.sizeKb / 1024).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs" 
                          onClick={() => handleGenerate(report.id)} 
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <FaBook className="h-3.5 w-3.5 mr-1" />
                              Regenerate
                            </>
                          )}
                        </Button>
                        {report.status === 'ready' && (
                          <Button 
                            size="sm" 
                            className="text-xs" 
                            onClick={() => handleDownload(report)} 
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Institutional Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Institutional Overview
              </CardTitle>
              <CardDescription>Real-time statistics from the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Teachers</p>
                  <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">AI Sessions</p>
                  <p className="text-2xl font-bold">{stats.aiSessions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold">
                    {stats.totalAssignments > 0 
                      ? Math.round((stats.totalSubmissions / stats.totalAssignments) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Report Schedule
            </CardTitle>
            <CardDescription>Automated generation cadence for key reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { freq: 'Daily',     report: 'AI Usage & Token Report',    next: 'Tomorrow 00:00',    color: 'border-primary/30 bg-primary/5' },
                { freq: 'Weekly',    report: 'Class Performance Summary',  next: 'Sun, Feb 22',       color: 'border-amber-200 bg-amber-50 dark:bg-amber-950/10' },
                { freq: 'Monthly',   report: 'Student Progress Export',    next: 'Mar 1, 2026',       color: 'border-violet-200 bg-violet-50 dark:bg-violet-950/10' },
                { freq: 'Quarterly', report: 'Accreditation Evidence Pack', next: 'Apr 1, 2026',     color: 'border-green-200 bg-green-50 dark:bg-green-950/10' },
              ].map(({ freq, report, next, color }) => (
                <div key={freq} className={`rounded-xl border p-4 ${color}`}>
                  <Badge variant="secondary" className="text-[10px] mb-2">{freq}</Badge>
                  <p className="text-sm font-medium leading-snug">{report}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />Next: {next}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
