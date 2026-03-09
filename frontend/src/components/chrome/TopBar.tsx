'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
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
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { AccessibilityPanel } from '@/components/chrome/AccessibilityPanel';
import { ModeToggle } from '@/components/ui/mode-toggle';

export function TopBar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab, theme, setTheme } = useUIStore();

  // Sync the mode toggle with the current URL so it always reflects the active section
  useEffect(() => {
    if (!user || user.role !== 'student') return;
    const isAssessment = pathname.startsWith('/student/assessment');
    setActiveTab(isAssessment ? 'assessment' : 'learning');
  }, [pathname, user, setActiveTab]);

  if (!user) return null;

  const isStudent = user.role === 'student';
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

    return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-[#001e33] bg-gradient-to-b from-[#002F4C] to-[#006EB2] dark:from-[#00101e] dark:to-[#002548] px-4 shadow-lg">

      {/* Mode Switcher — centered absolutely, students only */}
      {isStudent && (
        <div className="absolute left-1/2 -translate-x-1/2" data-focus-hide>
          <ModeToggle
            value={activeTab as 'learning' | 'assessment'}
            onModeChange={(m) => {
              setActiveTab(m);
              router.push(m === 'assessment' ? '/student/assessment' : '/student');
            }}
          />
        </div>
      )}

      {/* Spacer to push right cluster to edge */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        {/* Accessibility */}
        <AccessibilityPanel />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sky-200 hover:text-white hover:bg-white/10"
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
