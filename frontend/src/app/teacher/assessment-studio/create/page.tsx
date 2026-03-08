'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ClipboardList, HelpCircle } from 'lucide-react';

export default function CreateAssessmentPage() {
  const router = useRouter();

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Assessment</h1>
            <p className="text-muted-foreground mt-0.5">Choose what type of assessment you want to create.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link href="/teacher/assessment-studio/create/assignment" className="block">
            <Card className="h-full cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Create Assignment</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Document-based assignment with rubric grading and flexible submission types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/assessment-studio/create/quiz" className="block">
            <Card className="h-full cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Create Quiz</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Multiple choice quiz — build manually or generate with AI from chapter content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
