'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Lock, AlertTriangle, ShieldCheck, Eye, UserX, Search,
  Clock, Zap, RefreshCw, CheckCircle2, XCircle, Activity,
  Shield,
} from 'lucide-react';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface IntegrityFlag {
  id: string;
  studentName: string;
  course: string;
  assignmentTitle: string;
  flagType: string;
  severity: Severity;
  detectedAt: string;
  resolved: boolean;
}

const MOCK_FLAGS: IntegrityFlag[] = [
  { id: '1', studentName: 'David Osei',     course: 'CS101',   assignmentTitle: 'Sorting Algorithms Quiz',  flagType: 'Rapid Guessing (avg 2s/q)',    severity: 'critical', detectedAt: '2026-02-19 14:32', resolved: false },
  { id: '2', studentName: 'Mark Ellison',   course: 'Math201', assignmentTitle: 'Graph Traversal Exam',     flagType: 'Tab Switch Detected (3x)',      severity: 'high',     detectedAt: '2026-02-18 09:15', resolved: false },
  { id: '3', studentName: 'Priya Nair',     course: 'CS101',   assignmentTitle: 'Sorting Algorithms Quiz',  flagType: 'Identical Answers (Bob Kumar)', severity: 'high',     detectedAt: '2026-02-18 11:00', resolved: false },
  { id: '4', studentName: 'James Liu',      course: 'CS201',   assignmentTitle: 'Data Structures Project',  flagType: 'AI-Generated Content',          severity: 'medium',   detectedAt: '2026-02-17 16:45', resolved: false },
  { id: '5', studentName: 'Sara Okonkwo',   course: 'Math201', assignmentTitle: 'Number Theory Quiz',       flagType: 'Late Window Submission',        severity: 'low',      detectedAt: '2026-02-16 23:58', resolved: true  },
  { id: '6', studentName: 'Tom Hargreaves', course: 'CS101',   assignmentTitle: 'OOP Concepts Quiz',        flagType: 'Rapid Guessing (avg 3s/q)',    severity: 'medium',   detectedAt: '2026-02-15 10:22', resolved: true  },
];

const SEVERITY_META: Record<Severity, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',        dot: 'bg-red-500'    },
  high:     { label: 'High',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',   dot: 'bg-amber-500'  },
  low:      { label: 'Low',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',      dot: 'bg-blue-400'   },
};

const SECURITY_EVENTS = [
  { event: 'Admin login from new IP', time: '2026-02-20 08:03', actor: 'admin@campus.edu',     risk: 'low'  },
  { event: 'Bulk user export',        time: '2026-02-19 17:42', actor: 'admin@campus.edu',     risk: 'low'  },
  { event: 'Failed login attempt (3x)', time: '2026-02-19 12:11', actor: 'unknown',            risk: 'medium' },
  { event: 'Role escalation attempt', time: '2026-02-18 22:30', actor: 'student@campus.edu',   risk: 'high' },
  { event: 'API rate limit triggered', time: '2026-02-18 14:05', actor: 'System',              risk: 'medium' },
];

export default function AdminIntegrityPage() {
  const [flags, setFlags] = useState<IntegrityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setFlags(MOCK_FLAGS); setLoading(false); }, 650);
    return () => clearTimeout(t);
  }, []);

  const resolve = (id: string) =>
    setFlags(f => f.map(x => x.id === id ? { ...x, resolved: true } : x));

  const active = flags.filter(f => !f.resolved);
  const filtered = search
    ? flags.filter(f => f.studentName.toLowerCase().includes(search.toLowerCase()) || f.flagType.toLowerCase().includes(search.toLowerCase()))
    : flags;

  const bySeverity = (['critical', 'high', 'medium', 'low'] as Severity[]).map(s => ({
    s, count: active.filter(f => f.severity === s).length,
  }));

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrity & Security</h1>
          <p className="text-muted-foreground">Academic integrity flags, suspicious activity monitoring, and security events.</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <AlertTriangle className="h-4 w-4 text-red-500" />,     label: 'Active Flags',        value: loading ? '—' : active.length,                         sub: 'unresolved integrity issues' },
            { icon: <Zap className="h-4 w-4 text-amber-500" />,             label: 'Critical / High',     value: loading ? '—' : active.filter(f => f.severity === 'critical' || f.severity === 'high').length, sub: 'requiring immediate review' },
            { icon: <ShieldCheck className="h-4 w-4 text-green-500" />,     label: 'Resolved (30d)',      value: loading ? '—' : flags.filter(f => f.resolved).length,  sub: 'flags cleared this month' },
            { icon: <Activity className="h-4 w-4 text-primary" />,          label: 'Security Events',     value: SECURITY_EVENTS.length,                                sub: 'platform-level events' },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : (
                  <>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Severity breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Flag Severity
              </CardTitle>
              <CardDescription>Active integrity flags by severity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) :
                bySeverity.map(({ s, count }) => {
                  const m = SEVERITY_META[s];
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
                        <span className="text-sm">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={active.length ? (count / active.length) * 100 : 0} className="w-20 h-1.5 [&>*]:bg-current" />
                        <Badge className={`text-xs min-w-6 text-center ${m.color}`}>{count}</Badge>
                      </div>
                    </div>
                  );
                })
              }
            </CardContent>
          </Card>

          {/* Security events log */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Recent Security Events
              </CardTitle>
              <CardDescription>Platform-level security activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SECURITY_EVENTS.map(({ event, time, actor, risk }) => (
                  <div key={event + time} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${risk === 'high' ? 'bg-red-500' : risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{event}</p>
                        <p className="text-xs text-muted-foreground">{actor} · {time}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${risk === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : risk === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'}`}>
                      {risk}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Integrity flags table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Integrity Flags
                </CardTitle>
                <CardDescription>All academic integrity violations detected</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student or flag type..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No flags found.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map(flag => {
                  const m = SEVERITY_META[flag.severity];
                  return (
                    <div
                      key={flag.id}
                      className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${flag.resolved ? 'opacity-60 bg-muted/30 border-border' : 'bg-card border-border'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${m.dot}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{flag.studentName}</p>
                            <Badge className={`text-[10px] ${m.color}`}>{m.label}</Badge>
                            {flag.resolved && <Badge className="text-[10px] bg-muted text-muted-foreground">Resolved</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{flag.course} · {flag.assignmentTitle}</p>
                          <p className="text-xs font-medium mt-0.5 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />{flag.flagType}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5"><Clock className="inline h-3 w-3 mr-0.5" />{flag.detectedAt}</p>
                        </div>
                      </div>
                      {!flag.resolved && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => resolve(flag.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />Resolve
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs text-red-600 hover:bg-red-50">
                            <UserX className="h-3.5 w-3.5 mr-1" />Escalate
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
