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
import { Shield, Loader2, CheckCircle2, AlertTriangle, Brain, Lock } from 'lucide-react';
import { adminService, AIPolicy } from '@/services/adminService';

export default function AdminAIPolicyPage() {
  const [policy, setPolicy] = useState<AIPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const res = await adminService.getAIPolicy();
      const d = (res as any)?.data || res;
      setPolicy(d);
    } catch {
      setPolicy({
        institutionId: '',
        hintModeOnly: false,
        strictExamMode: false,
        maxTokens: 1024,
      });
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    setSaved(false);
    try {
      await adminService.updateAIPolicy(policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update policy');
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
          <h1 className="text-3xl font-bold tracking-tight">AI Policy Settings</h1>
          <p className="text-muted-foreground">
            Control how AI interacts with students across your institution
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Governance Controls
            </CardTitle>
            <CardDescription>
              These settings apply institution-wide and control AI behavior for all students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hint Mode Only */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <Label className="font-semibold">Hint Mode Only</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, the AI will only provide hints and guiding questions. It will never give direct answers.
                </p>
              </div>
              <Switch
                checked={policy?.hintModeOnly || false}
                onCheckedChange={v => setPolicy(p => p ? { ...p, hintModeOnly: v } : p)}
              />
            </div>

            {/* Strict Exam Mode */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <Label className="font-semibold">Strict Exam Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled globally, AI will refuse to help with any assessment-related questions.
                  Individual assignments can also enable this per-assessment.
                </p>
              </div>
              <Switch
                checked={policy?.strictExamMode || false}
                onCheckedChange={v => setPolicy(p => p ? { ...p, strictExamMode: v } : p)}
              />
            </div>

            <Separator />

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="font-semibold">Max Response Tokens</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum number of tokens (roughly words) the AI can use in a single response. Lower values reduce costs and keep answers concise.
              </p>
              <Input
                type="number"
                min={128}
                max={4096}
                value={policy?.maxTokens || 1024}
                onChange={e => setPolicy(p => p ? { ...p, maxTokens: parseInt(e.target.value) || 1024 } : p)}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">Range: 128 - 4096</p>
            </div>

            <Separator />

            {/* Status overview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Current Status</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={policy?.hintModeOnly ? 'default' : 'secondary'}>
                  Hint Mode: {policy?.hintModeOnly ? 'ON' : 'OFF'}
                </Badge>
                <Badge variant={policy?.strictExamMode ? 'destructive' : 'secondary'}>
                  Strict Exam: {policy?.strictExamMode ? 'ON' : 'OFF'}
                </Badge>
                <Badge variant="outline">
                  Max Tokens: {policy?.maxTokens || 1024}
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

        {/* Info card */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important</p>
              <p className="text-muted-foreground">
                Changes to AI policy take effect immediately for all new conversations.
                Active chat sessions will use the updated policy on their next message.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
