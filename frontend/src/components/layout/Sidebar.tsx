'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  MessageSquare,
  Trophy,
  Swords,
  Zap,
  RotateCcw,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Users,
  Shield,
  FileText,
  PlusCircle,
  Target,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'Courses', href: '/student/courses', icon: BookOpen },
  { label: 'AI Tutor', href: '/student/ai-chat', icon: MessageSquare },
  { label: 'Mastery', href: '/student/mastery', icon: Brain },
  { label: 'Assignments', href: '/student/assignments', icon: ClipboardList },
  { 
    label: 'Gamification', 
    icon: Trophy,
    children: [
      { label: 'Boss Battle', href: '/student/gamification/boss-battle', icon: Swords },
      { label: 'Sprint Quiz', href: '/student/gamification/sprint', icon: Zap },
      { label: 'Flashcards', href: '/student/gamification/flashcards', icon: RotateCcw },
      { label: 'Spin Wheel', href: '/student/gamification/spin', icon: Target },
      { label: 'Leaderboard', href: '/student/leaderboard', icon: BarChart3 },
    ]
  },
  { label: 'Settings', href: '/student/settings', icon: Settings },
];

const teacherNav: NavItem[] = [
  { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
  { label: 'Courses', href: '/teacher/courses', icon: BookOpen },
  { label: 'Create Course', href: '/teacher/courses/create', icon: PlusCircle },
  { label: 'Assignments', href: '/teacher/assignments', icon: ClipboardList },
  { label: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
  { label: 'Content', href: '/teacher/content', icon: FileText },
  { label: 'Settings', href: '/teacher/settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'AI Policy', href: '/admin/ai-policy', icon: Shield },
  { label: 'Accessibility', href: '/admin/accessibility', icon: Target },
  { label: 'Usage', href: '/admin/usage', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'student': return studentNav;
    case 'teacher': return teacherNav;
    case 'admin': return adminNav;
    default: return [];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar, theme, setTheme, isMobile, setSidebarOpen } = useUIStore();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleColors = {
    student: 'bg-campus-500',
    teacher: 'bg-success',
    admin: 'bg-warning',
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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          isMobile && !sidebarOpen && '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <Link href={`/${user.role}`} className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="font-bold text-lg">IntelliCampus</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                roleColors[user.role as keyof typeof roleColors]
              )}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navItems.map((item) => {
            const isActive = item.href 
              ? pathname === item.href || (item.href !== `/${user.role}` && pathname.startsWith(item.href))
              : item.children?.some(child => child.href && pathname.startsWith(child.href));
            
            const Icon = item.icon;

            if (item.children) {
              if (!sidebarOpen) {
                // Collapsed sidebar parent item logic (show tooltip or dropdown?)
                // For simplicity, showing just the icon which might open a dropdown or expand sidebar.
                // Let's make it a link to the first child or expand sidebar.
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-center',
                          isActive && 'bg-primary/10 text-primary'
                        )}
                        onClick={() => setSidebarOpen(true)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              // Expanded sidebar collapsible
              return (
                <Collapsible key={item.label} defaultOpen={isActive} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-9 pr-2 space-y-1 py-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href!}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          pathname === child.href
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            const linkContent = (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <Separator />

        {/* Bottom section */}
        <div className="p-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size={sidebarOpen ? 'default' : 'icon'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={cn('w-full', sidebarOpen ? 'justify-start gap-3' : '')}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {sidebarOpen && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full mt-1',
                  sidebarOpen ? 'justify-start gap-3 px-3' : ''
                )}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[160px]">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {user.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
      </aside>
    </TooltipProvider>
  );
}
