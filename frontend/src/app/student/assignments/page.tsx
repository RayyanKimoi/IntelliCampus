'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { assessmentService, Assignment } from '@/services/assessmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await assessmentService.getAssignments() as any;
        const data = response.data || response;
        if (Array.isArray(data)) {
          setAssignments(data);
        }
      } catch (error) {
        console.error('Failed to fetch assignments', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'late');
  const completedAssignments = assignments.filter(a => a.status === 'submitted' || a.status === 'graded');

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
    
    if (status === 'graded') return <Badge variant="success" className="bg-green-500">Graded</Badge>;
    if (status === 'submitted') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Submitted</Badge>;
    if (isOverdue) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="outline">Due Soon</Badge>;
  };

  const AssignmentList = ({ items }: { items: Assignment[] }) => (
    <div className="space-y-4">
      {items.length > 0 ? (
        items.map((assignment) => (
          <Card key={assignment.id} className="hover:bg-muted/30 transition-colors">
            <div className="flex items-center p-4 sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">{assignment.title}</p>
                  {getStatusBadge(assignment.status, assignment.dueDate)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-2 sm:gap-4">
                  <span>{assignment.courseName}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="ml-4">
                {assignment.status === 'pending' || assignment.status === 'late' ? (
                   <Link href={`/student/assignments/${assignment.id}`}>
                     <Button size="sm">Start <ChevronRight className="ml-1 h-3 w-3" /></Button>
                   </Link>
                ) : (
                   <div className="text-right">
                     {assignment.score !== undefined ? (
                       <span className="text-lg font-bold">{assignment.score} / {assignment.totalPoints}</span>
                     ) : (
                       <span className="text-sm text-muted-foreground">Pending Grade</span>
                     )}
                   </div>
                )}
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium">No assignments found</h3>
          <p className="text-muted-foreground">You're all caught up!</p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">
              Manage your tasks and deadlines.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAssignments.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                    {pendingAssignments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              <AssignmentList items={pendingAssignments} />
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <AssignmentList items={completedAssignments} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
