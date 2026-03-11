'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

// ── Types & Data ─────────────────────────────────────────────────
interface BBQuestion {
  text: string;
  options: string[];
  correct: number; // 0-3
}

interface Phase {
  name: string;
  bossHP: number;
  icon: string;
  color: string;
  questions: BBQuestion[];
}

const PHASES: Phase[] = [
  {
    name: 'Easy', bossHP: 100, icon: '👾', color: '#8e44ad',
    questions: [
      { text: 'What data structure uses LIFO ordering?', options: ['Stack', 'Queue', 'Array', 'Graph'], correct: 0 },
      { text: 'Which structure uses FIFO ordering?', options: ['Stack', 'Queue', 'Tree', 'Map'], correct: 1 },
      { text: 'What is the time complexity of accessing an array element by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 2 },
      { text: 'A linked list node contains data and a ___?', options: ['Key', 'Index', 'Pointer', 'Hash'], correct: 2 },
      { text: 'Which traversal visits root, left, then right?', options: ['Inorder', 'Preorder', 'Postorder', 'Level-order'], correct: 1 },
      { text: 'What does a hash function do?', options: ['Sorts data', 'Maps keys to indices', 'Compresses files', 'Encrypts data'], correct: 1 },
      { text: 'A binary tree has at most ___ children per node.', options: ['1', '2', '3', 'Unlimited'], correct: 1 },
      { text: 'Which data structure is best for BFS?', options: ['Stack', 'Queue', 'Heap', 'Array'], correct: 1 },
    ],
  },
  {
    name: 'Medium', bossHP: 150, icon: '🐉', color: '#c0392b',
    questions: [
      { text: 'What is the worst-case time for hash table lookup?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 2 },
      { text: 'Which sort is NOT comparison-based?', options: ['Merge sort', 'Quick sort', 'Counting sort', 'Heap sort'], correct: 2 },
      { text: 'In an AVL tree, the balance factor can be?', options: ['0 only', '-1, 0, 1', '-2 to 2', 'Any integer'], correct: 1 },
      { text: 'Dijkstra\'s algorithm finds?', options: ['MST', 'Shortest path', 'Max flow', 'Topological order'], correct: 1 },
      { text: 'A min-heap\'s root contains the?', options: ['Maximum', 'Minimum', 'Median', 'Average'], correct: 1 },
      { text: 'What property defines a BST?', options: ['Balanced height', 'Left < root < right', 'Complete tree', 'Max 2 children'], correct: 1 },
      { text: 'Graph DFS uses which structure internally?', options: ['Queue', 'Stack', 'Heap', 'Hash table'], correct: 1 },
      { text: 'Amortized time for dynamic array push is?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 2 },
      { text: 'Which structure supports union and find in near O(1)?', options: ['BST', 'Hash map', 'Disjoint set', 'Trie'], correct: 2 },
      { text: 'Postfix expression evaluation uses a?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correct: 1 },
    ],
  },
  {
    name: 'Hard', bossHP: 200, icon: '💀', color: '#2c3e50',
    questions: [
      { text: 'Red-black tree guarantees O(log n) because of?', options: ['AVL rotations', 'Color constraints', 'Hash balancing', 'Skip pointers'], correct: 1 },
      { text: 'B-tree is commonly used in?', options: ['CPU cache', 'Database indexes', 'GPU shaders', 'Network routing'], correct: 1 },
      { text: 'Fibonacci heap improves which operation?', options: ['Insert', 'Decrease-key', 'Delete', 'Find-max'], correct: 1 },
      { text: 'Suffix tree construction can be done in?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(2ⁿ)'], correct: 2 },
      { text: 'Bloom filter can produce?', options: ['False negatives only', 'False positives only', 'Both', 'Neither'], correct: 1 },
      { text: 'Time complexity of building a heap from array?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correct: 1 },
      { text: 'Kruskal\'s algorithm needs which structure?', options: ['Priority queue', 'Disjoint set', 'Stack', 'Hash map'], correct: 1 },
      { text: 'A splay tree uses which strategy?', options: ['AVL rotations', 'Color flips', 'Move to root', 'Random balancing'], correct: 2 },
      { text: 'Skip list expected search time is?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 1 },
      { text: 'Treap combines which two structures?', options: ['BST + heap', 'Trie + graph', 'Stack + queue', 'Hash + array'], correct: 0 },
      { text: 'Van Emde Boas tree supports predecessor in?', options: ['O(log n)', 'O(log log n)', 'O(1)', 'O(√n)'], correct: 1 },
      { text: 'Persistent data structure preserves?', options: ['Memory locality', 'All previous versions', 'Constant space', 'Thread safety'], correct: 1 },
    ],
  },
];

type View = 'setup' | 'battle' | 'result';

const BOSS_DAMAGE = 20;
const PLAYER_DAMAGE = 15;
const PLAYER_MAX_HP = 100;
const BOSS_NAME = 'Data Structure Titan';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BossBattlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageId = Number(searchParams.get('stageId')) || 1;
  const { user } = useAuthStore();

  const [view, setView] = useState<View>('setup');
  const [phase, setPhase] = useState(0);
  const [questions, setQuestions] = useState<BBQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [bossHP, setBossHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(PLAYER_MAX_HP);
  const [maxBossHP, setMaxBossHP] = useState(100);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(-1);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [dmgText, setDmgText] = useState('');
  const [victory, setVictory] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const submittedRef = useRef(false);

  const startBattle = () => {
    submittedRef.current = false;
    setPhase(0);
    initPhase(0);
    setScore(0);
    setVictory(false);
    setXpEarned(0);
    setView('battle');
  };

  const initPhase = (p: number) => {
    const ph = PHASES[p];
    setQuestions(shuffle(ph.questions));
    setQIdx(0);
    setBossHP(ph.bossHP);
    setMaxBossHP(ph.bossHP);
    setPlayerHP(PLAYER_MAX_HP);
    setAnswered(false);
    setSelectedOpt(-1);
    setWasCorrect(null);
    setDmgText('');
  };

  const completeVictory = useCallback(async () => {
    if (!user?.id || submittedRef.current) return;
    submittedRef.current = true;
    try {
      const res = await fetch('/api/gamification/complete-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, stageId, gameType: 'boss' }),
      });
      if (res.ok) {
        const data = await res.json();
        setXpEarned(data.data?.xpEarned ?? 300);
      } else { setXpEarned(300); }
    } catch { setXpEarned(300); }
  }, [user?.id, stageId]);

  const selectAnswer = (optIdx: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOpt(optIdx);
    const q = questions[qIdx];
    const correct = optIdx === q.correct;
    setWasCorrect(correct);

    if (correct) {
      setDmgText(`-${BOSS_DAMAGE} Boss HP`);
      const newBossHP = Math.max(0, bossHP - BOSS_DAMAGE);
      setBossHP(newBossHP);
      setScore(s => s + 1);

      if (newBossHP <= 0) {
        // Phase cleared
        if (phase < 2) {
          // Next phase
          setTimeout(() => {
            const nextPhase = phase + 1;
            setPhase(nextPhase);
            initPhase(nextPhase);
          }, 1200);
        } else {
          // Victory!
          setVictory(true);
          completeVictory();
          setTimeout(() => setView('result'), 1200);
        }
        return;
      }
    } else {
      setDmgText(`-${PLAYER_DAMAGE} Your HP`);
      const newPlayerHP = Math.max(0, playerHP - PLAYER_DAMAGE);
      setPlayerHP(newPlayerHP);

      if (newPlayerHP <= 0) {
        // Defeat
        setVictory(false);
        setTimeout(() => setView('result'), 1200);
        return;
      }
    }

    // Next question
    setTimeout(() => {
      const nextQ = qIdx + 1;
      if (nextQ >= questions.length) {
        // Ran out of questions — recycle shuffled
        setQuestions(shuffle(PHASES[phase].questions));
        setQIdx(0);
      } else {
        setQIdx(nextQ);
      }
      setAnswered(false);
      setSelectedOpt(-1);
      setWasCorrect(null);
      setTimeout(() => setDmgText(''), 200);
    }, 900);
  };

  const currentPhase = PHASES[phase];
  const bossHPPct = maxBossHP > 0 ? Math.max(0, Math.round((bossHP / maxBossHP) * 100)) : 0;
  const playerHPPct = Math.max(0, Math.round((playerHP / PLAYER_MAX_HP) * 100));
  const q = questions[qIdx];

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .bb-bg { min-height:calc(100vh - 64px); background:linear-gradient(135deg,#1a0030 0%,#2d0050 50%,#1a0030 100%);
          display:flex; flex-direction:column; align-items:center; padding:12px 16px;
          font-family:'Segoe UI',system-ui,sans-serif; }
        .bb-back { background:none; border:none; cursor:pointer; font-size:13px; font-weight:700;
          color:#cc99ff; padding:8px 0 12px; align-self:flex-start; }
        .bb-back:hover { color:#fff; }
        .bb-sel-title { font-family:'Courier New',monospace; font-size:22px; font-weight:900;
          color:#f1c40f; text-align:center; letter-spacing:3px; margin-bottom:4px; }
        .bb-sel-sub { font-size:12px; color:#9b8ab8; text-align:center; margin-bottom:16px; }
        .bb-setup { width:100%; max-width:380px; background:rgba(255,255,255,0.06);
          border-radius:16px; border:3px solid #8e44ad; padding:24px; text-align:center; }
        .bb-enter-btn { background:#c0392b; border:3px solid #922b21;
          border-radius:10px; padding:14px 32px; font-size:16px; font-weight:900;
          color:#fff; cursor:pointer; letter-spacing:2px; text-transform:uppercase; margin-top:16px; }
        .bb-enter-btn:hover { background:#a93226; }
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
        .bb-phase-tag { background:rgba(255,255,255,0.1); border-radius:6px; padding:4px 10px;
          font-size:10px; font-weight:800; color:#f1c40f; letter-spacing:1px; }
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
        {/* ── SETUP SCREEN ── */}
        {view === 'setup' && (
          <>
            <button className="bb-back" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div className="bb-sel-title">BOSS BATTLE</div>
            <div className="bb-sel-sub">Defeat the Data Structure Titan across 3 phases!</div>
            <div className="bb-setup">
              <div style={{ fontSize: 64 }}>🐉</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f1c40f', marginTop: 8 }}>{BOSS_NAME}</div>
              <div style={{ fontSize: 11, color: '#9b8ab8', marginTop: 8, lineHeight: 1.6 }}>
                Phase 1: Easy (HP 100)<br />
                Phase 2: Medium (HP 150)<br />
                Phase 3: Hard (HP 200)<br /><br />
                Correct = Boss takes {BOSS_DAMAGE} damage<br />
                Wrong = You take {PLAYER_DAMAGE} damage<br />
                Your HP: {PLAYER_MAX_HP} per phase<br /><br />
                +300 XP on Victory!
              </div>
              <button className="bb-enter-btn" onClick={startBattle}>⚔️ ENTER BATTLE</button>
            </div>
          </>
        )}

        {/* ── BATTLE SCREEN ── */}
        {view === 'battle' && q && (
          <>
            <button className="bb-back" onClick={() => { setView('setup'); }}>◀ Flee</button>
            <div className="bb-arena">
              <div className="bb-field">
                <div className="bb-field-ground" />
                <div className="bb-boss-sprite">
                  <div className="bb-boss-face" style={{ filter: `drop-shadow(0 0 8px ${currentPhase.color})` }}>{currentPhase.icon}</div>
                  <div className="bb-boss-hp-label" style={{ background: currentPhase.color }}>{BOSS_NAME}</div>
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
                  <div className="bb-hp-num">{bossHP}/{maxBossHP}</div>
                </div>
                <div className="bb-hp-row">
                  <div className="bb-hp-label">YOUR HP</div>
                  <div className="bb-hp-bar-wrap"><div className="bb-hp-fill player" style={{ width: `${playerHPPct}%` }} /></div>
                  <div className="bb-hp-num">{playerHP}/{PLAYER_MAX_HP}</div>
                </div>
              </div>
            </div>
            <div className="bb-score-strip">
              <span>⚔️ Score: {score}</span>
              <span className="bb-phase-tag">PHASE {phase + 1}: {currentPhase.name.toUpperCase()}</span>
            </div>
            <div className="bb-bubble">{q.text}</div>
            <div className="bb-ans-grid">
              {q.options.map((opt, i) => {
                let cls = 'bb-ans-btn';
                if (answered && i === selectedOpt) cls += wasCorrect ? ' correct' : ' wrong';
                if (answered && i === q.correct && !wasCorrect) cls += ' correct';
                return <button key={i} className={cls} disabled={answered} onClick={() => selectAnswer(i)}>{opt}</button>;
              })}
            </div>
          </>
        )}

        {/* ── RESULT SCREEN ── */}
        {view === 'result' && (
          <>
            <button className="bb-back" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div style={{ textAlign: 'center', fontSize: 56, padding: '12px 0' }}>
              {victory ? '🏆' : '💀'}
            </div>
            <div className="bb-result-box">
              <div className="bb-result-title" style={{ color: victory ? '#f1c40f' : '#e74c3c' }}>
                {victory ? 'BOSS DEFEATED!' : 'DEFEATED...'}
              </div>
              <div className="bb-result-sub">
                {victory ? `${BOSS_NAME} has fallen!` : `Fell in Phase ${phase + 1} (${currentPhase.name})`}
              </div>
              <div className="bb-result-badge">{score}</div>
              <div style={{ color: '#9b8ab8', fontSize: 12, fontWeight: 700 }}>
                {victory ? `+${xpEarned || 300} XP Gained` : '0 XP — Try again!'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                <button className="bb-play-again" onClick={() => setView('setup')}>▶ PLAY AGAIN</button>
                <button className="bb-play-again" style={{ background: '#27ae60', borderColor: '#1a7a40' }}
                  onClick={() => router.push('/student/gamification/arena')}>ARENA</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

