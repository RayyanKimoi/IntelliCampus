'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { masteryService, MasteryOverview, TopicMastery } from '@/services/masteryService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { MOCK_MASTERY } from '@/lib/mockData';
import { Input } from '@/components/ui/input';

export default function StudentMasteryPage() {
  const [masteryData, setMasteryData] = useState<MasteryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const response = await masteryService.getMyMastery() as any;
        const data = response.data || response;
        if (data && (data.byTopic?.length || data.overallMastery)) {
          setMasteryData({
            overallMastery: data.overallMastery || 0,
            byTopic: Array.isArray(data.byTopic) ? data.byTopic : [],
            weakTopics: Array.isArray(data.weakTopics) ? data.weakTopics : [],
          });
        } else {
          setMasteryData(MOCK_MASTERY as any);
        }
      } catch (error) {
        console.error('Failed to fetch mastery data', error);
        setMasteryData(MOCK_MASTERY as any);
      } finally {
        setLoading(false);
      }
    };

    fetchMastery();
  }, []);

  const filteredTopics = (masteryData?.byTopic || []).filter(topic => 
    topic.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mastery Tracking</h1>
            <p className="text-muted-foreground">
              Track your proficiency across all subjects.
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Mastery</CardTitle>
              <Brain className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 animate-pulse bg-muted rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{Math.round(masteryData?.overallMastery || 0)}%</div>
                  <Progress value={masteryData?.overallMastery || 0} className="mt-2 h-2" />
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
               {loading ? (
                 <div className="h-8 w-16 animate-pulse bg-muted rounded" />
               ) : (
                 <div className="text-2xl font-bold">
                   {(masteryData?.byTopic || []).filter(t => t.masteryLevel >= 80).length}
                   <span className="text-muted-foreground text-sm font-normal ml-2">
                     / {(masteryData?.byTopic || []).length}
                   </span>
                 </div>
               )}
               <p className="text-xs text-muted-foreground mt-1">Topics with score &ge; 80%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Areas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
               {loading ? (
                 <div className="h-8 w-16 animate-pulse bg-muted rounded" />
               ) : (
                 <div className="text-2xl font-bold">
                   {(masteryData?.weakTopics || []).length}
                 </div>
               )}
               <p className="text-xs text-muted-foreground mt-1">Topics needing improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Topic Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of your mastery levels by topic.
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-[250px] bg-muted animate-pulse rounded" />
                      <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTopics.length > 0 ? (
              <div className="space-y-6">
                {filteredTopics.map((topic) => (
                  <div key={topic.topicId} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        topic.masteryLevel >= 80 ? 'border-green-500 bg-green-50 text-green-700' :
                        topic.masteryLevel >= 50 ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                        'border-red-500 bg-red-50 text-red-700'
                      }`}>
                         <span className="text-xs font-bold">{Math.round(topic.masteryLevel)}%</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{topic.topicName}</p>
                        <p className="text-sm text-muted-foreground">
                          {topic.courseName} • {topic.subjectName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {topic.lastAssessed && (
                         <span className="text-xs text-muted-foreground hidden md:inline-block">
                           Last assessed: {new Date(topic.lastAssessed).toLocaleDateString()}
                         </span>
                      )}
                      <Progress value={topic.masteryLevel} className="w-[100px] h-2 hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No topics found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
