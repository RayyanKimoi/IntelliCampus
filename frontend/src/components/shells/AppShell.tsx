'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { TopBar } from '@/components/chrome/TopBar';
import { AppSidebar } from '@/components/chrome/AppSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
}

export function AppShell({ children, requiredRole }: AppShellProps) {
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const { isMobile, setIsMobile, setSidebarOpen, theme } = useUIStore();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const lastAuthCheckRef = useRef({ isAuthenticated: false, hasHydrated: false });

  // Responsive
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setSidebarOpen]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auth guard - simplified with proper dependencies
  useEffect(() => {
    // Wait for store to hydrate from localStorage before checking auth
    if (!_hasHydrated) {
      return;
    }
    
    // Don't redirect if still loading
    if (isLoading) {
      return;
    }
    
    // Prevent duplicate redirects
    if (hasRedirectedRef.current) {
      return;
    }
    
    // Check if state actually changed before redirecting
    const stateChanged = 
      lastAuthCheckRef.current.isAuthenticated !== isAuthenticated ||
      lastAuthCheckRef.current.hasHydrated !== _hasHydrated;
    
    lastAuthCheckRef.current = { isAuthenticated, hasHydrated: _hasHydrated };
    
    // Only redirect to login if definitely not authenticated
    if (!isAuthenticated) {
      console.log('[AppShell] No authentication found, redirecting to login');
      hasRedirectedRef.current = true;
      router.push('/auth/login');
      return;
    }
    
    // Check role mismatch
    if (isAuthenticated && requiredRole && user?.role && user.role !== requiredRole) {
      console.log(`[AppShell] Role mismatch (has: ${user.role}, needs: ${requiredRole}), redirecting to /${user.role}`);
      hasRedirectedRef.current = true;
      router.push(`/${user.role}`);
      return;
    }
  }, [_hasHydrated, isLoading, isAuthenticated, user?.role, requiredRole, router]);

  // Show loading state until store hydrates and auth check completes
  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#E9FCFC] dark:bg-[#171f2e]">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Mobile menu button (floating) */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 left-4 z-30 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#E9FCFC] dark:bg-[#171f2e]">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
