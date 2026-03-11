'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StageData {
  stageId: number;
  completedGames: number;
  progress: number;
  dropletsRemaining: number;
}

interface ProgressResponse {
  stages: StageData[];
  xp: number;
  level: number;
  streakDays: number;
}

interface StageConfig {
  id: number;
  name: string;
  stageKey: string;
  flowerImage: string;
}

interface MiniGame {
  id: string;
  name: string;
  icon: string;
  xp: string;
  route: string;
  gameType: string;
}

const stages: StageConfig[] = [
  { id: 1, name: 'Data Structures', stageKey: 'data_structures', flowerImage: '/gamification/arena/nodes/flower-ds.png' },
  { id: 2, name: 'Analysis of Algorithms', stageKey: 'analysis_of_algorithms', flowerImage: '/gamification/arena/nodes/flower-algo.png' },
  { id: 3, name: 'Computer Networks', stageKey: 'computer_networks', flowerImage: '/gamification/arena/nodes/flower-cn.png' },
  { id: 4, name: 'Operating Systems', stageKey: 'operating_systems', flowerImage: '/gamification/arena/nodes/flower-os.png' },
];

const miniGames: MiniGame[] = [
  { id: 'sprint', name: 'Sprint Quiz', icon: '⚡', xp: '100 XP', route: '/student/gamification/sprint', gameType: 'sprint' },
  { id: 'spin', name: 'Spin the Wheel', icon: '🎡', xp: '100 XP', route: '/student/gamification/spin', gameType: 'spin' },
  { id: 'flashcards', name: 'Flashcards', icon: '🃏', xp: '200 XP', route: '/student/gamification/flashcards', gameType: 'flashcards' },
  { id: 'boss', name: 'Boss Battle', icon: '⚔️', xp: '300 XP', route: '/student/gamification/boss-battle', gameType: 'boss' },
];

export default function GameArenaPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [stageDataMap, setStageDataMap] = useState<Record<number, StageData>>({});
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeStageId, setActiveStageId] = useState(1);

  const fetchProgress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/gamification/progress?userId=${user.id}`);
      if (!res.ok) throw new Error('API error');
      const data: ProgressResponse = await res.json();
      const map: Record<number, StageData> = {};
      for (const s of data.stages) {
        map[s.stageId] = s;
      }
      setStageDataMap(map);
      setXp(data.xp);
      setLevel(data.level);
    } catch {
      // Initialize empty data
      const map: Record<number, StageData> = {};
      for (let i = 1; i <= 4; i++) {
        map[i] = { stageId: i, completedGames: 0, progress: 0, dropletsRemaining: 4 };
      }
      setStageDataMap(map);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Refetch when page becomes visible (user returns from game)
  useEffect(() => {
    const handleFocus = () => { fetchProgress(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProgress]);

  const maxXPForLevel = 1000;
  const xpProgress = (xp % maxXPForLevel) / maxXPForLevel * 100;

  const getInitials = (name: string | undefined) => {
    if (!name) return 'ST';
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  };

  const getStage = (id: number): StageData =>
    stageDataMap[id] ?? { stageId: id, completedGames: 0, progress: 0, dropletsRemaining: 4 };

  // Game index 0=sprint, 1=spin, 2=flashcards, 3=boss
  // A game is unlocked when completedGames >= gameIndex
  const isGameUnlocked = (gameIndex: number, stageId: number) => {
    const stage = getStage(stageId);
    return stage.completedGames >= gameIndex;
  };

  // Check if game is already completed for a stage
  const isGameCompleted = (gameIndex: number, stageId: number) => {
    const stage = getStage(stageId);
    return stage.completedGames > gameIndex;
  };

  const handleGameClick = (game: MiniGame, gameIndex: number) => {
    if (!isGameUnlocked(gameIndex, activeStageId)) return;
    if (isGameCompleted(gameIndex, activeStageId)) return;
    router.push(`${game.route}?stageId=${activeStageId}`);
  };

  return (
    <DashboardLayout requiredRole="student">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-400 mx-auto mb-4"></div>
            <p className="text-white text-lg font-semibold">Loading Arena...</p>
          </div>
        </div>
      ) : (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: 'url(/gamification/arena/background/grass-bg.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-gradient-to-b from-emerald-900/95 via-emerald-800/90 to-transparent backdrop-blur-sm border-b border-emerald-700/30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-12 w-12 ring-4 ring-emerald-400/50 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-emerald-200 to-teal-200 text-lg font-bold text-emerald-800">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-bold text-sm">{user?.name}</p>
                <p className="text-emerald-200 text-xs">
                  Level {level} • {xp} Total XP
                </p>
              </div>
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                    Level {level} Progress
                  </span>
                  <span className="text-sm font-bold text-white">
                    {xp % maxXPForLevel} / {maxXPForLevel} XP
                  </span>
                </div>
                <Progress
                  value={xpProgress}
                  className="h-3 bg-emerald-950/50 [&>*]:bg-gradient-to-r [&>*]:from-amber-400 [&>*]:to-yellow-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
          {/* Progression Map */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="relative flex flex-col items-center gap-0">
                {stages.map((stage, index) => {
                  const stageData = getStage(stage.id);
                  const isComplete = stageData.completedGames >= 4;
                  const progress = stageData.progress;
                  const droplets = stageData.dropletsRemaining;
                  const completedGames = stageData.completedGames;
                  const isActive = activeStageId === stage.id;

                  return (
                    <div key={stage.id} className="w-full flex flex-col items-center">
                      {/* Stage Node */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        className={cn("w-64 mx-auto cursor-pointer", isActive && "ring-4 ring-amber-400/50 rounded-2xl p-2")}
                        onClick={() => setActiveStageId(stage.id)}
                      >
                        {/* Stage Info */}
                        <div className={cn(
                          "mb-4 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg border text-center",
                          isActive ? "bg-amber-700/80 border-amber-500/50" : "bg-slate-800/80 border-slate-700/50"
                        )}>
                          <p className={cn(
                            "text-xs font-bold uppercase tracking-wider truncate",
                            isActive ? "text-amber-200" : "text-emerald-300"
                          )}>
                            {stage.name}
                          </p>
                        </div>

                        {/* Droplets */}
                        <div className="flex gap-1 mb-3 justify-center h-8">
                          {droplets > 0 ? (
                            Array.from({ length: droplets }).map((_, i) => (
                              <motion.span
                                key={i}
                                className="text-2xl"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                              >
                                💧
                              </motion.span>
                            ))
                          ) : (
                            <span className="text-xs text-emerald-300 font-bold">All droplets collected!</span>
                          )}
                        </div>

                        {/* Node Circle */}
                        <div className="relative w-32 h-32 mx-auto">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-8xl font-black text-slate-800/20 select-none">{stage.id}</span>
                          </div>
                          <motion.div className="relative z-10" whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                            <img
                              src={isComplete ? stage.flowerImage : '/gamification/arena/nodes/rock.png'}
                              alt={isComplete ? stage.name : 'Rock'}
                              className="w-32 h-32 object-contain drop-shadow-2xl"
                            />
                          </motion.div>

                          {/* Progress Ring */}
                          {!isComplete && progress > 0 && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="3" />
                              <motion.circle
                                cx="50" cy="50" r="45" fill="none"
                                stroke="rgba(52, 211, 153, 0.9)" strokeWidth="3"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </svg>
                          )}

                          {isComplete && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 z-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-2 shadow-xl border-2 border-white"
                            >
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        {/* Progress Text */}
                        <div className="mt-3 text-center">
                          <p className="text-sm font-bold text-white drop-shadow-lg">{completedGames} / 4 Games</p>
                          <p className="text-xs text-emerald-300">{Math.round(progress)}% Complete</p>
                        </div>
                      </motion.div>

                      {/* Vertical Path Segment */}
                      {index < stages.length - 1 && (
                        <div className="relative flex justify-center my-8 w-full">
                          <div className="relative w-20 h-40 rounded-[10px] bg-[#e5caa3] shadow-lg overflow-hidden">
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 bg-[#5ce65c] rounded-[10px]"
                              initial={{ height: 0 }}
                              animate={{ height: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mini Games Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:w-80 w-full"
          >
            <div
              className="sticky top-24 rounded-3xl p-6 shadow-2xl border-4 border-amber-700/50"
              style={{
                backgroundImage: 'url(/gamification/arena/background/gamepanelbg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <h2 className="text-2xl font-black text-white text-center mb-2 drop-shadow-lg uppercase tracking-wider">
                Mini Games
              </h2>
              <p className="text-xs text-amber-200 text-center mb-6">
                Stage: {stages.find(s => s.id === activeStageId)?.name}
              </p>

              <div className="space-y-4">
                {miniGames.map((game, index) => {
                  const unlocked = isGameUnlocked(index, activeStageId);
                  const completed = isGameCompleted(index, activeStageId);
                  return (
                    <motion.button
                      key={game.id}
                      onClick={() => handleGameClick(game, index)}
                      whileHover={unlocked && !completed ? { scale: 1.05, y: -2 } : {}}
                      whileTap={unlocked && !completed ? { scale: 0.95 } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={cn(
                        "w-full rounded-2xl p-4 flex items-center gap-4 shadow-xl border-2 transition-all duration-300 group relative",
                        completed && "bg-gradient-to-br from-emerald-700 to-emerald-800 border-emerald-500 cursor-default",
                        unlocked && !completed && "bg-gradient-to-br from-slate-800 to-slate-900 hover:from-emerald-700 hover:to-emerald-800 border-slate-700 hover:border-emerald-500 cursor-pointer",
                        !unlocked && "bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500 opacity-60 cursor-not-allowed grayscale"
                      )}
                      disabled={!unlocked || completed}
                    >
                      <div className={cn(
                        "bg-white/10 rounded-xl p-3 transition-colors text-3xl",
                        !unlocked && "grayscale"
                      )}>
                        {game.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className={cn(
                          "font-bold text-sm transition-colors",
                          completed ? "text-emerald-100" : unlocked ? "text-white group-hover:text-emerald-100" : "text-slate-300"
                        )}>
                          {game.name}
                        </h3>
                        <p className="text-xs text-amber-400 font-semibold">{game.xp}</p>
                      </div>
                      {completed ? (
                        <div className="text-2xl">✅</div>
                      ) : !unlocked ? (
                        <div className="text-3xl">🔒</div>
                      ) : (
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs text-slate-300 text-center leading-relaxed">
                  💡 <span className="font-semibold text-emerald-400">Complete all 4 games</span> in a stage to turn rock into flower!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}