'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gamificationService } from '@/services/gamificationService';
import { curriculumService } from '@/services/curriculumService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface SprintQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

type View = 'setup' | 'quiz' | 'result';

const DURATION = 120; // 2 minutes

function getISOWeekS(): string {
  const d = new Date();
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function markWeeklyComplete(key: string) {
  try {
    const wk = getISOWeekS();
    const raw = localStorage.getItem('ic-week-progress');
    const parsed = raw ? JSON.parse(raw) : { week: wk, completed: [] };
    if (parsed.week !== wk) parsed.completed = [];
    parsed.week = wk;
    if (!parsed.completed.includes(key)) parsed.completed.push(key);
    localStorage.setItem('ic-week-progress', JSON.stringify(parsed));
  } catch {}
}

export default function SprintQuizPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('setup');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState<SprintQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHighScore(parseInt(localStorage.getItem('sprint-high-score') || '0'));
    }
    loadTopics();
  }, []);

  useEffect(() => {
    if (view !== 'quiz') return;
    if (timeLeft <= 0) { endSprint(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view, timeLeft]);

  const loadTopics = async () => {
    try {
      const courses = await curriculumService.getCourses();
      const courseList = (courses as any)?.data || courses || [];
      const all: any[] = [];
      for (const c of (Array.isArray(courseList) ? courseList : [])) {
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

  const startSprint = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const res = await gamificationService.startSprintQuiz(selectedTopic);
      const d = res?.data || res;
      const qs = d?.questions || d || [];
      setQuestions(Array.isArray(qs) ? qs : []);
      setCurrentIdx(0); setScore(0); setXpEarned(0);
      setTimeLeft(DURATION); setAnswered(false); setSelected('');
      startTimeRef.current = Date.now();
      setView('quiz');
    } catch { setView('quiz'); }
    finally { setLoading(false); }
  };

  const pickAnswer = async (opt: string) => {
    if (answered || !questions[currentIdx]) return;
    setSelected(opt); setAnswered(true);
    const q = questions[currentIdx];
    try {
      const res = await gamificationService.submitSprintAnswer({
        questionId: q.id, selectedOption: opt,
        timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
      const d = res?.data || res;
      setWasCorrect(d?.correct ?? false);
      if (d?.correct) { setScore(s => s + 1); setXpEarned(x => x + (d?.xpAwarded ?? 10)); }
    } catch {}
    startTimeRef.current = Date.now();
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) { setCurrentIdx(i => i + 1); setAnswered(false); setSelected(''); }
      else endSprint();
    }, 700);
  };

  const endSprint = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setView('result');
    setScore(s => {
      if (s > highScore) {
        setHighScore(s);
        localStorage.setItem('sprint-high-score', String(s));
      }
      markWeeklyComplete('sprint');
      return s;
    });
  }, [highScore]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const q = questions[currentIdx];
  const opts = q ? [
    { key: 'A', label: q.optionA }, { key: 'B', label: q.optionB },
    { key: 'C', label: q.optionC }, { key: 'D', label: q.optionD },
  ] : [];

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .sprint-bg {
          min-height:calc(100vh - 64px); background:#c8a876;
          background-image: radial-gradient(circle at 30% 20%,#d4b88a 0%,transparent 60%),
            radial-gradient(circle at 70% 80%,#b8935a 0%,transparent 60%);
          display:flex; flex-direction:column; align-items:center;
          padding:12px 16px; font-family:'Segoe UI',system-ui,sans-serif;
        }
        .sprint-card { width:100%; max-width:400px; background:#f5d99a; border-radius:16px;
          border:3px solid #8b6914; box-shadow:0 6px 24px rgba(0,0,0,0.25); overflow:hidden; }
        .sprint-header { background:#e67e22; padding:8px 16px; display:flex; align-items:center;
          justify-content:space-between; border-bottom:3px solid #8b4a00; }
        .sprint-icon { width:40px; height:40px; background:#f39c12; border:3px solid #8b6914;
          border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; }
        .hi-score { background:#c0392b; color:#fff; font-size:11px; font-weight:900;
          letter-spacing:1px; padding:4px 12px; border-radius:4px; border:2px solid #922b21; }
        .timer-d { font-size:40px; font-weight:900; font-family:'Courier New',monospace;
          letter-spacing:4px; padding:16px 24px 8px;
          color:${timeLeft > 30 ? '#196f3d' : '#c0392b'};
          text-shadow:0 2px 0 rgba(0,0,0,0.15); }
        .timer-d.urgent { animation:tflash 0.5s infinite; }
        @keyframes tflash { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .sprog { height:6px; background:rgba(0,0,0,0.15); margin:0 16px 12px; border-radius:3px; overflow:hidden; }
        .sprog-fill { height:100%; background:linear-gradient(90deg,#27ae60,#f1c40f); border-radius:3px; transition:width 0.4s ease; }
        .sprint-q { background:#f1c40f; margin:0 12px 12px; border-radius:10px; padding:14px 16px;
          font-size:14px; font-weight:700; color:#2c3e50; min-height:60px; border:2px solid #d4ac0d; line-height:1.4; }
        .ans-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:0 12px 16px; }
        .ans-btn { background:#e67e22; border:3px solid #8b4a00; border-radius:10px;
          padding:12px 8px; font-size:12px; font-weight:700; color:#fff;
          cursor:pointer; transition:transform 0.1s,background 0.15s;
          text-align:center; min-height:48px; display:flex; align-items:center;
          justify-content:center; line-height:1.3; }
        .ans-btn:hover:not(:disabled) { transform:scale(1.04); background:#d35400; }
        .ans-btn:disabled { cursor:default; }
        .ans-btn.correct { background:#27ae60; border-color:#1a7a40; }
        .ans-btn.wrong   { background:#c0392b; border-color:#922b21; }
        .back-btn { background:none; border:none; cursor:pointer; font-size:13px;
          font-weight:700; color:#8b4a00; padding:8px 16px 12px; }
        .back-btn:hover { color:#5d3000; }
        .res-box { margin:8px 12px; border-radius:12px; padding:20px; text-align:center;
          border:5px solid #1b5e20; position:relative; overflow:hidden;
          background-color:#4caf50;
          background-image:linear-gradient(45deg,rgba(0,0,0,.08) 25%,transparent 25%),
            linear-gradient(-45deg,rgba(0,0,0,.08) 25%,transparent 25%),
            linear-gradient(45deg,transparent 75%,rgba(0,0,0,.08) 75%),
            linear-gradient(-45deg,transparent 75%,rgba(0,0,0,.08) 75%);
          background-size:16px 16px; background-position:0 0,0 8px,8px -8px,-8px 0; }
        .res-title { font-family:'Courier New',monospace; font-size:36px; font-weight:900;
          color:#fff; text-shadow:3px 3px 0 rgba(0,0,0,0.4); line-height:1; letter-spacing:2px; }
        .score-badge { display:inline-flex; align-items:center; justify-content:center;
          width:64px; height:64px; background:radial-gradient(circle,#f1c40f 60%,#f39c12 100%);
          border-radius:50%; font-size:28px; font-weight:900; color:#2c3e50;
          box-shadow:0 0 0 4px #fff,0 0 0 6px #f39c12,0 4px 12px rgba(0,0,0,.3);
          margin:12px auto 0; }
        .xp-txt { font-size:12px; font-weight:700; color:rgba(255,255,255,.85); margin-top:6px; }
        .play-again { background:none; border:none; cursor:pointer; font-size:14px;
          font-weight:900; color:#f1c40f; letter-spacing:1px; padding:8px 16px 16px;
          display:block; text-align:right; width:100%; text-transform:uppercase; }
        .play-again:hover { color:#fff; }
        .topic-select { width:100%; background:#f5d99a; border:3px solid #8b6914;
          border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:#2c3e50; }
        .start-btn { background:#e67e22; border:3px solid #8b4a00; border-radius:12px;
          padding:14px; font-size:18px; font-weight:900; color:#fff; cursor:pointer;
          letter-spacing:1px; transition:transform 0.1s,background 0.15s;
          text-transform:uppercase; width:100%; }
        .start-btn:hover:not(:disabled) { background:#d35400; transform:scale(1.02); }
        .start-btn:disabled { opacity:.6; cursor:default; }
      `}</style>

      <div className="sprint-bg">
        {/* SETUP */}
        {view === 'setup' && (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <button className="back-btn" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div className="sprint-card" style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 52 }}>🏆</div>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 24, fontWeight: 900, color: '#8b4a00', letterSpacing: 2 }}>SPRINT QUIZ</div>
                <div style={{ fontSize: 12, color: '#5d3000', fontWeight: 600, marginTop: 4 }}>Answer as many as you can in 2 minutes!</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#5d3000' }}>
                <span>⏱ 2 minute timer</span>
                <span>✅ +10 XP per correct answer</span>
                <span>🎯 Beat your High Score! (Current: {highScore})</span>
              </div>
              <select className="topic-select" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                {topics.length === 0 && <option value="">Loading topics…</option>}
                {topics.map(t => <option key={t.id} value={t.id}>{t.name || t.title}</option>)}
              </select>
              <div style={{ height: 12 }} />
              <button className="start-btn" onClick={startSprint} disabled={loading || !selectedTopic}>
                {loading ? 'Loading…' : '▶  START SPRINT'}
              </button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {view === 'quiz' && (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div className="sprint-card">
              <div className="sprint-header">
                <div className="sprint-icon">🏆</div>
                <div className="hi-score">HIGH SCORE : {highScore}S</div>
              </div>
              <div className={`timer-d${timeLeft <= 30 ? ' urgent' : ''}`}>{mm} : {ss}</div>
              <div style={{ padding: '0 24px 4px', fontSize: 11, color: '#8b4a00', fontWeight: 700 }}>
                Q{currentIdx + 1}/{questions.length} &nbsp;·&nbsp; Score: {score}
              </div>
              <div className="sprog"><div className="sprog-fill" style={{ width: `${(timeLeft / DURATION) * 100}%` }} /></div>
              {q ? (
                <>
                  <div className="sprint-q">{q.questionText}</div>
                  <div className="ans-grid">
                    {opts.map(o => {
                      let cls = 'ans-btn';
                      if (answered) { if (o.key === selected && wasCorrect) cls += ' correct'; else if (o.key === selected) cls += ' wrong'; }
                      return <button key={o.key} className={cls} disabled={answered} onClick={() => pickAnswer(o.key)}>{o.label}</button>;
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#5d3000', fontWeight: 700 }}>No questions available.</div>
              )}
              <button className="back-btn" onClick={() => setView('setup')}>◀ Back</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {view === 'result' && (
          <div style={{ width: '100%', maxWidth: 400 }}>
            <button className="back-btn" onClick={() => router.push('/student/gamification')}>◀ Back</button>
            <div className="sprint-card">
              <div className="sprint-header"><div className="sprint-icon">🏆</div></div>
              <div style={{ textAlign: 'center', padding: '24px 16px 8px', fontSize: 56 }}>
                {score >= highScore && score > 0 ? '🏆' : '🥈'}
              </div>
              <div className="res-box">
                <div className="res-title">{score >= highScore && score > 0 ? 'HIGH\nSCORE!' : 'TIME-\nOUT!'}</div>
                <div className="score-badge">{score}</div>
                <div className="xp-txt">{xpEarned} XP gained</div>
              </div>
              <button className="play-again" onClick={() => setView('setup')}>▶ PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
