'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Eye, Type, Volume2, Focus, ZoomIn, Target, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAccessibility } from '@/hooks/useAccessibility';
import { authService } from '@/services/authService';

export default function StudentSettingsPage() {
  const { user, setUser } = useAuthStore();
  const { settings, updateSetting, isLoaded } = useAccessibility();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await authService.updateProfile({ name });
      const d = (res as any)?.data || res;
      if (d && setUser) setUser(d);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and accessibility preferences</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              {saved && <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Saved</Badge>}
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Accessibility
            </CardTitle>
            <CardDescription>
              Customize your learning experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Target className="h-4 w-4" /> ADHD Mode</Label>
                <p className="text-xs text-muted-foreground">Reduced distractions, simplified layout</p>
              </div>
              <Switch
                checked={settings?.adhdMode || false}
                onCheckedChange={v => updateSetting('adhdMode', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Dyslexia Font</Label>
                <p className="text-xs text-muted-foreground">OpenDyslexic font with better spacing</p>
              </div>
              <Switch
                checked={settings?.dyslexiaFont || false}
                onCheckedChange={v => updateSetting('dyslexiaFont', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Eye className="h-4 w-4" /> High Contrast</Label>
                <p className="text-xs text-muted-foreground">Higher contrast for better readability</p>
              </div>
              <Switch
                checked={settings?.highContrast || false}
                onCheckedChange={v => updateSetting('highContrast', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Speech Features</Label>
                <p className="text-xs text-muted-foreground">Text-to-speech & speech-to-text</p>
              </div>
              <Switch
                checked={settings?.speechEnabled || false}
                onCheckedChange={v => updateSetting('speechEnabled', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2"><Focus className="h-4 w-4" /> Focus Mode</Label>
                <p className="text-xs text-muted-foreground">Hide non-essential elements</p>
              </div>
              <Switch
                checked={settings?.focusMode || false}
                onCheckedChange={v => updateSetting('focusMode', v)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Font Scale</Label>
              <p className="text-xs text-muted-foreground">Adjust text size ({settings?.fontScale || 1}x)</p>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={settings?.fontScale || 1}
                onChange={e => updateSetting('fontScale', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
