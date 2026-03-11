'use client';

import { GlowCard } from "@/components/ui/spotlight-card";
import { Trophy, Zap, Star, Award, Target } from "lucide-react";

export default function SpotlightDemo() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center gap-10 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Spotlight Card Demo</h1>
      
      {/* Default size cards with different colors */}
      <div className="flex flex-wrap items-center justify-center gap-10">
        <GlowCard glowColor="blue" size="md">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Trophy className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Blue Glow</h2>
            <p className="text-sm opacity-70 text-center mt-2">Hover to see the spotlight effect</p>
          </div>
        </GlowCard>

        <GlowCard glowColor="purple" size="md">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Star className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Purple Glow</h2>
            <p className="text-sm opacity-70 text-center mt-2">Move your cursor around</p>
          </div>
        </GlowCard>

        <GlowCard glowColor="green" size="md">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Zap className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Green Glow</h2>
            <p className="text-sm opacity-70 text-center mt-2">Dynamic spotlight tracking</p>
          </div>
        </GlowCard>
      </div>

      {/* Different sizes */}
      <div className="flex flex-wrap items-end justify-center gap-10 mt-8">
        <GlowCard glowColor="orange" size="sm">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Award className="w-12 h-12 mb-2" />
            <h3 className="text-lg font-bold">Small</h3>
          </div>
        </GlowCard>

        <GlowCard glowColor="red" size="md">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Target className="w-14 h-14 mb-3" />
            <h3 className="text-xl font-bold">Medium</h3>
          </div>
        </GlowCard>

        <GlowCard glowColor="purple" size="lg">
          <div className="flex flex-col items-center justify-center h-full text-white">
            <Trophy className="w-20 h-20 mb-4" />
            <h3 className="text-2xl font-bold">Large</h3>
          </div>
        </GlowCard>
      </div>

      {/* Custom size example */}
      <div className="mt-8">
        <GlowCard 
          glowColor="blue" 
          customSize={true}
          width="600px"
          height="200px"
          className="!aspect-auto"
        >
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Custom Size Card</h2>
              <p className="text-lg opacity-70">600px × 200px with blue glow</p>
            </div>
          </div>
        </GlowCard>
      </div>

      <div className="text-white/60 text-sm mt-8 text-center max-w-2xl">
        <p>This component uses CSS variables and pointer tracking to create a dynamic spotlight effect that follows your cursor.</p>
        <p className="mt-2">Perfect for highlighting important cards, features, or interactive elements.</p>
      </div>
    </div>
  );
}
