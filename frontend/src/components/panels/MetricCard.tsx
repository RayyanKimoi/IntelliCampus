import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  accentColor?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  icon?: React.ReactNode;
  className?: string;
}

const accentMap: Record<string, string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  info: 'border-l-info',
  primary: 'border-l-primary',
};

export function MetricCard({
  label,
  value,
  trend,
  accentColor = 'primary',
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 border-l-[3px]',
        accentMap[accentColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold text-card-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground/50">{icon}</div>
        )}
      </div>
    </div>
  );
}
