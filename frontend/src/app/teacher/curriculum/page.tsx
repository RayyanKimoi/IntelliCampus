'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { chapterCurriculumService, Course } from '@/services/chapterCurriculumService';
import { FaBook } from 'react-icons/fa';
import { ChevronRight, FileText, BookMarked } from 'lucide-react';

export default function TeacherCurriculumPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await chapterCurriculumService.getTeacherCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/teacher/curriculum/${courseId}`);
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curriculum Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your assigned courses, chapters, and learning materials
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !courses || courses.length === 0 ? (
          /* Empty state */
          <Card className="text-center py-16">
            <CardContent>
              <FaBook className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You don't have any courses assigned yet. Contact your administrator to get courses assigned to you.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Courses grid */
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {courses.map((course) => (
              <motion.div
                key={course.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <Card
                  className="group cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all hover:-translate-y-0.5"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FaBook className="h-6 w-6 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <BookMarked className="h-4 w-4" />
                        <span>
                          {course._count?.chapters || 0}{' '}
                          {course._count?.chapters === 1 ? 'chapter' : 'chapters'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>
                          {course._count?.assignments || 0}{' '}
                          {course._count?.assignments === 1 ? 'assignment' : 'assignments'}
                        </span>
                      </div>
                    </div>
                    {course._count && course._count.chapters === 0 && (
                      <Badge variant="outline" className="mt-3 text-xs">
                        No chapters yet
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
