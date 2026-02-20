'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { studentNavByMode, teacherNav, adminNav, type NavItem } from '@/lib/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getNavItems(role: string, activeTab: string): NavItem[] {
  switch (role) {
    case 'student':
      return studentNavByMode[activeTab] || studentNavByMode.learning;
    case 'teacher':
      return teacherNav;
    case 'admin':
      return adminNav;
    default:
      return [];
  }
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar, activeTab, isMobile, setSidebarOpen } = useUIStore();

  if (!user) return null;

  const navItems = getNavItems(user.role, activeTab);
  const collapsed = !sidebarOpen && !isMobile;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleBadgeColors: Record<string, string> = {
    student: 'bg-blue-600',
    teacher: 'bg-emerald-600',
    admin: 'bg-amber-600',
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex h-full flex-col border-r border-border bg-sidebar-bg text-sidebar-fg transition-all duration-200',
          collapsed ? 'w-14' : 'w-56',
          isMobile
            ? cn('fixed left-0 top-0 z-50', !sidebarOpen && '-translate-x-full')
            : 'relative shrink-0'
        )}
      >
        {/* Collapse toggle */}
        {!isMobile && (
          <div className="flex h-10 items-center justify-end px-2 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 text-sidebar-fg hover:bg-sidebar-hover hover:text-white"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Role badge */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium tracking-wider text-white uppercase',
                roleBadgeColors[user.role] || 'bg-gray-600'
              )}
            >
              {user.role}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = (() => {
              // Use exact match when this item is a parent of other nav items
              // (prevents /student/assessment highlighting while on /student/assessment/results)
              const isParentOfSibling = navItems.some(
                other => other.href !== item.href && other.href.startsWith(item.href + '/')
              );
              if (isParentOfSibling || item.href === `/${user.role}`) {
                return pathname === item.href;
              }
              return pathname.startsWith(item.href);
            })();

            const Icon = item.icon;

            const link = (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href + item.label}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.href + item.label}>{link}</React.Fragment>;
          })}
        </nav>

        <Separator className="bg-white/10" />

        {/* User zone */}
        <div className="p-2">
          <div
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-2',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-2xs bg-white/20 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate text-white">
                  {user.name}
                </span>
                <span className="text-2xs text-sidebar-fg truncate">
                  {user.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
