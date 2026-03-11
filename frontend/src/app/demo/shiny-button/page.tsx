'use client';

import { ShinyButton } from "@/components/ui/shiny-button";

export default function ShinyButtonDemo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Shiny Button Demo</h1>
      
      <ShinyButton onClick={() => alert("Button clicked!")}>
        Get unlimited access
      </ShinyButton>

      <ShinyButton onClick={() => alert("Clicked!")}>
        Start your journey
      </ShinyButton>

      <ShinyButton onClick={() => alert("Let's go!")}>
        Join now
      </ShinyButton>

      <div className="text-white/60 text-sm mt-8 text-center max-w-2xl">
        <p>This button features an animated conic gradient border with shimmer effects.</p>
        <p className="mt-2">Hover to activate the full animation with dots pattern and inner glow.</p>
      </div>
    </div>
  );
}
