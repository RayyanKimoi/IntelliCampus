'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, PlusCircle, Users, Brain, ChevronRight } from 'lucide-react';
import { MOCK_TEACHER_COURSES } from '@/lib/mockData';
import { teacherService } from '@/services/teacherService';

interface Course {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: { subjects: number };
  subjects?: any[];
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await teacherService.getCourses();
        const data = (res as any)?.data || res || [];
        const list = Array.isArray(data) ? data : [];
        setCourses(list.length > 0 ? list : MOCK_TEACHER_COURSES as any);
      } catch {
        setCourses(MOCK_TEACHER_COURSES as any);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground">Manage your courses and curriculum</p>
          </div>
          <Link href="/teacher/courses/create">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">Create your first course to get started.</p>
              <Link href="/teacher/courses/create">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {course.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      {course._count?.subjects || course.subjects?.length || 0} subjects
                    </div>
                    <div className="text-xs">
                      Created {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/teacher/courses/${course.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      Manage <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
