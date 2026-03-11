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

  return (
    <TooltipProvider delayDuration={0}>
      <style jsx global>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .gamification-shiny {
          --shiny-cta-bg: #002F4C;
          --shiny-cta-bg-subtle: #004d7a;
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: #00d4ff;
          --shiny-cta-highlight-subtle: #8484ff;
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
          
          isolation: isolate;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
          background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
        }

        .gamification-shiny::before,
        .gamification-shiny::after,
        .gamification-shiny .shiny-content::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        /* Dots pattern */
        .gamification-shiny::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            white calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.3;
          z-index: -1;
        }

        /* Inner shimmer */
        .gamification-shiny::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.5;
        }

        .gamification-shiny .shiny-content {
          z-index: 1;
          position: relative;
        }

        .gamification-shiny .shiny-content::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        /* Animate */
        .gamification-shiny,
        .gamification-shiny::before,
        .gamification-shiny::after {
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .gamification-shiny:is(:hover, :focus-visible) {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
        }

        .gamification-shiny:is(:hover, :focus-visible),
        .gamification-shiny:is(:hover, :focus-visible)::before,
        .gamification-shiny:is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .gamification-shiny:is(:hover, :focus-visible) .shiny-content::before {
          opacity: 1;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes breathe {
          from, to {
            scale: 1;
          }
          50% {
            scale: 1.2;
          }
        }
      `}</style>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex h-full flex-col border-r border-[#001e33] bg-gradient-to-b from-[#002F4C] to-[#006EB2] dark:from-[#00101e] dark:to-[#002548] text-sky-100 shadow-xl transition-all duration-300',
          collapsed ? 'w-14' : 'w-56',
          isMobile
            ? cn('fixed left-0 top-0 z-50', !sidebarOpen && '-translate-x-full')
            : 'relative shrink-0'
        )}
      >
        {/* IntelliCampus Logo */}
        <Link 
          href={`/${user.role}`} 
          className={cn(
            "flex items-center border-b border-white/10 transition-all hover:bg-white/5",
            collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-3"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0">
            <img src="/icons/logo.png" alt="IntelliCampus" className="h-8 w-8 object-contain" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-white">
              IntelliCampus
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        {!isMobile && (
          <div className="flex h-10 items-center justify-end px-2 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 text-sky-200 hover:bg-white/10 hover:text-white"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
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
            const isGamification = item.label === 'Gamification';

            const link = (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-500',
                  isGamification
                    ? 'text-white gamification-shiny hover:scale-105'
                    : isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-sky-100/80 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                {isGamification && (
                  <span className="shiny-content absolute inset-0" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", isGamification && "relative z-10")} />
                {!collapsed && <span className={cn("truncate", isGamification && "relative z-10")}>{item.label}</span>}
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
