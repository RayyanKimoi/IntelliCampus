import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, description, action, children, className }: PanelProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
