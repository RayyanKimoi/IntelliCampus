'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TimetableCard } from './TimetableCard';

const TIMETABLE_DATA = [
  {
    day: 'Monday',
    dayShort: 'Mon',
    slots: [
      { time: '8–9 AM', activity: 'Concept Review', color: 'blue' },
      { time: '4–6 PM', activity: 'Practice Quiz', color: 'amber' },
    ],
  },
  {
    day: 'Tuesday',
    dayShort: 'Tue',
    slots: [
      { time: '8–9 AM', activity: 'AI Tutor Session', color: 'purple' },
    ],
  },
  {
    day: 'Wednesday',
    dayShort: 'Wed',
    slots: [
      { time: '7–9 AM', activity: 'Weak Concept Study', color: 'red' },
    ],
  },
  {
    day: 'Thursday',
    dayShort: 'Thu',
    slots: [
      { time: '4–6 PM', activity: 'Practice Problems', color: 'emerald' },
    ],
  },
  {
    day: 'Friday',
    dayShort: 'Fri',
    slots: [
      { time: '8–9 AM', activity: 'Quiz Practice', color: 'amber' },
    ],
  },
  {
    day: 'Saturday',
    dayShort: 'Sat',
    slots: [
      { time: '10–12 PM', activity: 'Mock Assessment', color: 'rose' },
    ],
  },
  {
    day: 'Sunday',
    dayShort: 'Sun',
    slots: [
      { time: 'All day', activity: 'Rest Day', color: 'slate' },
    ],
  },
];

export function AdaptiveTimetable() {
  return (
    <div
      className="insights-slide-up rounded-2xl border overflow-hidden"
      style={{ animationDelay: '180ms', borderColor: 'rgba(0,110,178,0.13)', boxShadow: '0 4px 24px rgba(0,110,178,0.07)' }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'rgba(0,110,178,0.1)', backgroundColor: 'rgba(0,47,76,0.02)' }}
      >
        <Calendar className="h-4 w-4" style={{ color: '#006EB2' }} />
        <h2 className="font-bold text-sm tracking-wide text-foreground">Adaptive Learning Timetable</h2>
      </div>

      {/* Timetable body */}
      <div className="p-5">
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 min-w-0 md:min-w-[700px]">
            {TIMETABLE_DATA.map((day) => (
              <TimetableCard
                key={day.day}
                day={day.day}
                dayShort={day.dayShort}
                slots={day.slots}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Schedule is generated based on your mastery gaps, recent activity load, and optimal cognitive windows.
        </p>
      </div>
    </div>
  );
}
