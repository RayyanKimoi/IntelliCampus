'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardCheck, FileQuestion, BarChart3 } from 'lucide-react';

const TABS = [
  { label: 'Dashboard', href: '/student/assessment', icon: LayoutDashboard, exact: true },
  { label: 'Assignments', href: '/student/assessment/assignments', icon: ClipboardCheck, exact: false },
  { label: 'Quizzes', href: '/student/assessment/quizzes', icon: FileQuestion, exact: false },
  { label: 'Results', href: '/student/assessment/results', icon: BarChart3, exact: false },
];

export function AssessmentTabNav() {
  const path = usePathname();

  return (
    <div className="flex gap-1 border-b border-border mb-6 pb-0 overflow-x-auto">
      {TABS.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
