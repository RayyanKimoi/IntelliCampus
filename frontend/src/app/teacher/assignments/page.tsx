'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, PlusCircle, Users, Calendar, ChevronRight } from 'lucide-react';
import { MOCK_TEACHER_COURSES_LIST, MOCK_TEACHER_ASSIGNMENTS } from '@/lib/mockData';
import { teacherService } from '@/services/teacherService';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  strictMode: boolean;
  courseId: string;
  courseName?: string;
  _count?: { questions: number; attempts: number };
}

export default function TeacherAssignmentsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await teacherService.getCourses();
        const courseList = Array.isArray((res as any)?.data || res) ? ((res as any)?.data || res) : [];
        const finalCourses = courseList.length > 0 ? courseList : MOCK_TEACHER_COURSES_LIST;
        setCourses(finalCourses);

        const assignMap: Record<string, Assignment[]> = {};
        for (const c of finalCourses) {
          try {
            const aRes = await teacherService.getAssignments(c.id);
            const aList = (aRes as any)?.data || aRes || [];
            const items = Array.isArray(aList) ? aList : [];
            assignMap[c.id] = items.length > 0 ? items : (MOCK_TEACHER_ASSIGNMENTS[c.id] ?? []);
          } catch {
            assignMap[c.id] = MOCK_TEACHER_ASSIGNMENTS[c.id] ?? [];
          }
        }
        setAssignments(assignMap);
      } catch {
        setCourses(MOCK_TEACHER_COURSES_LIST);
        setAssignments(MOCK_TEACHER_ASSIGNMENTS as any);
      }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const allAssignments = Object.entries(assignments).flatMap(([courseId, list]) =>
    list.map(a => ({ ...a, courseName: courses.find(c => c.id === courseId)?.name || 'Unknown' }))
  );

  const upcoming = allAssignments.filter(a => new Date(a.dueDate) > new Date());
  const past = allAssignments.filter(a => new Date(a.dueDate) <= new Date());

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">Create and manage assignments for your courses</p>
          </div>
          <Link href="/teacher/assignments/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> New Assignment
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : allAssignments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground mb-4">Create your first assignment to evaluate students.</p>
              <Link href="/teacher/assignments/new">
                <Button><PlusCircle className="h-4 w-4 mr-2" /> Create Assignment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming assignments.</p>
              ) : upcoming.map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </TabsContent>
            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No past assignments.</p>
              ) : past.map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

function AssignmentCard({ assignment: a }: { assignment: Assignment & { courseName: string } }) {
  const isPast = new Date(a.dueDate) <= new Date();
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{a.title}</span>
            {a.strictMode && <Badge variant="destructive" className="text-xs">Strict Mode</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{a.courseName}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due: {new Date(a.dueDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              {a._count?.questions || 0} questions
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {a._count?.attempts || 0} attempts
            </span>
          </div>
        </div>
        <Badge variant={isPast ? 'secondary' : 'default'}>{isPast ? 'Closed' : 'Active'}</Badge>
      </CardContent>
    </Card>
  );
}
