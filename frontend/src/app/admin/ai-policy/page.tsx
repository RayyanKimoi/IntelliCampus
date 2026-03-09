'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Shield, Loader2, CheckCircle2, AlertTriangle, Eye, Zap, Clipboard, BarChart2, Clock, RefreshCw, Search, Copy } from 'lucide-react';
import { api } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';

interface IntegrityPolicy {
  id?: string;
  institutionId?: string;
  rapidGuessingEnabled: boolean;
  rapidGuessingThreshold: number;
  tabSwitchingEnabled: boolean;
  tabSwitchingThreshold: number;
  copyPasteEnabled: boolean;
  highAnomalyEnabled: boolean;
  unusualPatternEnabled: boolean;
  fastCompletionEnabled: boolean;
  fastCompletionThreshold: number;
  multipleReattemptEnabled: boolean;
  similarityDetectedEnabled: boolean;
  similarityThreshold: number;
}

const DEFAULT_POLICY: IntegrityPolicy = {
  rapidGuessingEnabled: true,
  rapidGuessingThreshold: 10,
  tabSwitchingEnabled: true,
  tabSwitchingThreshold: 5,
  copyPasteEnabled: true,
  highAnomalyEnabled: true,
  unusualPatternEnabled: true,
  fastCompletionEnabled: true,
  fastCompletionThreshold: 40,
  multipleReattemptEnabled: true,
  similarityDetectedEnabled: true,
  similarityThreshold: 80,
};

export default function AdminAIPolicyPage() {
  const [policy, setPolicy] = useState<IntegrityPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const res: any = await api.get('/admin/integrity-policy');
      const d = res?.data || res;
      if (d) setPolicy({ ...DEFAULT_POLICY, ...d });
    } catch {
      setPolicy(DEFAULT_POLICY);
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof IntegrityPolicy>(key: K, value: IntegrityPolicy[K]) =>
    setPolicy(p => ({ ...p, [key]: value }));

  const savePolicy = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/admin/integrity-policy', policy);
      setSaved(true);
      toast({ title: 'Policy saved', description: 'Integrity monitoring settings updated.' });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save policy', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Control</h1>
          <p className="text-muted-foreground">
            Configure integrity monitoring policies for your institution
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Integrity Monitoring Controls
            </CardTitle>
            <CardDescription>
              Configure how IntelliCampus detects suspicious student behavior during assessments.
              These settings apply institution-wide to all quizzes, assignments, and coding assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Rapid Guessing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <Label className="font-semibold">Rapid Guessing Detection</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detects students answering many questions in extremely short time intervals.
                  </p>
                </div>
                <Switch
                  checked={policy.rapidGuessingEnabled}
                  onCheckedChange={v => update('rapidGuessingEnabled', v)}
                />
              </div>
              {policy.rapidGuessingEnabled && (
                <div className="flex items-center gap-3 px-4">
                  <Label className="text-sm text-muted-foreground w-60">Rapid Guessing Threshold (answers/min)</Label>
                  <Input
                    type="number" min={1} max={120}
                    value={policy.rapidGuessingThreshold}
                    onChange={e => update('rapidGuessingThreshold', parseInt(e.target.value) || 10)}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            {/* High Anomaly */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-purple-500" />
                  <Label className="font-semibold">High Anomaly Detection</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Flags statistically unusual answer patterns compared to the rest of the class.
                </p>
              </div>
              <Switch
                checked={policy.highAnomalyEnabled}
                onCheckedChange={v => update('highAnomalyEnabled', v)}
              />
            </div>

            {/* Tab Switching */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <Label className="font-semibold">Tab Switching Detection</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Flags students who frequently switch browser tabs during assessments.
                  </p>
                </div>
                <Switch
                  checked={policy.tabSwitchingEnabled}
                  onCheckedChange={v => update('tabSwitchingEnabled', v)}
                />
              </div>
              {policy.tabSwitchingEnabled && (
                <div className="flex items-center gap-3 px-4">
                  <Label className="text-sm text-muted-foreground w-60">Max allowed tab switches</Label>
                  <Input
                    type="number" min={1} max={50}
                    value={policy.tabSwitchingThreshold}
                    onChange={e => update('tabSwitchingThreshold', parseInt(e.target.value) || 5)}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            {/* Copy Paste */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-orange-500" />
                  <Label className="font-semibold">Copy Paste Detection</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detects copy/paste activity in text or coding assignments.
                </p>
              </div>
              <Switch
                checked={policy.copyPasteEnabled}
                onCheckedChange={v => update('copyPasteEnabled', v)}
              />
            </div>

            {/* Unusual Pattern */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-teal-500" />
                  <Label className="font-semibold">Unusual Pattern Detection</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detects abnormal answer patterns compared to class averages.
                </p>
              </div>
              <Switch
                checked={policy.unusualPatternEnabled}
                onCheckedChange={v => update('unusualPatternEnabled', v)}
              />
            </div>

            {/* Fast Completion */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <Label className="font-semibold">Extremely Fast Completion</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Flags submissions completed far faster than expected time.
                  </p>
                </div>
                <Switch
                  checked={policy.fastCompletionEnabled}
                  onCheckedChange={v => update('fastCompletionEnabled', v)}
                />
              </div>
              {policy.fastCompletionEnabled && (
                <div className="flex items-center gap-3 px-4">
                  <Label className="text-sm text-muted-foreground w-60">Flag if completed faster than (% of expected time)</Label>
                  <Input
                    type="number" min={5} max={95}
                    value={policy.fastCompletionThreshold}
                    onChange={e => update('fastCompletionThreshold', parseInt(e.target.value) || 40)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>

            {/* Multiple Reattempt */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-indigo-500" />
                  <Label className="font-semibold">Multiple Reattempt Pattern</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Flags suspicious repeated attempts across questions.
                </p>
              </div>
              <Switch
                checked={policy.multipleReattemptEnabled}
                onCheckedChange={v => update('multipleReattemptEnabled', v)}
              />
            </div>

            {/* Similarity Detection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4 text-pink-500" />
                    <Label className="font-semibold">Similarity Detection</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detects high similarity between student answers.
                  </p>
                </div>
                <Switch
                  checked={policy.similarityDetectedEnabled}
                  onCheckedChange={v => update('similarityDetectedEnabled', v)}
                />
              </div>
              {policy.similarityDetectedEnabled && (
                <div className="flex items-center gap-3 px-4">
                  <Label className="text-sm text-muted-foreground w-60">Flag if similarity exceeds</Label>
                  <Input
                    type="number" min={10} max={100}
                    value={policy.similarityThreshold}
                    onChange={e => update('similarityThreshold', parseInt(e.target.value) || 80)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Current Status */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Current Status</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={policy.rapidGuessingEnabled ? 'default' : 'secondary'}>
                  Rapid Guessing: {policy.rapidGuessingEnabled ? 'ON' : 'OFF'}
                </Badge>
                <Badge variant={policy.tabSwitchingEnabled ? 'default' : 'secondary'}>
                  Tab Switching: {policy.tabSwitchingEnabled ? 'ON' : 'OFF'}
                </Badge>
                <Badge variant={policy.copyPasteEnabled ? 'default' : 'secondary'}>
                  Copy Paste Detection: {policy.copyPasteEnabled ? 'ON' : 'OFF'}
                </Badge>
                <Badge variant={policy.similarityDetectedEnabled ? 'default' : 'secondary'}>
                  Similarity Detection: {policy.similarityDetectedEnabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end gap-2">
              {saved && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Saved!
                </Badge>
              )}
              <Button onClick={savePolicy} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important</p>
              <p className="text-muted-foreground">
                Changes to integrity policies apply immediately to new assessment attempts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
