'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { curriculumService, Course } from '@/services/curriculumService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, ChevronRight, GraduationCap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await curriculumService.getCourses() as any;
        const data = response.data || response;
        if (Array.isArray(data)) {
          setCourses(data);
        }
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground">
              Continue learning where you left off.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/50" />
                <CardContent className="h-32 p-6" />
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                <div className="h-2 bg-primary/10" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Includes Topics & Quizzes</span>
                    </div>
                    
                    {/* Placeholder for progress - would fetch from mastery service ideally */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Course Progress</span>
                        <span className="font-medium text-primary">0%</span>
                      </div>
                      <Progress value={0} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4">
                  <Link href={`/student/courses/${course.id}`} className="w-full">
                    <Button className="w-full group">
                      Continue Learning
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10 border-dashed">
            <GraduationCap className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold">No Courses Found</h3>
            <p className="text-muted-foreground max-w-md mt-2 mb-6">
              You haven't been enrolled in any courses yet. Check back later or contact your administrator.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
