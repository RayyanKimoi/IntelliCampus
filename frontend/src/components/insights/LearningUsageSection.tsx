'use client';

import React from 'react';
import { Eye, Headphones, Gamepad2 } from 'lucide-react';

interface LearningStyle {
  icon: React.ReactNode;
  title: string;
  metrics: { label: string; value: number }[];
  description: string;
  color: string;       // e.g. '#006EB2'
  colorRgb: string;    // e.g. '0,110,178' for rgba()
}

const STYLES: LearningStyle[] = [
  {
    icon: <Eye className="h-4 w-4" />,
    title: 'Visual Learning',
    metrics: [{ label: 'Mind Maps Used', value: 12 }],
    description: 'You learn effectively through diagrams, charts, and visual structures.',
    color: '#006EB2',
    colorRgb: '0,110,178',
  },
  {
    icon: <Headphones className="h-4 w-4" />,
    title: 'Auditory Learning',
    metrics: [
      { label: 'TTS Sessions', value: 9 },
      { label: 'Videos Watched', value: 14 },
    ],
    description: 'Listening to explanations and discussions helps reinforce your understanding.',
    color: '#7c3aed',
    colorRgb: '124,58,237',
  },
  {
    icon: <Gamepad2 className="h-4 w-4" />,
    title: 'Kinesthetic Learning',
    metrics: [{ label: 'Practice Games Played', value: 18 }],
    description: 'Hands-on problem solving and interactive activities help your learning.',
    color: '#10b981',
    colorRgb: '16,185,129',
  },
];

export function LearningUsageSection() {
  return (
    <section className="space-y-4">
      <div className="insights-slide-up flex items-center gap-2" style={{ animationDelay: '60ms' }}>
        <Eye className="h-4 w-4" style={{ color: '#006EB2' }} />
        <h2 className="font-bold text-sm tracking-wide text-foreground">Cognitive Learning Style Usage</h2>
      </div>

      <div className="insights-slide-up grid gap-4 grid-cols-1 md:grid-cols-3" style={{ animationDelay: '120ms' }}>
        {STYLES.map(({ icon, title, metrics, description, color, colorRgb }) => (
          <div
            key={title}
            className="rounded-2xl border p-5 flex flex-col gap-4"
            style={{
              borderColor: `rgba(${colorRgb}, 0.18)`,
              boxShadow: `0 2px 16px rgba(${colorRgb}, 0.06)`,
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: `rgba(${colorRgb}, 0.1)` }}
              >
                <span style={{ color }}>{icon}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap gap-3">
              {metrics.map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-0">
                  <div className="text-3xl font-black" style={{ color }}>{value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
