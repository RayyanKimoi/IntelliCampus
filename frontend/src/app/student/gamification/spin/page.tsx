'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Gift, Star, Loader2, Zap, Flame, Shield } from 'lucide-react';
import { gamificationService } from '@/services/gamificationService';

const SEGMENTS = [
  { label: '+50 XP', color: 'bg-yellow-500', icon: Zap },
  { label: '+100 XP', color: 'bg-green-500', icon: Star },
  { label: 'Streak Freeze', color: 'bg-blue-500', icon: Shield },
  { label: '+200 XP', color: 'bg-purple-500', icon: Star },
  { label: '2x XP Boost', color: 'bg-orange-500', icon: Flame },
  { label: '+25 XP', color: 'bg-red-500', icon: Zap },
];

export default function SpinWheelPage() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState('');

  const spin = async () => {
    setSpinning(true);
    setReward(null);
    setError('');

    // Spin animation
    const extraSpins = 5 * 360; // 5 full rotations
    const randomDeg = Math.floor(Math.random() * 360);
    setRotation(prev => prev + extraSpins + randomDeg);

    try {
      const res = await gamificationService.spinWheel();
      const d = (res as any)?.data || res;
      setTimeout(() => {
        setReward(d);
        setSpinning(false);
      }, 3000);
    } catch (err: any) {
      setTimeout(() => {
        setError(err.message || 'You have no spins left today. Come back tomorrow!');
        setSpinning(false);
      }, 3000);
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-3xl font-bold tracking-tight">Daily Spin</h1>
          <p className="text-muted-foreground max-w-lg">
            Spin the wheel to win XP boosts, streak freezes, and exclusive rewards!
          </p>
        </div>

        <Card className="max-w-md mx-auto border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Daily Reward
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </CardTitle>
            <CardDescription>3 spins per day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            {/* Wheel */}
            <div className="relative h-64 w-64 mx-auto">
              <div
                className="h-full w-full rounded-full border-8 border-muted overflow-hidden shadow-inner transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: spinning ? '3s' : '0s',
                }}
              >
                {SEGMENTS.map((seg, i) => {
                  const angle = (360 / SEGMENTS.length) * i;
                  return (
                    <div
                      key={i}
                      className={`absolute inset-0 ${seg.color} opacity-80`}
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 30) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 30) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 30) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + 30) * Math.PI / 180)}%)`,
                      }}
                    />
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 border-2 border-primary z-10" />
                </div>
              </div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-primary" />
              </div>
            </div>

            {/* Reward display */}
            {reward && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 animate-fade-in">
                <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-bold text-lg">
                  {reward.rewardType === 'xp_boost' ? `+${reward.value} XP!` :
                   reward.rewardType === 'streak_freeze' ? 'Streak Freeze!' :
                   reward.rewardType === 'xp_multiplier' ? `${reward.value}x XP Boost!` :
                   `Reward: ${reward.rewardType}`}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              size="lg"
              className="w-full font-bold text-lg h-12"
              onClick={spin}
              disabled={spinning}
            >
              {spinning ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Spinning...</>
              ) : (
                <><Target className="h-5 w-5 mr-2" /> Spin the Wheel!</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
