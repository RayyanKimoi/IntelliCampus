'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ── Types ────────────────────────────────────────────────────────
interface Battle {
  id: string; bossHP: number; currentHP: number; playerHP?: number;
  maxPlayerHP?: number; status: string; score: number; xpEarned?: number;
}
interface Question {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
}
type View = 'select' | 'battle' | 'result';

const BOSS_ICONS = ['🛡️','⚔️','💀','🧙','🐉','👾','🤖','🔥'];
const BOSS_COLORS = ['#8e44ad','#c0392b','#2c3e50','#1a6b3c','#d35400','#2980b9','#6d4c41','#7f8c00'];

function getISOWeekBB(): string {
  const d = new Date(); const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime()-yearStart.getTime())/86400000)+1)/7)).padStart(2,'0')}`;
}
function markWeekBB(key: string) {
  try {
    const wk = getISOWeekBB();
    const raw = localStorage.getItem('ic-week-progress');
    const p = raw ? JSON.parse(raw) : { week: wk, completed: [] };
    if (p.week !== wk) p.completed = []; p.week = wk;
    if (!p.completed.includes(key)) p.completed.push(key);
    localStorage.setItem('ic-week-progress', JSON.stringify(p));
  } catch {}
}

export default function BossBattlePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [view, setView] = useState<View>('select');
  const [battle, setBattle] = useState<Battle | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState('');
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [dmgText, setDmgText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [bossColorIdx, setBossColorIdx] = useState(0);

  useEffect(() => { loadTopics(); }, []);

  const loadTopics = async () => {
    try {
      const courses = await curriculumService.getCourses();
      const cl = (courses as any)?.data ?? courses ?? [];
      const all: any[] = [];
      for (const c of Array.isArray(cl) ? cl : []) {
        try {
          const subs = await curriculumService.getSubjects(c.id);
          for (const s of Array.isArray((subs as any)?.data ?? subs ?? []) ? ((subs as any)?.data ?? subs ?? []) : []) {
            try {
              const tops = await curriculumService.getTopics(s.id);
              all.push(...(Array.isArray((tops as any)?.data ?? tops ?? []) ? ((tops as any)?.data ?? tops ?? []) : []));
            } catch {}
          }
        } catch {}
      }
      setTopics(all);
    } catch {}
  };

  const startBattle = async (topic: any, idx: number) => {
    setLoading(true); setSelectedTopic(topic); setBossColorIdx(idx % BOSS_COLORS.length);
    try {
      const res = await gamificationService.startBossBattle(topic.id);
      const d = (res as any)?.data ?? res;
      setBattle({ id: d.id, bossHP: d.bossHP ?? 100, currentHP: d.currentHP ?? 100, playerHP: d.playerHP ?? 100, maxPlayerHP: d.maxPlayerHP ?? 100, status: d.status, score: d.score ?? 0 });
      setQuestion(d.currentQuestion ?? d.question ?? null);
      setAnswered(false); setSelected(''); setWasCorrect(null); setDmgText('');
      setView('battle');
    } catch { }
    finally { setLoading(false); }
  };

  const answerQuestion = async (opt: string) => {
    if (!battle || !question || answered) return;
    setSelected(opt); setAnswered(true);
    try {
      const res = await gamificationService.answerBattle({ battleId: battle.id, questionId: question.id, selectedOption: opt });
      const d = (res as any)?.data ?? res;
      setWasCorrect(d.correct);
      setDmgText(d.correct ? `-${d.damage ?? 20} HP` : `-${d.damage ?? 15} HP`);
      setBattle(prev => prev ? {
        ...prev,
        currentHP: d.correct ? (d.bossHP ?? Math.max(0, prev.currentHP - (d.damage ?? 20))) : prev.currentHP,
        playerHP: !d.correct ? Math.max(0, (prev.playerHP ?? 100) - (d.damage ?? 15)) : prev.playerHP,
        status: d.status ?? prev.status,
        score: d.score ?? (prev.score + (d.correct ? 1 : 0)),
        xpEarned: d.xpEarned ?? prev.xpEarned,
      } : null);
      if (d.status === 'won' || d.status === 'lost') {
        setTimeout(() => { markWeekBB('boss-battle'); setView('result'); }, 900);
        return;
      }
      setTimeout(() => {
        setQuestion(d.nextQuestion ?? null);
        setAnswered(false); setSelected(''); setWasCorrect(null);
        setTimeout(() => setDmgText(''), 200);
      }, 900);
    } catch { setAnswered(false); }
  };

  const bossHPPct = battle ? Math.max(0, Math.round((battle.currentHP / (battle.bossHP > 0 ? battle.bossHP : 100)) * 100)) : 100;
  const playerHPPct = battle ? Math.max(0, Math.round(((battle.playerHP ?? 100) / (battle.maxPlayerHP ?? 100)) * 100)) : 100;
  const bossName = selectedTopic ? (selectedTopic.name || selectedTopic.title || 'Boss') : 'Boss';
  const bossIcon = BOSS_ICONS[bossColorIdx % BOSS_ICONS.length];
  const bossColor = BOSS_COLORS[bossColorIdx];

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .bb-bg { min-height:calc(100vh - 64px); background:linear-gradient(135deg,#1a0030 0%,#2d0050 50%,#1a0030 100%);
          display:flex; flex-direction:column; align-items:center; padding:12px 16px;
          font-family:'Segoe UI',system-ui,sans-serif; }
        .bb-back { background:none; border:none; cursor:pointer; font-size:13px; font-weight:700;
          color:#cc99ff; padding:8px 0 12px; align-self:flex-start; }
        .bb-back:hover { color:#fff; }
        /* SELECT */
        .bb-sel-title { font-family:'Courier New',monospace; font-size:22px; font-weight:900;
          color:#f1c40f; text-align:center; letter-spacing:3px; margin-bottom:4px; }
        .bb-sel-sub { font-size:12px; color:#9b8ab8; text-align:center; margin-bottom:16px; }
        .bb-boss-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
          gap:12px; width:100%; max-width:600px; }
        .bb-boss-card { border-radius:14px; border:3px solid; padding:16px;
          display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;
          transition:transform 0.15s,box-shadow 0.15s; background:rgba(255,255,255,0.04); }
        .bb-boss-card:hover { transform:scale(1.04); box-shadow:0 6px 20px rgba(0,0,0,0.5); }
        .bb-boss-icon { font-size:40px; line-height:1; }
        .bb-boss-tname { font-size:12px; font-weight:800; color:#fff; text-align:center; }
        .bb-boss-hp-bar { width:100%; height:6px; background:rgba(255,255,255,0.15); border-radius:3px; overflow:hidden; }
        .bb-boss-hp-fill { height:100%; background:#c0392b; border-radius:3px; }
        .bb-enter-btn { margin-top:6px; background:#c0392b; border:2px solid #922b21;
          border-radius:6px; padding:6px 18px; font-size:11px; font-weight:800;
          color:#fff; cursor:pointer; letter-spacing:1px; text-transform:uppercase; }
        .bb-enter-btn:hover { background:#a93226; }
        /* BATTLE */
        .bb-arena { width:100%; max-width:440px; }
        .bb-field { background:linear-gradient(to bottom,#87ceeb 0%,#87ceeb 50%,#5a9e3b 50%,#5a9e3b 100%);
          border-radius:16px 16px 0 0; border:3px solid #2c3e50; border-bottom:none;
          height:200px; position:relative; overflow:hidden; }
        .bb-field-ground { position:absolute; bottom:0; left:0; right:0; height:50%;
          background:linear-gradient(to bottom,#7ab648,#5a9e3b); }
        .bb-boss-sprite { position:absolute; top:16px; right:20px; text-align:center; }
        .bb-boss-face { font-size:52px; line-height:1; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4)); }
        .bb-boss-hp-label { font-size:9px; font-weight:800; color:#fff; background:rgba(0,0,0,0.5);
          padding:2px 6px; border-radius:4px; margin-top:2px; }
        .bb-player-sprite { position:absolute; bottom:16px; left:20px; text-align:center; }
        .bb-player-face { font-size:44px; line-height:1; }
        .bb-dmg-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          font-family:'Courier New',monospace; font-size:20px; font-weight:900;
          color:#f1c40f; text-shadow:2px 2px 0 #000; opacity:0; pointer-events:none; }
        .bb-dmg-text.show { opacity:1; animation:dmgPop 0.7s ease-out forwards; }
        @keyframes dmgPop { 0%{transform:translate(-50%,-80%);opacity:1} 100%{transform:translate(-50%,-150%);opacity:0} }
        .bb-hp-panel { background:#1a0030; border:3px solid #2c3e50; border-top:none;
          border-radius:0 0 16px 16px; padding:12px 20px; display:flex; gap:16px; }
        .bb-hp-row { flex:1; }
        .bb-hp-label { font-size:10px; font-weight:800; color:#cc99ff; letter-spacing:1px; margin-bottom:4px; }
        .bb-hp-bar-wrap { background:rgba(255,255,255,0.1); border-radius:4px; height:12px; overflow:hidden; }
        .bb-hp-fill { height:100%; border-radius:4px; transition:width 0.4s; }
        .bb-hp-fill.boss { background:linear-gradient(to right,#c0392b,#e74c3c); }
        .bb-hp-fill.player { background:linear-gradient(to right,#27ae60,#2ecc71); }
        .bb-hp-num { font-size:9px; color:#9b8ab8; margin-top:2px; text-align:right; }
        .bb-bubble { background:#fff; border-radius:12px; border:3px solid #2c3e50;
          padding:14px; position:relative; margin:12px 0; font-size:13px; font-weight:600;
          color:#2c3e50; line-height:1.4; max-width:440px; width:100%; min-height:60px; }
        .bb-bubble::before { content:''; position:absolute; top:-14px; left:30px;
          border:6px solid transparent; border-bottom-color:#2c3e50; }
        .bb-bubble::after { content:''; position:absolute; top:-10px; left:32px;
          border:5px solid transparent; border-bottom-color:#fff; }
        .bb-ans-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; max-width:440px; }
        .bb-ans-btn { background:#d4af7a; border:3px solid #8b6914; border-radius:12px;
          padding:12px 6px; font-size:12px; font-weight:700; color:#2c3e50;
          cursor:pointer; text-align:center; min-height:50px;
          transition:transform 0.1s,background 0.15s; }
        .bb-ans-btn:hover:not(:disabled) { transform:scale(1.03); background:#c9a060; }
        .bb-ans-btn:disabled { cursor:default; }
        .bb-ans-btn.correct { background:#27ae60; border-color:#1a7a40; color:#fff; }
        .bb-ans-btn.wrong   { background:#c0392b; border-color:#922b21; color:#fff; }
        .bb-score-strip { display:flex; justify-content:space-between; align-items:center;
          font-size:11px; font-weight:700; color:#cc99ff; padding:6px 0; max-width:440px; width:100%; }
        /* RESULT */
        .bb-result-box { width:100%; max-width:380px; background:#1a0030;
          border:4px solid #f1c40f; border-radius:16px; padding:28px; text-align:center; }
        .bb-result-title { font-family:'Courier New',monospace; font-size:28px; font-weight:900;
          letter-spacing:2px; margin-bottom:8px; }
        .bb-result-sub { font-size:13px; font-weight:700; color:#9b8ab8; margin-bottom:16px; }
        .bb-result-badge { display:inline-flex; align-items:center; justify-content:center;
          width:72px; height:72px; background:radial-gradient(circle,#f1c40f,#e67e22);
          border-radius:50%; font-size:30px; font-weight:900; color:#1a0030;
          box-shadow:0 0 0 4px #1a0030,0 0 0 7px #f1c40f; margin:0 auto 12px; }
        .bb-play-again { background:#c0392b; border:3px solid #922b21; border-radius:10px;
          padding:12px 32px; font-size:14px; font-weight:800; color:#fff;
          cursor:pointer; letter-spacing:2px; text-transform:uppercase; margin-top:8px; }
        .bb-play-again:hover { background:#a93226; }
      `}</style>

      <div className="bb-bg">
        {/* ── SELECT SCREEN ── */}
        {view === 'select' && (
          <>
            <button className="bb-back" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div className="bb-sel-title">BOSS BATTLE</div>
            <div className="bb-sel-sub">Choose a topic to face the boss!</div>
            {topics.length === 0 ? (
              <div style={{ color: '#9b8ab8', fontSize: 13, fontWeight: 700, padding: 32 }}>Loading bosses…</div>
            ) : (
              <div className="bb-boss-grid">
                {topics.slice(0, 12).map((t, i) => {
                  const color = BOSS_COLORS[i % BOSS_COLORS.length];
                  const icon = BOSS_ICONS[i % BOSS_ICONS.length];
                  return (
                    <div key={t.id} className="bb-boss-card" style={{ borderColor: color }}>
                      <div className="bb-boss-icon">{icon}</div>
                      <div className="bb-boss-tname">{t.name || t.title}</div>
                      <div className="bb-boss-hp-bar">
                        <div className="bb-boss-hp-fill" style={{ width: '100%', background: color }} />
                      </div>
                      <button className="bb-enter-btn" style={{ background: color, borderColor: color }}
                        disabled={loading} onClick={() => startBattle(t, i)}>
                        {loading ? '…' : 'ENTER BATTLE'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── BATTLE SCREEN ── */}
        {view === 'battle' && battle && (
          <>
            <button className="bb-back" onClick={() => setView('select')}>◀ Flee</button>
            <div className="bb-arena">
              <div className="bb-field">
                <div className="bb-field-ground" />
                <div className="bb-boss-sprite">
                  <div className="bb-boss-face" style={{ filter: `drop-shadow(0 0 8px ${bossColor})` }}>{bossIcon}</div>
                  <div className="bb-boss-hp-label" style={{ background: bossColor }}>{bossName}</div>
                </div>
                <div className="bb-player-sprite">
                  <div className="bb-player-face">🧑‍💻</div>
                  <div className="bb-boss-hp-label" style={{ background: '#27ae60' }}>YOU</div>
                </div>
                <div className={`bb-dmg-text ${dmgText ? 'show' : ''}`} style={{ color: wasCorrect ? '#e74c3c' : '#f39c12' }}>
                  {dmgText}
                </div>
              </div>
              <div className="bb-hp-panel">
                <div className="bb-hp-row">
                  <div className="bb-hp-label">BOSS HP</div>
                  <div className="bb-hp-bar-wrap"><div className="bb-hp-fill boss" style={{ width: `${bossHPPct}%` }} /></div>
                  <div className="bb-hp-num">{battle.currentHP}/{battle.bossHP}</div>
                </div>
                <div className="bb-hp-row">
                  <div className="bb-hp-label">YOUR HP</div>
                  <div className="bb-hp-bar-wrap"><div className="bb-hp-fill player" style={{ width: `${playerHPPct}%` }} /></div>
                  <div className="bb-hp-num">{battle.playerHP ?? 100}/{battle.maxPlayerHP ?? 100}</div>
                </div>
              </div>
            </div>
            <div className="bb-score-strip">
              <span>⚔️ Score: {battle.score}</span>
              <span style={{ color: '#f1c40f' }}>VS {bossName}</span>
            </div>
            {question ? (
              <>
                <div className="bb-bubble">{question.questionText}</div>
                <div className="bb-ans-grid">
                  {([['A', question.optionA], ['B', question.optionB], ['C', question.optionC], ['D', question.optionD]] as [string, string][]).map(([k, l]) => {
                    let cls = 'bb-ans-btn';
                    if (answered && k === selected) cls += wasCorrect ? ' correct' : ' wrong';
                    return <button key={k} className={cls} disabled={answered} onClick={() => answerQuestion(k)}>{l}</button>;
                  })}
                </div>
              </>
            ) : (
              <div className="bb-bubble" style={{ textAlign: 'center', color: '#888' }}>Loading question…</div>
            )}
          </>
        )}

        {/* ── RESULT SCREEN ── */}
        {view === 'result' && battle && (
          <>
            <button className="bb-back" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div style={{ textAlign: 'center', fontSize: 56, padding: '12px 0' }}>
              {battle.status === 'won' ? '🏆' : '💀'}
            </div>
            <div className="bb-result-box">
              <div className="bb-result-title" style={{ color: battle.status === 'won' ? '#f1c40f' : '#e74c3c' }}>
                {battle.status === 'won' ? 'BOSS DEFEATED!' : 'DEFEATED…'}
              </div>
              <div className="bb-result-sub">{battle.status === 'won' ? `${bossName} has fallen!` : 'Better luck next time!'}</div>
              <div className="bb-result-badge">{battle.score}</div>
              <div style={{ color: '#9b8ab8', fontSize: 12, fontWeight: 700 }}>{battle.xpEarned ?? 0} XP Gained</div>
              <button className="bb-play-again" onClick={() => setView('select')}>▶ PLAY AGAIN</button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

