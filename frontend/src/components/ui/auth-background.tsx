'use client';

import { useEffect, useRef } from 'react';

// ── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];

    const make = (): P => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.3 + 0.06,
      o: Math.random() * 0.3 + 0.12,
    });

    const init = () => { ps = Array.from({ length: Math.floor((canvas.width * canvas.height) / 10000) }, make); };

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach(p => {
        p.y -= p.v;
        if (p.y < 0) Object.assign(p, make(), { y: canvas.height + 20 });
        ctx.fillStyle = `rgba(0,95,160,${p.o})`;  // darker blue, visible on light bg
        ctx.fillRect(p.x, p.y, 0.8, 2.4);
      });
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', () => { resize(); init(); });
    init();
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full opacity-25 mix-blend-multiply pointer-events-none"
    />
  );
}

// ── Animated Accent Lines ─────────────────────────────────────────────────────
const lineStyles = `
  .ic-hline,.ic-vline{position:absolute;background:#B8CDE0;will-change:transform,opacity}
  .ic-hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:icDrawX .9s cubic-bezier(.22,.61,.36,1) forwards}
  .ic-vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:icDrawY 1s cubic-bezier(.22,.61,.36,1) forwards}
  .ic-hline:nth-child(1){top:20%;animation-delay:.1s}
  .ic-hline:nth-child(2){top:50%;animation-delay:.22s}
  .ic-hline:nth-child(3){top:80%;animation-delay:.34s}
  .ic-vline:nth-child(4){left:24%;animation-delay:.46s}
  .ic-vline:nth-child(5){left:50%;animation-delay:.58s}
  .ic-vline:nth-child(6){left:76%;animation-delay:.7s}
  @keyframes icDrawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.8}100%{transform:scaleX(1);opacity:.5}}
  @keyframes icDrawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.8}100%{transform:scaleY(1);opacity:.5}}
`;

// ── Exported Component ────────────────────────────────────────────────────────
export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#EEF2F8' }}>
      <style>{lineStyles}</style>

      {/* Radial top glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,110,178,0.09), transparent 65%)' }}
      />

      {/* Bottom glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(0,110,178,0.06), transparent 65%)' }}
      />

      {/* Accent lines */}
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="ic-hline" />
        <div className="ic-hline" />
        <div className="ic-hline" />
        <div className="ic-vline" />
        <div className="ic-vline" />
        <div className="ic-vline" />
      </div>

      {/* Particles */}
      <ParticleCanvas />
    </div>
  );
}
