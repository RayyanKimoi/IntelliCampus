'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { AccessibilityPanel } from '@/components/chrome/AccessibilityPanel';
import type { ActiveMode } from '@/store/uiStore';

const modes: { value: ActiveMode; label: string }[] = [
  { value: 'learning', label: 'LEARNING' },
  { value: 'assessment', label: 'ASSESSMENT' },
  { value: 'insights', label: 'INSIGHTS' },
];

export function TopBar() {
  const { user } = useAuthStore();
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  if (!user) return null;

  const isStudent = user.role === 'student';
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activeIndex = modes.findIndex((m) => m.value === activeTab);
  const pillIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
      {/* Brand — left-anchored */}
      <Link href={`/${user.role}`} className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="font-bold text-base tracking-tight hidden sm:inline">
          IntelliCampus
        </span>
      </Link>

      {/* Mode Switcher — centered absolutely, students only */}
      {isStudent && (
        <div className="absolute left-1/2 -translate-x-1/2" data-focus-hide>
          <div className="relative flex items-center rounded-full bg-muted/80 p-1 shadow-inner">
            {/* Animated sliding pill */}
            <div
              className="absolute top-1 bottom-1 rounded-full bg-primary shadow-md"
              style={{
                width: `calc((100% - 8px) / 3)`,
                left: 4,
                transform: `translateX(${pillIndex * 100}%)`,
                transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            {modes.map((mode, idx) => (
              <button
                key={mode.value}
                onClick={() => setActiveTab(mode.value)}
                className={cn(
                  'relative z-10 w-28 py-1.5 text-xs font-bold tracking-widest rounded-full transition-colors duration-200',
                  pillIndex === idx
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer to push right cluster to edge */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8" data-focus-hide>
          <Bell className="h-4 w-4" />
        </Button>

        {/* Accessibility */}
        <AccessibilityPanel />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-2xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${user.role}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/';
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
