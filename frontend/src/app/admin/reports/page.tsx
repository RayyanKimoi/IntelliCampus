'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck, Download, BarChart3, Users, BookOpen,
  CheckCircle2, Clock, FileText, GraduationCap, Loader2,
  Shield, Calendar, TrendingUp, AlertTriangle,
} from 'lucide-react';

type ReportStatus = 'ready' | 'generating' | 'scheduled';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  lastGenerated: string;
  status: ReportStatus;
  format: 'PDF' | 'CSV' | 'XLSX';
  sizeKb?: number;
}

const REPORTS: Report[] = [
  { id: '1', title: 'Institutional Performance Summary', description: 'Overall pass rates, engagement and AI usage across all courses.', category: 'Performance',    lastGenerated: '2026-02-18', status: 'ready',      format: 'PDF',  sizeKb: 412 },
  { id: '2', title: 'Student Progress Export',           description: 'Individual student mastery, scores, and activity timeline.',   category: 'Student Data',  lastGenerated: '2026-02-15', status: 'ready',      format: 'XLSX', sizeKb: 850 },
  { id: '3', title: 'Assessment Results Audit',          description: 'All assessment submissions, scores and integrity flags.',       category: 'Governance',    lastGenerated: '2026-02-10', status: 'ready',      format: 'CSV',  sizeKb: 230 },
  { id: '4', title: 'AI Usage & Token Report',           description: 'AI session logs, token consumption and mode distribution.',     category: 'AI Analytics',  lastGenerated: '2026-02-20', status: 'ready',      format: 'PDF',  sizeKb: 190 },
  { id: '5', title: 'Completion & Dropout Analysis',     description: 'Course completion rates and at-risk student identification.',   category: 'Retention',     lastGenerated: '2026-02-01', status: 'scheduled',  format: 'PDF'  },
  { id: '6', title: 'Accessibility Compliance Report',   description: 'Accessibility feature usage and WCAG compliance summary.',      category: 'Inclusion',     lastGenerated: '2026-01-28', status: 'ready',      format: 'PDF',  sizeKb: 155 },
  { id: '7', title: 'Accreditation Evidence Pack',       description: 'Full evidence bundle for accreditation body submission.',       category: 'Accreditation', lastGenerated: '2026-01-15', status: 'ready',      format: 'PDF',  sizeKb: 2340 },
];

const ACCREDITATION_CRITERIA = [
  { label: 'Learning Outcomes Documented',      complete: true,  value: 100 },
  { label: 'Assessment Governance Policy',      complete: true,  value: 100 },
  { label: 'Student Performance Data (90d)',    complete: true,  value: 100 },
  { label: 'AI Transparency Statement',         complete: true,  value: 100 },
  { label: 'Accessibility Compliance Report',   complete: true,  value: 100 },
  { label: 'Integrity & Security Audit',        complete: false, value: 72  },
  { label: 'Staff Qualification Records',       complete: false, value: 55  },
  { label: 'External Examiner Sign-off',        complete: false, value: 0   },
];

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
  const [downloading, setDownloading] = useState('');
  const [generating, setGenerating] = useState('');

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(''), 1500);
  };

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(''), 2000);
  };

  const readyCount = REPORTS.filter(r => r.status === 'ready').length;
  const accreditationPct = Math.round(ACCREDITATION_CRITERIA.filter(c => c.complete).length / ACCREDITATION_CRITERIA.length * 100);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Accreditation</h1>
            <p className="text-muted-foreground">Generate, download and manage institutional reports for audits and accreditation bodies.</p>
          </div>
          <Button className="w-fit">
            <FileText className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <FileCheck className="h-4 w-4 text-primary" />,       label: 'Total Reports',         value: REPORTS.length,   sub: 'available templates'      },
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,  label: 'Ready to Download',     value: readyCount,       sub: 'generated and available'  },
            { icon: <GraduationCap className="h-4 w-4 text-violet-500" />,label: 'Accreditation Ready',   value: `${accreditationPct}%`, sub: `${ACCREDITATION_CRITERIA.filter(c=>c.complete).length}/${ACCREDITATION_CRITERIA.length} criteria met` },
            { icon: <Calendar className="h-4 w-4 text-amber-500" />,      label: 'Next Scheduled',        value: 'Feb 28',         sub: 'Completion & Dropout'     },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{String(value)}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accreditation readiness */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Accreditation Readiness
              </CardTitle>
              <CardDescription>{accreditationPct}% of criteria met</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={accreditationPct} className={`h-2.5 mb-4 ${accreditationPct >= 80 ? '[&>*]:bg-green-500' : accreditationPct >= 60 ? '[&>*]:bg-amber-500' : '[&>*]:bg-red-400'}`} />
              {ACCREDITATION_CRITERIA.map(({ label, complete, value }) => (
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
                {REPORTS.map(report => {
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
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleGenerate(report.id)} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><BookOpen className="h-3.5 w-3.5 mr-1" />Regenerate</>}
                        </Button>
                        {report.status === 'ready' && (
                          <Button size="sm" className="text-xs" onClick={() => handleDownload(report.id)} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="h-3.5 w-3.5 mr-1" />Download</>}
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
