'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  Crown,
  Flame,
  Shield,
  Swords,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/panels/Panel';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { gamificationService } from '@/services/gamificationService';
import { cn } from '@/lib/utils';
import { GlowCard } from '@/components/ui/spotlight-card';
import { ArenaPortalTrigger } from '@/components/ui/arena-portal-trigger';

interface XPProfile {
  totalXp: number;
  level: number;
  streakDays: number;
  xpForNextLevel: number;
  xpProgress: number;
  progressPercent: number;
}

interface WeeklyDay {
  day: string;
  completed: boolean;
}

interface StreakResponse {
  currentStreak: number;
  weeklyCompletion: WeeklyDay[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  weeklyXp: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  leaders: LeaderboardEntry[];
  podium: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}

interface BadgeItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

const badgeIconMap = {
  Star,
  Flame,
  Target,
  Swords,
  Zap,
  Award,
  Shield,
  Crown,
} as const;

function getInitials(name: string | undefined) {
  if (!name) return 'IC';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatXp(value: number) {
  return value.toLocaleString();
}

function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/50 backdrop-blur-sm dark:bg-slate-800/60', className)} />;
}

function PodiumCard({
  entry,
  place,
}: {
  entry: LeaderboardEntry | undefined;
  place: 1 | 2 | 3;
}) {
  const themes = {
    1: {
      ring: 'ring-2 ring-amber-400/80 shadow-lg',
      badge: 'bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 shadow-md dark:from-amber-500/20 dark:to-yellow-500/20 dark:text-amber-300',
      pedestal: 'h-28 bg-gradient-to-br from-amber-200 to-yellow-200 border-amber-400/70 shadow-md dark:from-amber-500/20 dark:to-yellow-500/20 dark:border-amber-500/30',
      label: '1st Place',
    },
    2: {
      ring: 'ring-2 ring-slate-400/70 shadow-lg',
      badge: 'bg-gradient-to-r from-slate-200 to-gray-200 text-slate-800 shadow-md dark:from-slate-700/50 dark:to-gray-700/50 dark:text-slate-200',
      pedestal: 'h-24 bg-gradient-to-br from-slate-200 to-gray-200 border-slate-400/70 shadow-md dark:from-slate-700/40 dark:to-gray-700/40 dark:border-slate-600/50',
      label: '2nd Place',
    },
    3: {
      ring: 'ring-2 ring-orange-400/70 shadow-lg',
      badge: 'bg-gradient-to-r from-orange-200 to-amber-200 text-orange-800 shadow-md dark:from-orange-500/20 dark:to-amber-500/20 dark:text-orange-300',
      pedestal: 'h-20 bg-gradient-to-br from-orange-200 to-amber-200 border-orange-400/70 shadow-md dark:from-orange-500/20 dark:to-amber-500/20 dark:border-orange-500/30',
      label: '3rd Place',
    },
  }[place];

  if (!entry) {
    return (
      <div className="flex flex-1 flex-col items-center justify-end gap-3">
        <LoadingBlock className="h-16 w-16 rounded-full" />
        <LoadingBlock className="h-4 w-20" />
        <LoadingBlock className={cn('w-full rounded-2xl border', themes.pedestal)} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-3 transition-all duration-300 ease-out hover:scale-105">
      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', themes.badge)}>
        {themes.label}
      </span>
      <Avatar className={cn('h-16 w-16 shadow-sm', themes.ring)}>
        {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={entry.name} /> : null}
        <AvatarFallback className="bg-gradient-to-br from-emerald-200 to-teal-200 text-emerald-800 dark:from-emerald-600/30 dark:to-teal-600/30 dark:text-emerald-200">
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">{entry.name}</p>
        <p className="text-xs text-slate-700 dark:text-slate-300">Level {entry.level}</p>
        <p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">{formatXp(entry.weeklyXp)} XP</p>
      </div>
      <div className={cn('flex w-full items-end justify-center rounded-2xl border px-4 pb-4 pt-3 transition-all duration-300 group-hover:scale-105', themes.pedestal)}>
        <span className="text-2xl font-black text-slate-900 dark:text-gray-100">#{place}</span>
      </div>
    </div>
  );
}

export default function GamificationPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [xpProfile, setXpProfile] = useState<XPProfile | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGamificationDashboard() {
      setLoading(true);
      const [xpRes, streakRes, leaderboardRes, badgesRes] = await Promise.allSettled([
        gamificationService.getXPProfile(),
        gamificationService.getStreak(),
        gamificationService.getLeaderboard(8),
        gamificationService.getBadges(),
      ]);

      if (cancelled) return;

      if (xpRes.status === 'fulfilled') {
        setXpProfile(xpRes.value?.data ?? xpRes.value);
      }

      if (streakRes.status === 'fulfilled') {
        setStreak(streakRes.value?.data ?? streakRes.value);
      }

      if (leaderboardRes.status === 'fulfilled') {
        setLeaderboard(leaderboardRes.value?.data ?? leaderboardRes.value);
      }

      if (badgesRes.status === 'fulfilled') {
        setBadges(badgesRes.value?.data ?? badgesRes.value ?? []);
      }

      setLoading(false);
    }

    loadGamificationDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = useMemo(() => {
    const totalXp = xpProfile?.totalXp ?? 0;
    const level = xpProfile?.level ?? 1;
    const xpForNextLevel = xpProfile?.xpForNextLevel ?? 100;
    const xpProgress = xpProfile?.xpProgress ?? 0;
    const progressPercent = xpProfile?.progressPercent ?? 0;

    return {
      totalXp,
      level,
      xpForNextLevel,
      xpProgress,
      progressPercent,
      streakDays: streak?.currentStreak ?? xpProfile?.streakDays ?? 0,
    };
  }, [streak, xpProfile]);

  const podiumOrder = [2, 1, 3] as const;

  return (
    <DashboardLayout requiredRole="student">
      <div className="min-h-screen space-y-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.8fr)]">
          <GlowCard glowColor="green" customSize={true} className="!aspect-auto group rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-[#A8D5A2] via-emerald-100 to-teal-100 p-6 shadow-lg transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 dark:border-emerald-700/30 dark:from-emerald-900/40 dark:via-slate-800 dark:to-teal-900/40">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-white/60 shadow-lg dark:ring-emerald-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-200 to-teal-200 text-2xl font-bold text-emerald-800 dark:from-emerald-600/30 dark:to-teal-600/30 dark:text-emerald-200">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                    Player Profile
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-gray-100">
                    {user?.name ?? 'Student'}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-lg dark:bg-emerald-500/20 dark:text-emerald-300">
                      Level {profile.level}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F0C4AA] to-orange-200 px-3 py-1 text-sm font-semibold text-orange-900 shadow-md transition-all duration-300 hover:scale-105 hover:from-orange-200 hover:to-amber-200 hover:shadow-lg dark:from-orange-500/20 dark:to-amber-500/20 dark:text-orange-300">
                      <Flame className="h-4 w-4" />
                      {profile.streakDays} day streak
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-3 lg:items-end">
                <ArenaPortalTrigger
                  targetHref="/student/gamification/arena"
                  label="Enter Game Arena"
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-semibold text-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-2xl hover:shadow-emerald-500/50 active:scale-95 dark:from-emerald-600 dark:to-teal-600 dark:hover:from-emerald-500 dark:hover:to-teal-500 hover:!bg-gradient-to-r hover:!text-white"
                />
                <p className="text-right text-sm text-slate-800 dark:text-slate-300">
                  Jump into challenges, boss battles, and weekly progression.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/40 bg-white/60 p-5 shadow-md backdrop-blur-sm transition-all duration-300 ease-out group-hover:bg-white/70 group-hover:shadow-lg dark:border-emerald-800/30 dark:bg-slate-800/50 dark:group-hover:bg-slate-800/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-200">Current XP</p>
                  <p className="mt-1 text-3xl font-black text-slate-900 transition-all duration-300 group-hover:scale-105 dark:text-gray-100">
                    {loading && !xpProfile ? '...' : `${formatXp(profile.totalXp)} XP`}
                  </p>
                </div>
                <div className="text-sm text-slate-700 transition-colors group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-200">
                  {formatXp(profile.xpProgress)} / {formatXp(profile.xpForNextLevel)} toward next level
                </div>
              </div>
              <Progress value={profile.progressPercent} className="mt-4 h-3 transition-all duration-700 ease-out [&>*]:bg-gradient-to-r [&>*]:from-emerald-500 [&>*]:to-teal-500 [&>*]:transition-all [&>*]:duration-700" />
            </div>
          </GlowCard>

          <GlowCard glowColor="orange" customSize={true} className="!aspect-auto">
          <Panel
            title="Weekly Streak"
            description="Stay active across the week to keep your streak alive."
            className="group rounded-3xl border-orange-400/50 bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/30 dark:border-orange-600/40 dark:from-orange-800/50 dark:via-amber-800/40 dark:to-yellow-800/50"
            action={<Flame className={cn("h-5 w-5 text-orange-700 dark:text-orange-400", profile.streakDays > 0 && "animate-pulse")} />}
          >
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-black text-orange-900 transition-all duration-300 group-hover:scale-110 dark:text-orange-100">{profile.streakDays}</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">current streak days</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-orange-300 to-amber-300 px-4 py-3 text-right shadow-md transition-all duration-300 ease-out group-hover:shadow-lg dark:from-orange-500/30 dark:to-amber-500/25">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-900 dark:text-orange-300">
                  Momentum
                </p>
                <p className="mt-1 text-sm font-medium text-orange-900 dark:text-orange-200">
                  Keep earning XP daily
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {(streak?.weeklyCompletion ?? [
                { day: 'Mon', completed: false },
                { day: 'Tue', completed: false },
                { day: 'Wed', completed: false },
                { day: 'Thu', completed: false },
                { day: 'Fri', completed: false },
                { day: 'Sat', completed: false },
                { day: 'Sun', completed: false },
              ]).map((entry) => (
                <div
                  key={entry.day}
                  className={cn(
                    'rounded-2xl border px-2 py-3 text-center shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-110 hover:shadow-md',
                    entry.completed
                      ? 'border-orange-500/60 bg-gradient-to-br from-orange-300 to-amber-300 text-orange-900 dark:border-orange-500/40 dark:from-orange-500/30 dark:to-amber-500/30 dark:text-orange-200'
                      : 'border-slate-400/60 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400'
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{entry.day}</p>
                </div>
              ))}
            </div>
          </Panel>
          </GlowCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <GlowCard glowColor="blue" customSize={true} className="!aspect-auto">
          <Panel
            title="Weekly Leaderboard"
            description="Ranked by XP earned this week."
            className="group rounded-3xl border-cyan-400/50 bg-gradient-to-br from-cyan-200 via-sky-200 to-blue-200 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/30 dark:border-cyan-600/40 dark:from-cyan-800/50 dark:via-sky-800/40 dark:to-blue-800/50"
            action={<Crown className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />}
          >
            <div className="space-y-3">
              {(leaderboard?.leaders ?? []).length === 0 && loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <LoadingBlock key={index} className="h-16 w-full rounded-2xl" />
                ))
              ) : (
                (leaderboard?.leaders ?? []).map((entry, index) => {
                  const medalStyle =
                    index === 0
                      ? 'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-300'
                      : index === 1
                      ? 'bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700 dark:from-slate-700/40 dark:to-gray-700/40 dark:text-slate-200'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 dark:from-orange-500/15 dark:to-amber-500/15 dark:text-orange-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

                  return (
                    <div
                      key={`${entry.userId}-${entry.rank}`}
                      className={cn(
                        'flex items-center gap-4 rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:shadow-md',
                        entry.isCurrentUser
                          ? 'border-emerald-400/60 bg-gradient-to-r from-emerald-100 to-teal-100 dark:border-emerald-500/40 dark:from-emerald-500/15 dark:to-teal-500/15'
                          : 'border-slate-300/60 bg-white/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50'
                      )}
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-black', medalStyle)}>
                        {entry.rank}
                      </div>

                      <Avatar className="h-11 w-11">
                        {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={entry.name} /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 font-semibold text-emerald-700 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-200">
                          {getInitials(entry.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate font-semibold', entry.isCurrentUser ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-gray-100')}>
                          {entry.name}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Level {entry.level}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-gray-100">{formatXp(entry.weeklyXp)} XP</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">weekly</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
          </GlowCard>

          <GlowCard glowColor="red" customSize={true} className="!aspect-auto">
          <Panel
            title="Top 3 Podium"
            description="This week’s front-runners."
            className="group rounded-3xl border-pink-400/50 bg-gradient-to-br from-pink-200 via-rose-200 to-fuchsia-200 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/30 dark:border-pink-600/40 dark:from-pink-800/50 dark:via-rose-800/40 dark:to-fuchsia-800/50"
            action={<Trophy className="h-5 w-5 text-pink-700 dark:text-pink-400" />}
          >
            <div className="flex min-h-[320px] items-end gap-4 transition-all duration-300">
              {podiumOrder.map((place) => (
                <PodiumCard
                  key={place}
                  place={place}
                  entry={leaderboard?.podium.find((item) => item.rank === place)}
                />
              ))}
            </div>
          </Panel>
          </GlowCard>
        </div>

        <GlowCard glowColor="purple" customSize={true} className="!aspect-auto">
        <Panel
          title="Badge Gallery"
          description="Unlock achievements through streaks, quizzes, boss wins, and XP milestones."
          className="group rounded-3xl border-purple-400/50 bg-gradient-to-br from-purple-200 via-violet-200 to-indigo-200 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/30 dark:border-purple-600/40 dark:from-purple-800/50 dark:via-violet-800/40 dark:to-indigo-800/50"
          action={<Award className="h-5 w-5 text-purple-700 dark:text-purple-400" />}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {loading && badges.length === 0
              ? Array.from({ length: 5 }).map((_, index) => <LoadingBlock key={index} className="h-40 rounded-3xl" />)
              : badges.map((badge) => {
                  const Icon = badgeIconMap[badge.icon as keyof typeof badgeIconMap] ?? Award;
                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        'rounded-3xl border p-5 shadow-md transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 hover:shadow-xl',
                        badge.unlocked
                          ? 'border-emerald-300/60 bg-gradient-to-br from-emerald-100 to-teal-100 hover:shadow-emerald-500/30 dark:border-emerald-500/30 dark:from-emerald-500/15 dark:to-teal-500/15'
                          : 'border-slate-300/60 bg-white/60 opacity-70 backdrop-blur-sm hover:opacity-85 dark:border-slate-700 dark:bg-slate-800/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn(
                          'rounded-2xl p-3 shadow-sm',
                          badge.unlocked
                            ? 'bg-white/80 text-emerald-700 backdrop-blur-sm dark:bg-slate-900/80 dark:text-emerald-300'
                            : 'bg-slate-200/60 text-slate-400 dark:bg-slate-900/60 dark:text-slate-500'
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm',
                          badge.unlocked
                            ? 'bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-300'
                            : 'bg-slate-300/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {badge.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-gray-100">{badge.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{badge.description}</p>
                    </div>
                  );
                })}
          </div>
        </Panel>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
}