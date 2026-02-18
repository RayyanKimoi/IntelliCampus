'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Crown } from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';
import { useAuthStore } from '@/store/authStore';

interface LeaderEntry {
  userId: string;
  name: string;
  totalXP: number;
  level: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await gamificationService.getLeaderboard(20);
        const data = (res as any)?.data || (res as any)?.leaderboard || res || [];
        const list = Array.isArray(data) ? data : [];
        setLeaders(list.map((l: any, i: number) => ({
          userId: l.userId || l.id,
          name: l.name || l.user?.name || `Student ${i + 1}`,
          totalXP: l.totalXP ?? l.xp ?? 0,
          level: l.level ?? 1,
          rank: i + 1,
        })));
      } catch {
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 mx-auto" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400 mx-auto" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600 mx-auto" />;
    return <span>#{rank}</span>;
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with classmates for the top spot!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Students
            </CardTitle>
            <CardDescription>XP Ranking</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No leaderboard data yet. Start earning XP to climb the ranks!
              </p>
            ) : (
              <div className="space-y-2">
                {leaders.map((student) => {
                  const isMe = student.userId === user?.id;
                  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={student.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isMe ? 'bg-primary/5 border-primary/30' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 font-bold text-muted-foreground text-center">
                          {getRankIcon(student.rank)}
                        </div>
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className={isMe ? 'font-bold' : 'font-medium'}>
                            {isMe ? `${student.name} (You)` : student.name}
                          </span>
                          <div className="text-xs text-muted-foreground">Level {student.level}</div>
                        </div>
                      </div>
                      <div className="font-bold font-mono text-primary">
                        {student.totalXP.toLocaleString()} XP
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
