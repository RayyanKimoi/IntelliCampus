'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { curriculumService, Course, Subject, Topic } from '@/services/curriculumService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, PlayCircle, BookOpen, CheckCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const [courseRes, subjectsRes] = await Promise.all([
          curriculumService.getCourse(courseId) as Promise<any>,
          curriculumService.getSubjects(courseId) as Promise<any>
        ]);
        
        const courseData = courseRes.data || courseRes;
        const subjectsData = subjectsRes.data || subjectsRes;

        if (courseData) setCourse(courseData);
        
        // Fetch topics for subjects if subjects exist
        if (Array.isArray(subjectsData) && subjectsData.length > 0) {
           const subjectsWithTopics = await Promise.all(
             subjectsData.map(async (subject: any) => {
               try {
                 const topicsRes = await curriculumService.getTopics(subject.id) as any;
                 const topicsData = topicsRes.data || topicsRes;
                 return { ...subject, topics: Array.isArray(topicsData) ? topicsData : [] };
               } catch {
                 return { ...subject, topics: [] };
               }
             })
           );
           setSubjects(subjectsWithTopics);
        } else {
           setSubjects([]);
        }

      } catch (error) {
        console.error('Failed to fetch course details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
     return (
       <DashboardLayout requiredRole="student">
         <div className="flex flex-col items-center justify-center py-20">
           <h2 className="text-2xl font-bold">Course Not Found</h2>
           <Link href="/student/courses" className="mt-4 text-primary hover:underline">
             Back to Courses
           </Link>
         </div>
       </DashboardLayout>
     );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            href="/student/courses" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Courses
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-3xl">
                {course.description}
              </p>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Curriculum
            </CardTitle>
            <CardDescription>
              Explore the subjects and topics included in this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {subjects.length > 0 ? (
               <Accordion type="multiple" defaultValue={subjects.map(s => s.id)} className="w-full">
                 {subjects.map((subject) => (
                   <AccordionItem key={subject.id} value={subject.id}>
                     <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                       <span className="font-semibold text-left">{subject.name}</span>
                     </AccordionTrigger>
                     <AccordionContent className="pt-2 pb-4 px-4">
                       <p className="text-sm text-muted-foreground mb-4 pl-1">
                         {subject.description}
                       </p>
                       
                       <div className="space-y-2">
                         {subject.topics && subject.topics.length > 0 ? (
                           subject.topics.map((topic) => (
                             <div 
                               key={topic.id}
                               className="flex items-center justify-between p-3 rounded-md border bg-card hover:border-primary/50 transition-colors group"
                             >
                               <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                   <PlayCircle className="h-4 w-4" />
                                 </div>
                                 <div className="flex flex-col">
                                   <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                     {topic.name}
                                   </h4>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                        {topic.difficultyLevel}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] md:max-w-md">
                                        {topic.description}
                                      </span>
                                   </div>
                                 </div>
                               </div>
                               
                               <Link href={`/student/chat?topicId=${topic.id}`}>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start
                                  </Button>
                               </Link>
                             </div>
                           ))
                         ) : (
                           <div className="text-sm text-muted-foreground italic pl-1">
                             No topics available yet.
                           </div>
                         )}
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 ))}
               </Accordion>
             ) : (
               <div className="text-center py-8 text-muted-foreground">
                 No curriculum content available for this course yet.
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
