'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ── Constants ───────────────────────────────────────────────────
const QUIZ_DURATION = 300; // 5 minutes
const WHEEL_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71',
  '#1abc9c','#3498db','#9b59b6','#e91e63',
];

interface SpinQuestion {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
}

type View = 'wheel' | 'quiz' | 'result';

function getISOWeekW(): string {
  const d = new Date(); const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
function markWeekW(key: string) {
  try {
    const wk = getISOWeekW(); const raw = localStorage.getItem('ic-week-progress');
    const p = raw ? JSON.parse(raw) : { week: wk, completed: [] };
    if (p.week !== wk) p.completed = []; p.week = wk;
    if (!p.completed.includes(key)) p.completed.push(key);
    localStorage.setItem('ic-week-progress', JSON.stringify(p));
  } catch {}
}

export default function SpinWheelPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [view, setView] = useState<View>('wheel');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [chosenTopic, setChosenTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<SpinQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);

  useEffect(() => { loadTopics(); }, []);

  useEffect(() => {
    if (view !== 'quiz') return;
    if (timeLeft <= 0) { endQuiz(); return; }
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
      // Take up to 8 topics for the wheel
      setTopics(all.slice(0, 8));
    } catch {}
  };

  const spin = () => {
    if (spinning || topics.length === 0) return;
    setSpinning(true);
    const spins = 5 * 360 + Math.floor(Math.random() * 360);
    const newRot = rotation + spins;
    setRotation(newRot);
    setTimeout(async () => {
      // Determine which segment we landed on
      const segAngle = 360 / topics.length;
      const landAngle = ((360 - (newRot % 360)) % 360);
      const idx = Math.floor(landAngle / segAngle) % topics.length;
      const topic = topics[idx];
      setChosenTopic(topic);
      setSpinning(false);
      // Load quiz for this topic
      setLoading(true);
      try {
        const res = await gamificationService.startSprintQuiz(topic.id);
        const d = res?.data || res;
        const qs = d?.questions || d || [];
        setQuestions(Array.isArray(qs) ? qs : []);
        setCurrentIdx(0); setScore(0); setXpEarned(0);
        setTimeLeft(QUIZ_DURATION); setAnswered(false); setSelected('');
        startRef.current = Date.now();
        setView('quiz');
      } catch { setView('quiz'); }
      finally { setLoading(false); }
    }, 3000);
  };

  const pickAnswer = async (opt: string) => {
    if (answered || !questions[currentIdx]) return;
    setSelected(opt); setAnswered(true);
    const q = questions[currentIdx];
    try {
      const res = await gamificationService.submitSprintAnswer({
        questionId: q.id, selectedOption: opt,
        timeTaken: Math.round((Date.now() - startRef.current) / 1000),
      });
      const d = res?.data || res;
      setWasCorrect(d?.correct ?? false);
      if (d?.correct) { setScore(s => s + 1); setXpEarned(x => x + (d?.xpAwarded ?? 10)); }
    } catch {}
    startRef.current = Date.now();
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) { setCurrentIdx(i => i + 1); setAnswered(false); setSelected(''); }
      else endQuiz();
    }, 700);
  };

  const endQuiz = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    markWeekW('spin'); setView('result');
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss2 = String(timeLeft % 60).padStart(2, '0');
  const q = questions[currentIdx];
  const segAngle = topics.length > 0 ? 360 / topics.length : 60;

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .spin-bg {
          min-height:calc(100vh - 64px); background:#f5e642;
          background-image:radial-gradient(circle at 20% 30%,#f7ec5a 0%,transparent 60%),
            radial-gradient(circle at 80% 70%,#e8d800 0%,transparent 60%);
          display:flex; flex-direction:column; align-items:center;
          padding:12px 16px; font-family:'Segoe UI',system-ui,sans-serif;
        }
        .spin-back { background:none; border:none; cursor:pointer; font-size:13px;
          font-weight:700; color:#5d4e00; padding:8px 0 16px; align-self:flex-start; }
        .spin-back:hover { color:#3a3000; }
        .spin-wheel-wrap {
          position:relative; width:280px; height:280px; margin:16px auto;
        }
        .spin-wheel-svg { width:100%; height:100%; filter:drop-shadow(0 6px 16px rgba(0,0,0,0.3)); }
        .spin-pointer {
          position:absolute; top:-8px; left:50%; transform:translateX(-50%);
          width:0; height:0;
          border-left:12px solid transparent; border-right:12px solid transparent;
          border-top:24px solid #c0392b;
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }
        .spin-hub {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:44px; height:44px; background:#2c3e50; border-radius:50%;
          border:4px solid #fff; display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:900; color:#fff; letter-spacing:0.5px;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        }
        .spin-btn {
          background:#c0392b; border:4px solid #922b21; border-radius:12px;
          padding:14px 48px; font-size:20px; font-weight:900; color:#fff;
          letter-spacing:3px; text-transform:uppercase; cursor:pointer;
          box-shadow:0 4px 12px rgba(192,57,43,0.4); transition:transform 0.15s,background 0.15s;
        }
        .spin-btn:hover:not(:disabled) { background:#a93226; transform:scale(1.04); }
        .spin-btn:disabled { opacity:.6; cursor:default; }
        .spin-topic-label { font-family:'Courier New',monospace; font-size:18px;
          font-weight:900; color:#2c3e50; text-align:center; background:rgba(255,255,255,0.7);
          border-radius:10px; padding:8px 20px; margin-bottom:8px; }
        /* Quiz inside spin */
        .spin-quiz-card { width:100%; max-width:400px; background:#5d3b1a;
          border-radius:16px; border:4px solid #3a2200; padding:20px;
          box-shadow:0 6px 20px rgba(0,0,0,0.3); }
        .spin-quiz-q { background:#8b6430; border-radius:10px; padding:14px;
          font-size:14px; font-weight:700; color:#fff5e0; margin-bottom:14px;
          min-height:60px; line-height:1.4; }
        .spin-ans-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .spin-ans-btn { background:#6aad5b; border:3px solid #3d7a35; border-radius:10px;
          padding:12px 8px; font-size:12px; font-weight:700; color:#fff;
          cursor:pointer; text-align:center; min-height:48px; display:flex;
          align-items:center; justify-content:center; line-height:1.3;
          transition:transform 0.1s,background 0.15s; }
        .spin-ans-btn:hover:not(:disabled) { transform:scale(1.03); background:#5a9a4c; }
        .spin-ans-btn:disabled { cursor:default; }
        .spin-ans-btn.correct { background:#27ae60; border-color:#1a7a40; }
        .spin-ans-btn.wrong   { background:#c0392b; border-color:#922b21; }
        .spin-timer { font-family:'Courier New',monospace; font-size:20px; font-weight:900;
          color:#f1c40f; letter-spacing:2px; text-align:right; margin-bottom:8px; }
        /* Result */
        .spin-result { width:100%; max-width:380px; }
        .spin-result-box { background:#2d7a3b; border-radius:16px; border:5px solid #1a5228;
          padding:24px; text-align:center;
          background-image:linear-gradient(45deg,rgba(0,0,0,.06) 25%,transparent 25%),
            linear-gradient(-45deg,rgba(0,0,0,.06) 25%,transparent 25%),
            linear-gradient(45deg,transparent 75%,rgba(0,0,0,.06) 75%),
            linear-gradient(-45deg,transparent 75%,rgba(0,0,0,.06) 75%);
          background-size:16px 16px; background-position:0 0,0 8px,8px -8px,-8px 0;
          background-color:#2d7a3b; }
        .spin-res-title { font-family:'Courier New',monospace; font-size:32px; font-weight:900;
          color:#f1c40f; text-shadow:3px 3px 0 rgba(0,0,0,0.5); letter-spacing:2px; }
        .spin-score-badge { display:inline-flex; align-items:center; justify-content:center;
          width:64px; height:64px; background:radial-gradient(circle,#f1c40f 60%,#f39c12 100%);
          border-radius:50%; font-size:28px; font-weight:900; color:#2c3e50;
          box-shadow:0 0 0 4px #fff,0 0 0 6px #f39c12,0 4px 12px rgba(0,0,0,.3);
          margin:12px auto 0; }
        .spin-again { background:none; border:none; cursor:pointer; font-size:14px;
          font-weight:900; color:#f1c40f; letter-spacing:1px; padding:12px 0 0;
          display:block; text-align:right; width:100%; text-transform:uppercase; }
        .spin-again:hover { color:#fff; }
      `}</style>

      <div className="spin-bg">
        {/* WHEEL VIEW */}
        {view === 'wheel' && (
          <>
            <button className="spin-back" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 24, fontWeight: 900, color: '#2c3e50', letterSpacing: 2, marginBottom: 4 }}>
              SPIN THE WHEEL
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#5d4e00', marginBottom: 8 }}>
              Spin to pick a topic, then answer a 5-min quiz!
            </div>

            {topics.length === 0 ? (
              <div style={{ padding: 32, color: '#5d4e00', fontWeight: 700 }}>Loading topics…</div>
            ) : (
              <>
                <div className="spin-wheel-wrap">
                  <svg
                    className="spin-wheel-svg"
                    viewBox="-1 -1 2 2"
                    style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.2,1)' : 'none' }}
                  >
                    {topics.map((topic, i) => {
                      const startA = (i * segAngle - 90) * Math.PI / 180;
                      const endA = ((i + 1) * segAngle - 90) * Math.PI / 180;
                      const x1 = Math.cos(startA); const y1 = Math.sin(startA);
                      const x2 = Math.cos(endA); const y2 = Math.sin(endA);
                      const large = segAngle > 180 ? 1 : 0;
                      const labelA = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
                      const lx = 0.65 * Math.cos(labelA); const ly = 0.65 * Math.sin(labelA);
                      const name = (topic.name || topic.title || '').substring(0, 10);
                      return (
                        <g key={i}>
                          <path d={`M0,0 L${x1},${y1} A1,1,0,${large},1,${x2},${y2} Z`}
                            fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#fff" strokeWidth="0.02" />
                          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                            fontSize="0.12" fontWeight="bold" fill="#fff"
                            transform={`rotate(${(i + 0.5) * segAngle}, ${lx}, ${ly})`}
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {name}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="0" cy="0" r="0.12" fill="#2c3e50" stroke="#fff" strokeWidth="0.02" />
                  </svg>
                  <div className="spin-pointer" />
                  <div className="spin-hub">Spin</div>
                </div>

                {chosenTopic && !spinning && (
                  <div className="spin-topic-label">Topic: {chosenTopic.name || chosenTopic.title}</div>
                )}

                <button className="spin-btn" onClick={spin} disabled={spinning || loading}>
                  {spinning ? 'SPINNING…' : loading ? 'LOADING…' : 'SPIN'}
                </button>
              </>
            )}
          </>
        )}

        {/* QUIZ VIEW */}
        {view === 'quiz' && (
          <>
            <button className="spin-back" onClick={() => { setView('wheel'); }}>◀ Back</button>
            {chosenTopic && (
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 14, fontWeight: 900, color: '#2c3e50', marginBottom: 8 }}>
                Topic: {chosenTopic.name || chosenTopic.title}
              </div>
            )}
            <div className="spin-quiz-card">
              <div className="spin-timer">{mm} : {ss2}</div>
              <div style={{ fontSize: 11, color: '#c9a87a', fontWeight: 700, marginBottom: 8 }}>
                Q{currentIdx + 1}/{questions.length} · Score: {score}
              </div>
              {q ? (
                <>
                  <div className="spin-quiz-q">{q.questionText}</div>
                  <div className="spin-ans-grid">
                    {([['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]] as [string, string][]).map(([key, label]) => {
                      let cls = 'spin-ans-btn';
                      if (answered) { if (key === selected && wasCorrect) cls += ' correct'; else if (key === selected) cls += ' wrong'; }
                      return <button key={key} className={cls} disabled={answered} onClick={() => pickAnswer(key)}>{label}</button>;
                    })}
                  </div>
                </>
              ) : (
                <div style={{ color: '#c9a87a', fontWeight: 700, textAlign: 'center', padding: 24 }}>No questions available.</div>
              )}
            </div>
          </>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && (
          <div className="spin-result">
            <button className="spin-back" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div style={{ textAlign: 'center', fontSize: 56, padding: '12px 0' }}>🏆</div>
            <div className="spin-result-box">
              <div className="spin-res-title">YOUR SCORE!</div>
              <div className="spin-score-badge">{score}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{xpEarned} XP gained</div>
            </div>
            <button className="spin-again" onClick={() => { setView('wheel'); setChosenTopic(null); }}>▶ SPIN AGAIN</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

