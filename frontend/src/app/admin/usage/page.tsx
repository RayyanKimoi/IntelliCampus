'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Clock, Activity, User, Filter } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface UsageLog {
  id: string;
  userId: string;
  actionType: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: { name: string; email: string; role: string };
}

export default function AdminUsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await adminService.getSystemLogs(100);
      const d = (res as any)?.data || res || [];
      setLogs(Array.isArray(d) ? d : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.actionType.toLowerCase().includes(filter.toLowerCase()));

  const actionTypes = [...new Set(logs.map(l => l.actionType))];

  const actionColors: Record<string, string> = {
    login: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ai_chat: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    assessment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    gamification: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  const getActionColor = (type: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (type.toLowerCase().includes(key)) return color;
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Usage</h1>
            <p className="text-muted-foreground">Monitor platform activity and usage patterns</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(logs.map(l => l.userId)).size}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Types</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actionTypes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Logs table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Recent system actions ({filteredLogs.length} entries)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No usage logs found.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{log.user?.name || log.userId}</p>
                        <p className="text-xs text-muted-foreground">{log.user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
