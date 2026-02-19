import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  className,
}: ActionCardProps) {
  const Comp = href ? 'a' : 'button';

  return (
    <Comp
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-border bg-card p-4',
        'transition-all hover:border-primary/30 hover:-translate-y-0.5',
        'text-left w-full',
        className
      )}
    >
      {icon && (
        <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
    </Comp>
  );
}
