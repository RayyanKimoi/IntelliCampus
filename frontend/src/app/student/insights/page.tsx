'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LearningUsageSection } from '@/components/insights/LearningUsageSection';
import { AdaptiveTimetable } from '@/components/insights/AdaptiveTimetable';
import { Lightbulb } from 'lucide-react';

export default function InsightsPage() {
  return (
    <DashboardLayout requiredRole="student">
      <style jsx global>{`
        @keyframes insightsSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .insights-slide-up { animation: insightsSlideUp 0.3s ease-out both; }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8 pb-8">
        {/* ── Header ── */}
        <div className="insights-slide-up flex items-center gap-4" style={{ animationDelay: '0ms' }}>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #002F4C, #006EB2)' }}
          >
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Learning Insights</h1>
            <p className="text-sm text-muted-foreground">Your cognitive learning profile and adaptive weekly schedule.</p>
          </div>
        </div>

        <LearningUsageSection />
        <AdaptiveTimetable />
      </div>
    </DashboardLayout>
  );
}
