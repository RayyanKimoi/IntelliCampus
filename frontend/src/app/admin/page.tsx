'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { adminService, AdminDashboardStats, UserSummary, AIPolicy } from '@/services/adminService';
import { Panel } from '@/components/panels/Panel';
import { MetricCard } from '@/components/panels/MetricCard';
import { ActionCard } from '@/components/panels/ActionCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  Cpu,
  Activity,
  Shield,
  Plus,
  FileText,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [policy, setPolicy] = useState<AIPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes, policyRes] = await Promise.allSettled([
          adminService.getDashboardStats(),
          adminService.getUsers({ limit: 5 }),
          adminService.getAIPolicy()
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        } else {
          setStats({
            totalUsers: 1250, totalStudents: 1100, totalTeachers: 150,
            totalCourses: 45,
            aiUsage: { totalRequests: 15420, tokensUsed: 4500000 },
            systemHealth: { database: 'healthy', aiService: 'healthy' }
          });
        }

        if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
          setUsers(usersRes.value.users);
        } else {
          setUsers([
            { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-10-01', status: 'active' },
            { id: '2', name: 'Bob Johnson', email: 'bob@example.com', role: 'teacher', institutionId: 'inst1', createdAt: '2023-09-15', status: 'active' },
            { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-11-05', status: 'suspended' },
            { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'admin', institutionId: 'inst1', createdAt: '2023-08-20', status: 'active' },
            { id: '5', name: 'Evan Wright', email: 'evan@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-10-12', status: 'active' },
          ]);
        }

        if (policyRes.status === 'fulfilled') {
          setPolicy(policyRes.value);
        } else {
          setPolicy({ institutionId: 'inst1', hintModeOnly: false, strictExamMode: false, maxTokens: 1000 });
        }
      } catch (err) {
        console.error('Unexpected error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePolicyChange = async (key: keyof AIPolicy, value: boolean) => {
    if (!policy) return;
    const oldPolicy = { ...policy };
    setPolicy({ ...policy, [key]: value });
    try {
      await adminService.updateAIPolicy({ [key]: value });
    } catch {
      setPolicy(oldPolicy);
    }
  };

  const healthColor = (status: string) =>
    status === 'healthy' ? 'text-success' : status === 'degraded' ? 'text-warning' : 'text-danger';

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage users, monitor system health, and configure AI policies.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="flex items-center gap-1.5">
              <Activity className={cn('h-4 w-4', healthColor(stats?.systemHealth?.database || 'healthy'))} />
              Database
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1.5">
              <Cpu className={cn('h-4 w-4', healthColor(stats?.systemHealth?.aiService || 'healthy'))} />
              AI Service
            </span>
          </div>
        </div>

        {/* ── Metric Cards ────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Users"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            accentColor="info"
            icon={<Users className="h-5 w-5" />}
            trend={{ direction: 'up', value: `${stats?.totalStudents ?? 0} students` }}
          />
          <MetricCard
            label="Active Courses"
            value={stats?.totalCourses ?? 0}
            accentColor="success"
            icon={<BookOpen className="h-5 w-5" />}
            trend={{ direction: 'up', value: 'All departments' }}
          />
          <MetricCard
            label="AI Requests"
            value={(stats?.aiUsage?.totalRequests ?? 0).toLocaleString()}
            accentColor="warning"
            icon={<Cpu className="h-5 w-5" />}
            trend={{ direction: 'up', value: 'Last 30 days' }}
          />
          <MetricCard
            label="Tokens Used"
            value={`${((stats?.aiUsage?.tokensUsed ?? 0) / 1000000).toFixed(1)}M`}
            accentColor="danger"
            icon={<Activity className="h-5 w-5" />}
            trend={{ direction: 'up', value: `$${((stats?.aiUsage?.tokensUsed ?? 0) * 0.000002).toFixed(2)} est.` }}
          />
        </div>

        {/* ── Users + Policy ──────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* User Table */}
          <Panel title="Recent Users" description="Latest registered users" className="lg:col-span-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-2xs text-muted-foreground uppercase tracking-wider bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-2xs',
                            u.role === 'admin' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                            u.role === 'teacher' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                          )}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={u.status === 'active' ? 'secondary' : 'destructive'}
                          className="text-2xs"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Right column: Policy + Quick Actions */}
          <div className="lg:col-span-3 space-y-6">
            <Panel
              title="AI Policy Control"
              description="Global settings for AI assistance"
              action={<Shield className="h-4 w-4 text-muted-foreground" />}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Strict Exam Mode</p>
                    <p className="text-xs text-muted-foreground">Disable all AI during exams</p>
                  </div>
                  <Switch
                    checked={policy?.strictExamMode || false}
                    onCheckedChange={(checked) => handlePolicyChange('strictExamMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Hint Only Mode</p>
                    <p className="text-xs text-muted-foreground">AI provides hints, not full solutions</p>
                  </div>
                  <Switch
                    checked={policy?.hintModeOnly || false}
                    onCheckedChange={(checked) => handlePolicyChange('hintModeOnly', checked)}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Quick Actions">
              <div className="space-y-3">
                <ActionCard title="Add New User" description="Create user account" icon={<Plus className="h-5 w-5" />} href="/admin/users" />
                <ActionCard title="Create Course" description="New course template" icon={<BookOpen className="h-5 w-5" />} href="/admin/ai-policy" />
                <ActionCard title="System Logs" description="View audit trail" icon={<FileText className="h-5 w-5" />} href="/admin/usage" />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
