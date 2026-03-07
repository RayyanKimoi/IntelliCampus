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
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const pathname = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    
    console.log(`[AppShell ${timestamp}] Auth check:`, { 
      isLoading, 
      isAuthenticated,
      _hasHydrated,
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      requiredRole,
      pathname,
      hasRedirected: hasRedirectedRef.current
    });

    // Wait for store to hydrate from localStorage before checking auth
    if (!_hasHydrated) {
      console.log(`[AppShell ${timestamp}] Waiting for store hydration...`);
      return;
    }
    
    // Don't redirect if still loading
    if (isLoading) {
      console.log(`[AppShell ${timestamp}] Still loading, waiting...`);
      return;
    }
    
    // Prevent duplicate redirects
    if (hasRedirectedRef.current) {
      console.log(`[AppShell ${timestamp}] Already redirected, skipping`);
      return;
    }
    
    // Check if state actually changed before redirecting
    const stateChanged = 
      lastAuthCheckRef.current.isAuthenticated !== isAuthenticated ||
      lastAuthCheckRef.current.hasHydrated !== _hasHydrated;
    
    lastAuthCheckRef.current = { isAuthenticated, hasHydrated: _hasHydrated };
    
    if (!stateChanged && hasRedirectedRef.current === false) {
      // State hasn't changed since last check, and we haven't redirected
      // This prevents infinite loops from router changes
    }
    
    // Check if we have auth data in localStorage as backup
    const hasStoredAuth = typeof window !== 'undefined' && localStorage.getItem('intellicampus-auth');
    
    // Only redirect to login if definitely not authenticated and no stored auth
    if (!isAuthenticated && !hasStoredAuth) {
      console.log(`[AppShell ${timestamp}] ⚠️ No authentication found, redirecting to login`);
      hasRedirectedRef.current = true;
      router.push('/auth/login');
      return;
    }
    
    // Check role mismatch
    if (isAuthenticated && requiredRole && user?.role && user.role !== requiredRole) {
      console.log(`[AppShell ${timestamp}] ⚠️ Role mismatch (has: ${user.role}, needs: ${requiredRole}), redirecting to ${user.role}`);
      hasRedirectedRef.current = true;
      router.push(`/${user.role}`);
      return;
    }
    
    console.log(`[AppShell ${timestamp}] ✅ Auth check passed, rendering page`);
  }, [_hasHydrated, isLoading, isAuthenticated]);

  // Separate effect for role-based redirects to avoid dependency issues
  useEffect(() => {
    if (!_hasHydrated || isLoading || !isAuthenticated || hasRedirectedRef.current) {
      return;
    }
    
    if (requiredRole && user?.role && user.role !== requiredRole) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`[AppShell ${timestamp}] Role-based redirect: ${user.role} -> ${user.role}`);
      hasRedirectedRef.current = true;
      router.push(`/${user.role}`);
    }
  }, [requiredRole, user?.role, _hasHydrated, isLoading, isAuthenticated]);

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
