'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatWindow } from '@/components/ai/ChatWindow';
import { Card } from '@/components/ui/card';
import { curriculumService, Topic } from '@/services/curriculumService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface TopicWithCourse extends Topic {
  courseId: string;
}

function StudentAIChatContent() {
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get('topicId');
  
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId);
  const [topics, setTopics] = useState<TopicWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await curriculumService.getCourses() as any;
        const courses = response.data || response;

        if (Array.isArray(courses)) {
           const allTopics: TopicWithCourse[] = [];
           
           // Fetch topics for all enrolled courses
           for (const course of courses) {
             try {
               const subjectsRes = await curriculumService.getSubjects(course.id) as any;
               const subjects = subjectsRes.data || subjectsRes;

               if (Array.isArray(subjects)) {
                 for (const subject of subjects) {
                    const topicsRes = await curriculumService.getTopics(subject.id) as any;
                    const topicsData = topicsRes.data || topicsRes;

                    if (Array.isArray(topicsData)) {
                      const courseTopics = topicsData.map((t: any) => ({
                        ...t,
                        courseId: course.id
                      }));
                      allTopics.push(...courseTopics);
                    }
                 }
               }
             } catch (e) {
               console.error(`Failed to fetch topics for course ${course.id}`, e);
             }
           }
           
           setTopics(allTopics);
           
           if (!selectedTopicId && allTopics.length > 0) {
              setSelectedTopicId(allTopics[0].id);
           }
        }
      } catch (error) {
        console.error('Failed to fetch topics for chat', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopics();
  }, []);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Tutor</h1>
          <p className="text-muted-foreground text-sm">
            Ask questions about your curriculum
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select 
            value={selectedTopicId || ''} 
            onValueChange={setSelectedTopicId}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading topics..." : "Select a topic"} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border rounded-lg shadow-sm bg-card">
        {selectedTopic ? (
          <ChatWindow 
            key={selectedTopic.id} // Reset chat when topic changes
            topicId={selectedTopic.id} 
            courseId={selectedTopic.courseId}
            topicName={selectedTopic.name}
            mode="learning" 
          />
        ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center">
              {loading ? (
                <p>Loading your curriculum...</p>
              ) : (
                <p>No topics available. Enroll in a course to start chatting.</p>
              )}
            </div>
        )}
      </div>
    </div>
  );
}

export default function StudentAIChatPage() {
  return (
    <DashboardLayout requiredRole="student">
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      }>
        <StudentAIChatContent />
      </Suspense>
    </DashboardLayout>
  );
}
