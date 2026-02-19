'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ── Types ──────────────────────────────────────────────────────
interface MemCard {
  id: number;       // unique per card (0-15)
  pairId: number;   // 0-7, matches its pair
  text: string;
  flipped: boolean;
  matched: boolean;
}

type View = 'setup' | 'game' | 'result';

const DURATION = 180; // 3 minutes

const FALLBACK_TERMS = [
  'Array', 'Queue', 'Stack', 'Linked List',
  'Binary Tree', 'Hash Map', 'Loop', 'Recursion',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(terms: string[]): MemCard[] {
  const eight = terms.slice(0, 8);
  const pairs = [...eight, ...eight];
  return shuffle(pairs).map((text, i) => ({
    id: i,
    pairId: eight.indexOf(text),
    text,
    flipped: false,
    matched: false,
  }));
}

function getISOWeekF(): string {
  const d = new Date();
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function markWeeklyCompleteF(key: string) {
  try {
    const wk = getISOWeekF();
    const raw = localStorage.getItem('ic-week-progress');
    const parsed = raw ? JSON.parse(raw) : { week: wk, completed: [] };
    if (parsed.week !== wk) parsed.completed = [];
    parsed.week = wk;
    if (!parsed.completed.includes(key)) parsed.completed.push(key);
    localStorage.setItem('ic-week-progress', JSON.stringify(parsed));
  } catch {}
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('setup');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [loading, setLoading] = useState(false);
  const [victory, setVictory] = useState(false);
  const [xpEarned] = useState(80);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadTopics(); }, []);

  useEffect(() => {
    if (view !== 'game') return;
    if (timeLeft <= 0) { endGame(false); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view, timeLeft]);

  const loadTopics = async () => {
    try {
      const courses = await curriculumService.getCourses();
      const cl = (courses as any)?.data || courses || [];
      const all: any[] = [];
      for (const c of (Array.isArray(cl) ? cl : [])) {
        try {
          const subs = await curriculumService.getSubjects(c.id);
          for (const s of (Array.isArray((subs as any)?.data || subs || []) ? ((subs as any)?.data || subs || []) : [])) {
            try {
              const tops = await curriculumService.getTopics(s.id);
              all.push(...(Array.isArray((tops as any)?.data || tops || []) ? ((tops as any)?.data || tops || []) : []));
            } catch {}
          }
        } catch {}
      }
      setTopics(all);
      if (all.length) setSelectedTopic(all[0].id);
    } catch {}
  };

  const startGame = async () => {
    setLoading(true);
    let terms = FALLBACK_TERMS;
    if (selectedTopic) {
      try {
        const res = await gamificationService.getFlashcards(selectedTopic);
        const d = (res as any)?.data || res || [];
        const apiTerms = (Array.isArray(d) ? d : []).map((c: any) => c.cardText || c.term || '').filter(Boolean);
        if (apiTerms.length >= 4) {
          terms = apiTerms.slice(0, 8);
          while (terms.length < 8) terms.push(FALLBACK_TERMS[terms.length % 8]);
        }
      } catch {}
    }
    setCards(buildCards(terms));
    setFlippedIds([]); setMatchedCount(0);
    setTimeLeft(DURATION); setVictory(false); setLocked(false);
    setView('game');
    setLoading(false);
  };

  const flipCard = (id: number) => {
    if (locked) return;
    const card = cards[id];
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      const [a, b] = newFlipped;
      const cardA = newCards[a];
      const cardB = newCards[b];

      checkRef.current = setTimeout(() => {
        if (cardA.pairId === cardB.pairId) {
          // Match!
          const matched = newCards.map(c =>
            c.id === a || c.id === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          const newCount = matchedCount + 1;
          setMatchedCount(newCount);
          if (newCount === 8) { endGame(true); return; }
        } else {
          // No match — flip back
          setCards(newCards.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
        }
        setFlippedIds([]);
        setLocked(false);
      }, 900);
    }
  };

  const endGame = useCallback((won: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (checkRef.current) clearTimeout(checkRef.current);
    setVictory(won);
    if (won) markWeeklyCompleteF('flashcards');
    setView('result');
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .fc-bg {
          min-height:calc(100vh - 64px); background:#6dd5ed;
          background-image:radial-gradient(circle at 20% 20%,#89e8f5 0%,transparent 50%),
            radial-gradient(circle at 80% 80%,#4ab8d4 0%,transparent 50%);
          display:flex; flex-direction:column; align-items:center;
          padding:12px 16px; font-family:'Segoe UI',system-ui,sans-serif;
        }
        .fc-top {
          display:flex; align-items:center; justify-content:space-between;
          width:100%; max-width:420px; margin-bottom:12px;
        }
        .fc-icon { width:36px; height:36px; background:#f1c40f;
          border:3px solid #8b6914; border-radius:8px;
          display:flex; align-items:center; justify-content:center; font-size:18px; }
        .fc-timer { font-family:'Courier New',monospace; font-size:20px;
          font-weight:900; color:#2c3e50; background:rgba(255,255,255,0.6);
          border-radius:8px; padding:4px 12px; letter-spacing:2px; }
        .fc-grid {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:8px; width:100%; max-width:380px;
        }
        .fc-card {
          aspect-ratio:1; background:#1a3a6e; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; border:3px solid #0d2550;
          box-shadow:0 3px 8px rgba(0,0,0,0.25);
          transition:transform 0.15s ease, background 0.2s ease;
          position:relative; overflow:hidden;
          font-size:10px; font-weight:800; color:#fff; text-align:center;
          padding:4px; line-height:1.2;
          user-select:none;
        }
        .fc-card:hover:not(.fc-flipped):not(.fc-matched) { transform:scale(1.06); background:#254a8a; }
        .fc-card.fc-flipped { background:#2980b9; border-color:#1a6e9f; }
        .fc-card.fc-matched { background:#27ae60; border-color:#1a7a40; opacity:0.75; }
        .fc-star { font-size:22px; color:#f1c40f; text-shadow:0 0 8px rgba(241,196,15,0.6); }
        .fc-back-btn { background:none; border:none; cursor:pointer; font-size:13px;
          font-weight:700; color:#1a3a6e; padding:12px 0 4px; }
        .fc-back-btn:hover { color:#0d2550; }
        /* Setup */
        .fc-setup { width:100%; max-width:380px; background:rgba(255,255,255,0.85);
          border-radius:16px; border:3px solid #2980b9; padding:24px; }
        .fc-setup-title { font-family:'Courier New',monospace; font-size:24px; font-weight:900;
          color:#1a3a6e; text-align:center; letter-spacing:2px; margin-bottom:16px; }
        .fc-topic-sel { width:100%; background:#fff; border:3px solid #2980b9;
          border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:#2c3e50; }
        .fc-start-btn { width:100%; background:#2980b9; border:3px solid #1a6e9f;
          border-radius:12px; padding:14px; font-size:18px; font-weight:900; color:#fff;
          cursor:pointer; margin-top:12px; letter-spacing:1px; text-transform:uppercase;
          transition:background 0.15s; }
        .fc-start-btn:hover:not(:disabled) { background:#1a6e9f; }
        .fc-start-btn:disabled { opacity:.6; cursor:default; }
        /* Result */
        .fc-result { width:100%; max-width:380px; }
        .fc-result-box { background:#1a3a6e; border-radius:16px; border:4px solid #0d2550;
          padding:32px 24px; text-align:center; }
        .fc-result-title { font-family:'Courier New',monospace; font-size:40px;
          font-weight:900; color:#f1c40f; text-shadow:3px 3px 0 rgba(0,0,0,0.5);
          letter-spacing:3px; line-height:1; }
        .fc-xp { font-size:14px; color:rgba(255,255,255,0.8); font-weight:700; margin-top:8px; }
        .fc-play-again { background:none; border:none; cursor:pointer;
          font-size:14px; font-weight:900; color:#2ecc71; letter-spacing:1px;
          padding:12px 0 0; display:block; text-align:right; width:100%;
          text-transform:uppercase; }
        .fc-play-again:hover { color:#f1c40f; }
        .fc-progress { font-size:12px; font-weight:700; color:rgba(255,255,255,0.75);
          margin-top:4px; }
      `}</style>

      <div className="fc-bg">
        {/* SETUP */}
        {view === 'setup' && (
          <>
            <button className="fc-back-btn" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div className="fc-setup">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 48 }}>🃏</span>
              </div>
              <div className="fc-setup-title">FLASHCARDS</div>
              <div style={{ fontSize: 12, color: '#5d6b8a', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                Find all 8 matching pairs before time runs out!<br />
                ⏱ 3 minutes &nbsp;·&nbsp; +80 XP on Victory
              </div>
              <select className="fc-topic-sel" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                {topics.length === 0 && <option value="">Use default terms</option>}
                {topics.map(t => <option key={t.id} value={t.id}>{t.name || t.title}</option>)}
              </select>
              <button className="fc-start-btn" onClick={startGame} disabled={loading}>
                {loading ? 'Building…' : '▶  PLAY NOW'}
              </button>
            </div>
          </>
        )}

        {/* GAME */}
        {view === 'game' && (
          <>
            <div className="fc-top">
              <div className="fc-icon">🃏</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e' }}>{'✦'.repeat(matchedCount)}</span>
              </div>
              <div className="fc-timer">{mm} : {ss}</div>
            </div>
            <div className="fc-grid">
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`fc-card${card.flipped ? ' fc-flipped' : ''}${card.matched ? ' fc-matched' : ''}`}
                  onClick={() => flipCard(card.id)}
                >
                  {card.flipped || card.matched
                    ? card.text
                    : <span className="fc-star">✦</span>
                  }
                </div>
              ))}
            </div>
            <div className="fc-progress" style={{ color: '#1a3a6e', marginTop: 12 }}>
              {matchedCount} / 8 pairs matched
            </div>
            <button className="fc-back-btn" onClick={() => endGame(false)}>◀ Back</button>
          </>
        )}

        {/* RESULT */}
        {view === 'result' && (
          <div className="fc-result">
            <button className="fc-back-btn" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 56 }}>
              {victory ? '🏆' : '🕐'}
            </div>
            <div className="fc-result-box">
              <div className="fc-result-title">{victory ? 'VICTORY!' : 'TIMEOUT!'}</div>
              <div className="fc-xp">{victory ? xpEarned : Math.round(xpEarned * matchedCount / 8)} XP gained</div>
              {!victory && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {matchedCount} / 8 pairs matched
                </div>
              )}
            </div>
            <button className="fc-play-again" onClick={() => setView('setup')}>▶ PLAY AGAIN</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

