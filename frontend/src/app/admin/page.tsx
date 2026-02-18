'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { adminService, AdminDashboardStats, UserSummary, AIPolicy } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  BookOpen,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Plus,
  FileText,
  Shield,
  Activity,
  GraduationCap
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
        // Execute all promises in parallel
        const [statsRes, usersRes, policyRes] = await Promise.allSettled([
          adminService.getDashboardStats(),
          adminService.getUsers({ limit: 5 }),
          adminService.getAIPolicy()
        ]);

        // Handle Stats
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        } else {
          console.error('Failed to fetch stats:', statsRes.reason);
          // Mock stats for display if service fails
          setStats({
            totalUsers: 1250,
            totalStudents: 1100,
            totalTeachers: 150,
            totalCourses: 45,
            aiUsage: { totalRequests: 15420, tokensUsed: 4500000 },
            systemHealth: { database: 'healthy', aiService: 'healthy' }
          });
        }

        // Handle Users
        if (usersRes.status === 'fulfilled') {
          setUsers(usersRes.value.users);
        } else {
          console.error('Failed to fetch users:', usersRes.reason);
          // Mock users
          setUsers([
            { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-10-01', status: 'active' },
            { id: '2', name: 'Bob Johnson', email: 'bob@example.com', role: 'teacher', institutionId: 'inst1', createdAt: '2023-09-15', status: 'active' },
            { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-11-05', status: 'suspended' },
            { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'admin', institutionId: 'inst1', createdAt: '2023-08-20', status: 'active' },
            { id: '5', name: 'Evan Wright', email: 'evan@example.com', role: 'student', institutionId: 'inst1', createdAt: '2023-10-12', status: 'active' },
          ]);
        }

        // Handle Policy
        if (policyRes.status === 'fulfilled') {
          setPolicy(policyRes.value);
        } else {
          console.error('Failed to fetch policy:', policyRes.reason);
          // Mock policy
          setPolicy({
            institutionId: 'inst1',
            hintModeOnly: false,
            strictExamMode: false,
            maxTokens: 1000
          });
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

    // Optimistic update
    const oldPolicy = { ...policy };
    setPolicy({ ...policy, [key]: value });

    try {
      await adminService.updateAIPolicy({ [key]: value });
    } catch (error) {
      console.error('Failed to update policy:', error);
      // Revert on failure
      setPolicy(oldPolicy);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, monitor system health, and configure AI policies.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-card p-3 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Database:</span>
              <Activity className={`h-4 w-4 ${getStatusColor(stats?.systemHealth.database || 'healthy')}`} />
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AI Service:</span>
              <Cpu className={`h-4 w-4 ${getStatusColor(stats?.systemHealth.aiService || 'healthy')}`} />
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalStudents} Students, {stats?.totalTeachers} Teachers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.aiUsage.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((stats?.aiUsage.tokensUsed || 0) / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">Est. cost: ${((stats?.aiUsage.tokensUsed || 0) * 0.000002).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* User Management Table */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest registered users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">
                          <div>{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                           <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Policy & Quick Actions */}
          <div className="col-span-3 space-y-4">
            
            {/* AI Policy Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Policy Control
                </CardTitle>
                <CardDescription>Global settings for AI assistance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Strict Exam Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Disable all AI assistance during exam hours.
                    </p>
                  </div>
                  <Switch
                    checked={policy?.strictExamMode || false}
                    onCheckedChange={(checked) => handlePolicyChange('strictExamMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Hint Only Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      AI provides hints instead of full solutions.
                    </p>
                  </div>
                  <Switch
                    checked={policy?.hintModeOnly || false}
                    onCheckedChange={(checked) => handlePolicyChange('hintModeOnly', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add New User
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" /> Create Course
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> View System Logs
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
