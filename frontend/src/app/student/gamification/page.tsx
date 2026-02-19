'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gamificationService } from '@/services/gamificationService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ── Types ────────────────────────────────────────────────────────
interface WeekProgress {
  week: string;       // ISO week key e.g. "2026-W08"
  completed: string[]; // mini-game keys completed this week
}

const MINI_GAMES = [
  {
    key: 'sprint',
    label: 'Sprint Quiz',
    href: '/student/gamification/sprint',
    emoji: '🏆',
    color: '#e67e22',
    bgColor: '#fdebd0',
    borderColor: '#e67e22',
    xp: 100,
    timer: '2 min',
    desc: 'Race the clock. Answer as many as you can!',
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    href: '/student/gamification/flashcards',
    emoji: '🃏',
    color: '#2980b9',
    bgColor: '#d6eaf8',
    borderColor: '#2980b9',
    xp: 80,
    timer: '3 min',
    desc: 'Flip & match pairs to master terms.',
  },
  {
    key: 'spin',
    label: 'Spin the Wheel',
    href: '/student/gamification/spin',
    emoji: '🎯',
    color: '#27ae60',
    bgColor: '#d5f5e3',
    borderColor: '#27ae60',
    xp: 120,
    timer: '5 min',
    desc: 'Spin & answer on the random topic!',
  },
  {
    key: 'boss-battle',
    label: 'Boss Battle',
    href: '/student/gamification/boss-battle',
    emoji: '⚔️',
    color: '#8e44ad',
    bgColor: '#e8daef',
    borderColor: '#8e44ad',
    xp: 200,
    timer: 'Unlimited',
    desc: 'Defeat the boss with correct answers.',
  },
];

function getISOWeek(): string {
  const d = new Date();
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Plant Stage Visual ───────────────────────────────────────────
function PlantStage({ completed }: { completed: number }) {
  const stages = [
    // 0 – seed / bare ground
    <div key={0} className="plant-stage plant-0">
      <div className="soil" />
      <div className="stem" style={{ height: 8 }} />
    </div>,
    // 1 – tiny sprout
    <div key={1} className="plant-stage plant-1">
      <div className="soil" />
      <div className="stem" style={{ height: 20 }}>
        <div className="leaf leaf-left" style={{ top: 4 }} />
      </div>
    </div>,
    // 2 – small plant
    <div key={2} className="plant-stage plant-2">
      <div className="soil" />
      <div className="stem" style={{ height: 36 }}>
        <div className="leaf leaf-left" style={{ top: 8 }} />
        <div className="leaf leaf-right" style={{ top: 18 }} />
      </div>
    </div>,
    // 3 – budding
    <div key={3} className="plant-stage plant-3">
      <div className="soil" />
      <div className="stem" style={{ height: 52 }}>
        <div className="leaf leaf-left" style={{ top: 12 }} />
        <div className="leaf leaf-right" style={{ top: 26 }} />
        <div className="bud" />
      </div>
    </div>,
    // 4 – full bloom 🌸
    <div key={4} className="plant-stage plant-4">
      <div className="soil" />
      <div className="stem" style={{ height: 64 }}>
        <div className="leaf leaf-left" style={{ top: 16 }} />
        <div className="leaf leaf-right" style={{ top: 32 }} />
        <div className="flower">
          <div className="petal p0" /><div className="petal p1" /><div className="petal p2" />
          <div className="petal p3" /><div className="petal p4" /><div className="petal p5" />
          <div className="center" />
        </div>
      </div>
    </div>,
  ];
  return stages[Math.min(completed, 4)];
}

// ── Node Component ───────────────────────────────────────────────
function PathNode({
  number,
  game,
  completed,
  isNext,
}: {
  number: number;
  game: typeof MINI_GAMES[0];
  completed: boolean;
  isNext: boolean;
}) {
  const router = useRouter();
  return (
    <div className="path-node-wrapper">
      {/* Water droplets earned */}
      <div className="droplets">
        {completed
          ? [0, 1, 2].map(i => <span key={i} className="drop drop-filled">💧</span>)
          : [0, 1, 2].map(i => <span key={i} className="drop drop-empty">🩵</span>)}
      </div>

      {/* Node circle */}
      <div
        className={`path-node ${completed ? 'node-done' : isNext ? 'node-next' : 'node-locked'}`}
        onClick={() => router.push(game.href)}
        style={completed ? { background: '#27ae60', borderColor: '#1e8449' } : isNext ? { background: game.color, borderColor: game.borderColor } : undefined}
      >
        <span className="node-number">{number}</span>
        {completed && <span className="node-check">✓</span>}
      </div>

      {/* Label */}
      <div className="node-label">{game.label}</div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function GamificationPage() {
  const [xpProfile, setXpProfile] = useState<any>(null);
  const [weekProgress, setWeekProgress] = useState<string[]>([]);
  const currentWeek = getISOWeek();

  useEffect(() => {
    // Load XP profile
    gamificationService.getXPProfile().then((res: any) => {
      setXpProfile(res?.data || res);
    }).catch(() => {});

    // Load weekly progress from localStorage
    const raw = localStorage.getItem('ic-week-progress');
    if (raw) {
      try {
        const parsed: WeekProgress = JSON.parse(raw);
        if (parsed.week === currentWeek) {
          setWeekProgress(parsed.completed || []);
        }
      } catch {}
    }
  }, []);

  const completedCount = weekProgress.length;
  const xp = xpProfile?.totalXP ?? xpProfile?.xp ?? 0;
  const xpToNext = xpProfile?.xpToNextLevel ?? 700;
  const level = xpProfile?.level ?? 1;
  const xpPct = Math.min(100, Math.round((xp % xpToNext) / xpToNext * 100));

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        /* ── Background ── */
        .gami-bg {
          min-height: calc(100vh - 64px);
          background: #4a7c34;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(80,140,50,0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(40,100,20,0.4) 0%, transparent 50%);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── XP Bar ── */
        .xp-bar-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0,0,0,0.35);
          border-radius: 999px;
          padding: 8px 20px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          max-width: 340px;
          margin: 0 auto;
        }
        .xp-bar-track {
          flex: 1;
          height: 14px;
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
          overflow: hidden;
        }
        .xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #f1c40f, #f39c12);
          border-radius: 999px;
          transition: width 0.8s ease;
        }
        .xp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        /* ── Layout ── */
        .gami-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          padding: 0 16px 48px;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Path Column ── */
        .path-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          position: relative;
        }

        /* ── Week Header ── */
        .week-header {
          background: rgba(0,0,0,0.4);
          color: #f1c40f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-radius: 6px;
          padding: 4px 14px;
          margin-bottom: 16px;
        }

        /* ── Path segments ── */
        .path-segment {
          width: 40px;
          background: linear-gradient(180deg, #6d4c1f 0%, #5d401a 100%);
          border-left: 3px solid #4a3012;
          border-right: 3px solid #8b6030;
          min-height: 54px;
        }
        .path-segment.zigzag-left { transform: translateX(-32px); }
        .path-segment.zigzag-right { transform: translateX(32px); }

        /* ── Path Node ── */
        .path-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .droplets {
          display: flex;
          gap: 4px;
          margin-bottom: 4px;
          font-size: 14px;
        }
        .drop { font-size: 14px; line-height: 1; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
        .drop-filled { opacity: 1; }
        .drop-empty { opacity: 0.3; filter: grayscale(1); }

        .path-node {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 4px solid #7f8c8d;
          background: #95a5a6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          position: relative;
          font-weight: 900;
          color: #fff;
        }
        .path-node:hover { transform: scale(1.12); box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .path-node.node-next { animation: pulse-node 2s infinite; }
        .node-number { font-size: 22px; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.4); }
        .node-check { position: absolute; bottom: -4px; right: -4px; font-size: 16px; background: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #27ae60; font-size: 12px; font-weight: 900; }
        .node-label { font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.7); margin-top: 4px; letter-spacing: 0.3px; text-align: center; max-width: 72px; }

        @keyframes pulse-node {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 0 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 0 10px rgba(255,255,255,0); }
        }

        /* ── Plant ── */
        .plant-col {
          width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding-top: 72px;
        }
        .plant-stage { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .soil {
          width: 56px; height: 14px;
          background: radial-gradient(ellipse at 50% 0%, #8b5e3c 60%, #6b4423 100%);
          border-radius: 0 0 30px 30px;
          margin-top: auto;
        }
        .stem {
          width: 5px;
          background: linear-gradient(180deg, #2ecc71, #27ae60);
          border-radius: 3px;
          position: relative;
          transition: height 0.6s ease;
        }
        .leaf {
          position: absolute;
          width: 18px;
          height: 10px;
          background: #2ecc71;
          border-radius: 50%;
          transition: transform 0.4s ease;
        }
        .leaf-left { left: -18px; transform: rotate(-30deg); }
        .leaf-right { right: -18px; transform: rotate(30deg); }
        .bud { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 10px; height: 14px; background: #e74c3c; border-radius: 50% 50% 40% 40%; }
        .flower { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; }
        .petal {
          position: absolute; width: 12px; height: 18px;
          background: radial-gradient(ellipse, #ff69b4, #e74c3c);
          border-radius: 50%;
          left: 50%; top: 50%;
          transform-origin: 0% 50%;
        }
        .p0 { transform: rotate(0deg) translateX(8px) translateY(-50%); }
        .p1 { transform: rotate(60deg) translateX(8px) translateY(-50%); }
        .p2 { transform: rotate(120deg) translateX(8px) translateY(-50%); }
        .p3 { transform: rotate(180deg) translateX(8px) translateY(-50%); }
        .p4 { transform: rotate(240deg) translateX(8px) translateY(-50%); }
        .p5 { transform: rotate(300deg) translateX(8px) translateY(-50%); }
        .center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 10px; height: 10px; background: #f1c40f; border-radius: 50%; box-shadow: 0 0 6px rgba(255,200,0,0.8); }

        /* ── Right panel ── */
        .games-panel {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          position: sticky;
          top: 16px;
        }
        .games-panel-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          text-align: center;
          margin-bottom: 4px;
        }
        .game-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.12);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 12px 8px;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        .game-card:hover { transform: translateY(-3px) scale(1.04); background: rgba(255,255,255,0.22); }
        .game-card.done { border-color: #27ae60; background: rgba(39,174,96,0.15); }
        .game-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        }
        .game-card-label {
          font-size: 10px; font-weight: 800; color: #fff;
          text-align: center; letter-spacing: 0.3px; line-height: 1.2;
        }
        .game-xp {
          font-size: 9px; font-weight: 700;
          background: rgba(241,196,15,0.9);
          color: #333;
          border-radius: 999px;
          padding: 1px 7px;
        }
        .done-badge {
          position: absolute; top: -6px; right: -6px;
          background: #27ae60; color: #fff;
          border-radius: 50%; width: 18px; height: 18px;
          font-size: 10px; display: flex; align-items: center; justify-content: center;
          font-weight: 900; border: 2px solid #fff;
        }

        /* ── Weekly summary ── */
        .week-summary {
          background: rgba(0,0,0,0.4);
          border-radius: 14px;
          padding: 14px 20px;
          color: #fff;
          text-align: center;
          margin: 0 auto 24px;
          max-width: 440px;
          width: 100%;
        }
        .progress-dots {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
        }
        .dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: background 0.3s ease, transform 0.3s ease;
        }
        .dot.dot-filled {
          background: #f1c40f;
          box-shadow: 0 0 8px rgba(241,196,15,0.7);
          transform: scale(1.2);
        }

        /* ── Bloom banner ── */
        .bloom-banner {
          background: linear-gradient(135deg, #f1c40f, #e67e22);
          border-radius: 12px;
          padding: 12px 20px;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          text-align: center;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 16px rgba(230,126,34,0.4);
          animation: bloom-glow 2s ease infinite alternate;
          margin: 0 auto 16px;
          max-width: 440px;
        }
        @keyframes bloom-glow {
          from { box-shadow: 0 4px 16px rgba(230,126,34,0.4); }
          to   { box-shadow: 0 4px 28px rgba(241,196,15,0.8); }
        }
      `}</style>

      <div className="gami-bg">
        {/* XP Bar header */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div className="xp-bar-wrap">
            <div style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
              LV {level}
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{xp} XP</div>
            <div className="xp-avatar">👤</div>
          </div>
        </div>

        {/* Week summary */}
        <div className="week-summary">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1c40f', letterSpacing: 1 }}>
            THIS WEEK · {currentWeek}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
            {completedCount} / 4 Mini-Games Complete
          </div>
          <div className="progress-dots">
            {MINI_GAMES.map((g, i) => (
              <div key={g.key} className={`dot ${weekProgress.includes(g.key) ? 'dot-filled' : ''}`} title={g.label} />
            ))}
          </div>
          {completedCount === 4 && (
            <div className="bloom-banner" style={{ marginTop: 12, marginBottom: 0 }}>
              🌸 Your plant bloomed! Come back next week for a new challenge!
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className="gami-layout">
          {/* Plant column */}
          <div className="plant-col">
            <div style={{ marginBottom: 12 }}>
              <PlantStage completed={completedCount} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'center', letterSpacing: 1 }}>
              {completedCount < 4 ? `${4 - completedCount} more to bloom` : '🌸 Bloomed!'}
            </div>
          </div>

          {/* Path column */}
          <div className="path-col">
            <div className="week-header">WEEK CHALLENGE</div>

            {MINI_GAMES.map((game, i) => {
              const done = weekProgress.includes(game.key);
              const isNext = !done && weekProgress.length === i;
              return (
                <React.Fragment key={game.key}>
                  <PathNode
                    number={i + 1}
                    game={game}
                    completed={done}
                    isNext={isNext}
                  />
                  {/* Path segment between nodes */}
                  {i < MINI_GAMES.length - 1 && (
                    <div
                      className={`path-segment ${i % 2 === 0 ? 'zigzag-right' : 'zigzag-left'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* End flag */}
            <div className="path-segment" style={{ minHeight: 32 }} />
            <div style={{ fontSize: 28, marginTop: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
              {completedCount === 4 ? '🌟' : '🚩'}
            </div>
          </div>

          {/* Right panel – mini-game cards */}
          <div className="games-panel">
            <div className="games-panel-title">Mini Games</div>
            {MINI_GAMES.map(game => {
              const done = weekProgress.includes(game.key);
              return (
                <Link key={game.key} href={game.href} className={`game-card ${done ? 'done' : ''}`}>
                  {done && <div className="done-badge">✓</div>}
                  <div
                    className="game-icon-wrap"
                    style={{ background: `linear-gradient(135deg, ${game.color}, ${game.borderColor}dd)` }}
                  >
                    <span style={{ fontSize: 26 }}>{game.emoji}</span>
                  </div>
                  <div className="game-card-label">{game.label}</div>
                  <div className="game-xp">+{game.xp} XP</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{game.timer}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
