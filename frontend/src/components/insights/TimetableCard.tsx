'use client';

import React from 'react';

interface TimetableSlot {
  time: string;
  activity: string;
  color: string;
}

interface TimetableCardProps {
  day: string;
  dayShort: string;
  slots: TimetableSlot[];
}

const COLOR_MAP: Record<string, { color: string; rgb: string }> = {
  blue:    { color: '#006EB2', rgb: '0,110,178' },
  purple:  { color: '#7c3aed', rgb: '124,58,237' },
  amber:   { color: '#d97706', rgb: '217,119,6' },
  emerald: { color: '#10b981', rgb: '16,185,129' },
  red:     { color: '#ef4444', rgb: '239,68,68' },
  slate:   { color: '#64748b', rgb: '100,116,139' },
  rose:    { color: '#e11d48', rgb: '225,29,72' },
};

export function TimetableCard({ dayShort, slots }: TimetableCardProps) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3 min-w-[130px]"
      style={{ borderColor: 'rgba(0,110,178,0.12)', backgroundColor: 'rgba(0,47,76,0.01)' }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{dayShort}</span>

      {slots.map(({ time, activity, color }) => {
        const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
        return (
          <div
            key={`${activity}-${time}`}
            className="rounded-xl border px-3 py-2.5"
            style={{
              borderColor: `rgba(${c.rgb}, 0.2)`,
              backgroundColor: `rgba(${c.rgb}, 0.05)`,
            }}
          >
            <p className="text-xs font-semibold" style={{ color: c.color }}>{activity}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{time}</p>
          </div>
        );
      })}
    </div>
  );
}
