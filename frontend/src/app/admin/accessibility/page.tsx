'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Eye, Type, Volume2, Focus, ZoomIn } from 'lucide-react';

export default function AdminAccessibilityPage() {
  const features = [
    {
      icon: Target,
      title: 'ADHD Mode',
      description: 'Reduces visual distractions, simplifies layouts, and adds focus timers for students with ADHD.',
      status: 'Available',
    },
    {
      icon: Type,
      title: 'Dyslexia-Friendly Font',
      description: 'Switches to OpenDyslexic font with increased letter spacing and clear character differentiation.',
      status: 'Available',
    },
    {
      icon: Eye,
      title: 'High Contrast Mode',
      description: 'Increases contrast ratios and adds visible borders to meet WCAG AAA standards.',
      status: 'Available',
    },
    {
      icon: Volume2,
      title: 'Speech Features',
      description: 'Text-to-speech for AI responses and speech-to-text for voice-based input.',
      status: 'Available',
    },
    {
      icon: Focus,
      title: 'Focus Mode',
      description: 'Hides non-essential UI elements and gamification to minimize cognitive overload.',
      status: 'Available',
    },
    {
      icon: ZoomIn,
      title: 'Font Scaling',
      description: 'Allows students to increase or decrease font size to their preference (0.8x - 1.5x).',
      status: 'Available',
    },
  ];

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accessibility</h1>
          <p className="text-muted-foreground">
            Accessibility features available to students. Each student can enable these from their settings page.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map(f => (
            <Card key={f.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <f.icon className="h-5 w-5 text-primary" />
                    {f.title}
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">{f.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Students can enable these features in their individual settings. Admins can also bulk-enable features
            for specific students who need accommodations via the user management panel.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
