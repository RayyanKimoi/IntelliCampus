import React from 'react';
import { cn } from '@/lib/utils';

interface StatRingProps {
  value: number; // 0-100
  label: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function getMasteryColor(value: number): string {
  if (value >= 90) return '#2563EB'; // mastery-100
  if (value >= 70) return '#2BA870'; // mastery-75
  if (value >= 50) return '#EAB308'; // mastery-50
  if (value >= 25) return '#E8A830'; // mastery-25
  return '#DC4848'; // mastery-0
}

export function StatRing({
  value,
  label,
  size = 100,
  strokeWidth = 8,
  className,
}: StatRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getMasteryColor(value);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-semibold text-card-foreground">
            {value}%
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
