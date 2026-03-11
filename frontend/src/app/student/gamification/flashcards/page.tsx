'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

const DURATION = 180; // 3 minutes

interface CardPair {
  term: string;
  definition: string;
}

const PAIRS: CardPair[] = [
  { term: 'Stack', definition: 'LIFO data structure' },
  { term: 'Queue', definition: 'FIFO data structure' },
  { term: 'Array', definition: 'Indexed collection' },
  { term: 'Linked List', definition: 'Node-based chain' },
  { term: 'Binary Tree', definition: 'Hierarchical structure' },
  { term: 'Hash Map', definition: 'Key-value pairs' },
  { term: 'Graph', definition: 'Connected vertices' },
  { term: 'Heap', definition: 'Priority-based tree' },
];

interface MemCard {
  id: number;
  pairId: number;
  text: string;
  flipped: boolean;
  matched: boolean;
}

type View = 'setup' | 'game' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(): MemCard[] {
  const items: { pairId: number; text: string }[] = [];
  PAIRS.forEach((pair, idx) => {
    items.push({ pairId: idx, text: pair.term });
    items.push({ pairId: idx, text: pair.definition });
  });
  return shuffle(items).map((item, i) => ({
    id: i,
    pairId: item.pairId,
    text: item.text,
    flipped: false,
    matched: false,
  }));
}

export default function FlashcardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageId = Number(searchParams.get('stageId')) || 1;
  const { user } = useAuthStore();

  const [view, setView] = useState<View>('setup');
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [victory, setVictory] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkRef = useRef<NodeJS.Timeout | null>(null);
  const matchRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (view !== 'game') return;
    if (timeLeft <= 0) { endGame(false); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view, timeLeft]);

  const startGame = () => {
    setCards(buildCards());
    setFlippedIds([]);
    setMatchedCount(0);
    matchRef.current = 0;
    submittedRef.current = false;
    setTimeLeft(DURATION);
    setVictory(false);
    setLocked(false);
    setXpEarned(0);
    setView('game');
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
          const matched = newCards.map(c =>
            c.id === a || c.id === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          matchRef.current += 1;
          setMatchedCount(matchRef.current);
          if (matchRef.current === 8) {
            endGame(true);
            return;
          }
        } else {
          setCards(newCards.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
        }
        setFlippedIds([]);
        setLocked(false);
      }, 900);
    }
  };

  const endGame = useCallback(async (won: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (checkRef.current) clearTimeout(checkRef.current);
    setVictory(won);

    if (won && user?.id && !submittedRef.current) {
      submittedRef.current = true;
      try {
        const res = await fetch('/api/gamification/complete-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, stageId, gameType: 'flashcards' }),
        });
        if (res.ok) {
          const data = await res.json();
          setXpEarned(data.data?.xpEarned ?? 200);
        } else { setXpEarned(200); }
      } catch { setXpEarned(200); }
    }

    setView('result');
  }, [user?.id, stageId]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .fc-bg { min-height:calc(100vh - 64px); background:#6dd5ed;
          background-image:radial-gradient(circle at 20% 20%,#89e8f5 0%,transparent 50%),
          radial-gradient(circle at 80% 80%,#4ab8d4 0%,transparent 50%);
          display:flex; flex-direction:column; align-items:center;
          padding:12px 16px; font-family:'Segoe UI',system-ui,sans-serif; }
        .fc-top { display:flex; align-items:center; justify-content:space-between;
          width:100%; max-width:420px; margin-bottom:12px; }
        .fc-timer { font-family:'Courier New',monospace; font-size:20px;
          font-weight:900; color:#2c3e50; background:rgba(255,255,255,0.6);
          border-radius:8px; padding:4px 12px; letter-spacing:2px; }
        .fc-grid { display:grid; grid-template-columns:repeat(4,1fr);
          gap:8px; width:100%; max-width:380px; }
        .fc-card { aspect-ratio:1; background:#1a3a6e; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; border:3px solid #0d2550;
          box-shadow:0 3px 8px rgba(0,0,0,0.25);
          transition:transform 0.15s ease, background 0.2s ease;
          font-size:10px; font-weight:800; color:#fff; text-align:center;
          padding:4px; line-height:1.2; user-select:none; }
        .fc-card:hover:not(.fc-flipped):not(.fc-matched) { transform:scale(1.06); background:#254a8a; }
        .fc-card.fc-flipped { background:#2980b9; border-color:#1a6e9f; }
        .fc-card.fc-matched { background:#27ae60; border-color:#1a7a40; opacity:0.75; }
        .fc-star { font-size:22px; color:#f1c40f; }
        .fc-back-btn { background:none; border:none; cursor:pointer; font-size:13px;
          font-weight:700; color:#1a3a6e; padding:12px 0 4px; }
        .fc-back-btn:hover { color:#0d2550; }
        .fc-setup { width:100%; max-width:380px; background:rgba(255,255,255,0.85);
          border-radius:16px; border:3px solid #2980b9; padding:24px; }
        .fc-setup-title { font-family:'Courier New',monospace; font-size:24px; font-weight:900;
          color:#1a3a6e; text-align:center; letter-spacing:2px; margin-bottom:16px; }
        .fc-start-btn { width:100%; background:#2980b9; border:3px solid #1a6e9f;
          border-radius:12px; padding:14px; font-size:18px; font-weight:900; color:#fff;
          cursor:pointer; margin-top:12px; letter-spacing:1px; text-transform:uppercase; }
        .fc-start-btn:hover { background:#1a6e9f; }
        .fc-result-box { background:#1a3a6e; border-radius:16px; border:4px solid #0d2550;
          padding:32px 24px; text-align:center; }
        .fc-result-title { font-family:'Courier New',monospace; font-size:40px;
          font-weight:900; color:#f1c40f; text-shadow:3px 3px 0 rgba(0,0,0,0.5); }
        .fc-xp { font-size:14px; color:rgba(255,255,255,0.8); font-weight:700; margin-top:8px; }
      `}</style>

      <div className="fc-bg">
        {/* SETUP */}
        {view === 'setup' && (
          <>
            <button className="fc-back-btn" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div className="fc-setup">
              <div style={{ textAlign: 'center', marginBottom: 8 }}><span style={{ fontSize: 48 }}>🃏</span></div>
              <div className="fc-setup-title">FLASHCARDS</div>
              <div style={{ fontSize: 12, color: '#5d6b8a', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
                Find all 8 matching pairs before time runs out!<br />
                Match each data structure term with its definition.<br />
                ⏱ 3 minutes · +200 XP on Victory
              </div>
              <button className="fc-start-btn" onClick={startGame}>▶ PLAY NOW</button>
            </div>
          </>
        )}

        {/* GAME */}
        {view === 'game' && (
          <>
            <div className="fc-top">
              <div style={{ fontSize: 24 }}>🃏</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e' }}>
                {matchedCount} / 8 pairs
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
                  {card.flipped || card.matched ? card.text : <span className="fc-star">✦</span>}
                </div>
              ))}
            </div>
            <button className="fc-back-btn" onClick={() => endGame(false)}>◀ Give Up</button>
          </>
        )}

        {/* RESULT */}
        {view === 'result' && (
          <div style={{ width: '100%', maxWidth: 380 }}>
            <button className="fc-back-btn" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 56 }}>
              {victory ? '🏆' : '🕐'}
            </div>
            <div className="fc-result-box">
              <div className="fc-result-title">{victory ? 'VICTORY!' : 'TIMEOUT!'}</div>
              <div className="fc-xp">
                {victory ? `+${xpEarned || 200} XP earned!` : `${matchedCount}/8 pairs matched`}
              </div>
              {!victory && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  Match all 8 pairs to win!
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="fc-start-btn" style={{ flex: 1 }} onClick={() => setView('setup')}>▶ PLAY AGAIN</button>
              <button className="fc-start-btn" style={{ flex: 1, background: '#27ae60', borderColor: '#1a7a40' }}
                onClick={() => router.push('/student/gamification/arena')}>ARENA</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

