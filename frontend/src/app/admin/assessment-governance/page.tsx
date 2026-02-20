'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Scale, ClipboardCheck, Clock, Shield, AlertTriangle, BookOpen,
  CheckCircle2, Settings, FileText, BarChart3, Lock, Eye,
} from 'lucide-react';

interface AssessmentPolicy {
  strictExamMode: boolean;
  preventTabSwitch: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowRetakes: boolean;
  maxRetakes: number;
  timeLimitMinutes: number;
  passMark: number;
  showAnswersAfterSubmit: boolean;
  plagiarismDetection: boolean;
  integrityAlerts: boolean;
  proofreadingWindow: number;
}

const QUESTION_BANK_STATS = [
  { subject: 'Algorithms',     total: 145, easy: 52, medium: 63, hard: 30 },
  { subject: 'Mathematics',    total: 91,  easy: 30, medium: 40, hard: 21 },
  { subject: 'OOP',            total: 68,  easy: 22, medium: 32, hard: 14 },
  { subject: 'Web Dev',        total: 53,  easy: 20, medium: 25, hard: 8  },
  { subject: 'Networking',     total: 37,  easy: 12, medium: 18, hard: 7  },
];

export default function AdminAssessmentGovernancePage() {
  const [policy, setPolicy] = useState<AssessmentPolicy>({
    strictExamMode: true,
    preventTabSwitch: true,
    randomizeQuestions: true,
    randomizeOptions: false,
    allowRetakes: true,
    maxRetakes: 2,
    timeLimitMinutes: 60,
    passMark: 50,
    showAnswersAfterSubmit: false,
    plagiarismDetection: true,
    integrityAlerts: true,
    proofreadingWindow: 5,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof AssessmentPolicy) =>
    setPolicy(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const total = QUESTION_BANK_STATS.reduce((s, x) => s + x.total, 0);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Governance</h1>
            <p className="text-muted-foreground">Configure exam policies, question bank rules, and institutional assessment standards.</p>
          </div>
          <Button onClick={handleSave} className="w-fit">
            {saved ? <><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />Saved</> : <><Settings className="h-4 w-4 mr-2" />Save Policy</>}
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <FileText className="h-4 w-4 text-primary" />, label: 'Total Questions', value: total.toLocaleString(), sub: 'across all subjects' },
            { icon: <ClipboardCheck className="h-4 w-4 text-green-500" />, label: 'Active Assessments', value: '23', sub: 'currently published' },
            { icon: <BarChart3 className="h-4 w-4 text-violet-500" />, label: 'Avg Pass Rate', value: '74%', sub: 'across all courses' },
            { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, label: 'Integrity Flags', value: '8', sub: 'this month' },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Exam Behaviour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Exam Behaviour
              </CardTitle>
              <CardDescription>Controls applied to all published assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: 'strictExamMode', label: 'Strict Exam Mode', sub: 'Disables AI tutor and hints during exams' },
                { key: 'preventTabSwitch', label: 'Prevent Tab Switching', sub: 'Logs and flags tab/window changes' },
                { key: 'randomizeQuestions', label: 'Randomise Questions', sub: 'Shuffle question order per student' },
                { key: 'randomizeOptions', label: 'Randomise Options', sub: 'Shuffle MCQ answer options' },
                { key: 'plagiarismDetection', label: 'Plagiarism Detection', sub: 'Compare submissions for similarity' },
                { key: 'integrityAlerts', label: 'Integrity Alerts', sub: 'Notify teacher of rapid or suspicious answers' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <Switch
                    checked={policy[key as keyof AssessmentPolicy] as boolean}
                    onCheckedChange={() => toggle(key as keyof AssessmentPolicy)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Numeric rules */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Numeric Limits
                </CardTitle>
                <CardDescription>Default thresholds for all assessments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'timeLimitMinutes', label: 'Default Time Limit (min)', min: 5, max: 300 },
                  { key: 'passMark', label: 'Pass Mark (%)', min: 1, max: 100 },
                  { key: 'maxRetakes', label: 'Max Retakes', min: 0, max: 10 },
                  { key: 'proofreadingWindow', label: 'Proofreading Window (min)', min: 0, max: 30 },
                ].map(({ key, label, min, max }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm shrink-0">{label}</Label>
                    <Input
                      type="number"
                      min={min}
                      max={max}
                      className="w-24 text-right"
                      value={policy[key as keyof AssessmentPolicy] as number}
                      onChange={e => setPolicy(p => ({ ...p, [key]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Result Visibility
                </CardTitle>
                <CardDescription>What students see post-submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'showAnswersAfterSubmit', label: 'Show Correct Answers', sub: 'Reveal answers after grading' },
                  { key: 'allowRetakes', label: 'Allow Retakes', sub: 'Let students re-attempt failed quizzes' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <Switch
                      checked={policy[key as keyof AssessmentPolicy] as boolean}
                      onCheckedChange={() => toggle(key as keyof AssessmentPolicy)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Question Bank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Question Bank Overview
            </CardTitle>
            <CardDescription>Distribution of questions by subject and difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {QUESTION_BANK_STATS.map(({ subject, total, easy, medium, hard }) => (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{subject}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 text-xs dark:bg-green-950/30 dark:text-green-400">Easy {easy}</Badge>
                      <Badge className="bg-amber-100 text-amber-700 text-xs dark:bg-amber-950/30 dark:text-amber-400">Med {medium}</Badge>
                      <Badge className="bg-red-100 text-red-700 text-xs dark:bg-red-950/30 dark:text-red-400">Hard {hard}</Badge>
                      <span className="text-xs text-muted-foreground w-8 text-right">{total}</span>
                    </div>
                  </div>
                  <Progress value={(total / QUESTION_BANK_STATS.reduce((s, x) => s + x.total, 0)) * 100} className="h-1.5 [&>*]:bg-primary/60" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
