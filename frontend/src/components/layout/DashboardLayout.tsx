'use client';

import React from 'react';
import { AppShell } from '@/components/shells/AppShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
}

/**
 * Backward-compatible wrapper.
 * All new pages should import AppShell directly.
 */
export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  return <AppShell requiredRole={requiredRole}>{children}</AppShell>;
}
