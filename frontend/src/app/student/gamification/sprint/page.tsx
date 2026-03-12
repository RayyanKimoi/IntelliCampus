'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Which data structure follows LIFO?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "What is the time complexity of accessing an element in an array by index?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    correctAnswer: 2,
  },
  {
    id: 3,
    question: "Which data structure uses FIFO (First In First Out)?",
    options: ["Stack", "Tree", "Queue", "Graph"],
    correctAnswer: 2,
  },
  {
    id: 4,
    question: "In a linked list, what does each node contain?",
    options: ["Only data", "Data and a pointer to the next node", "Only a pointer", "An array of elements"],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "Which data structure is best for implementing a priority queue?",
    options: ["Array", "Stack", "Heap", "Linked List"],
    correctAnswer: 2,
  },
];

const TIMER_DURATION = 30;
const PASS_SCORE = 3;

function SprintQuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageId = Number(searchParams?.get('stageId')) || 1;
  const { user } = useAuthStore();

  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) { finishQuiz(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [started, timeLeft, finished]);

  const startQuiz = () => {
    setStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    scoreRef.current = 0;
    submittedRef.current = false;
    setTimeLeft(TIMER_DURATION);
    setFinished(false);
    setSelectedAnswer(null);
    setXpEarned(0);
  };

  const completeGame = useCallback(async (finalScore: number) => {
    if (submittedRef.current || !user?.id || finalScore < PASS_SCORE) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch('/api/gamification/complete-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, stageId, gameType: 'sprint' }),
      });
      if (res.ok) {
        const data = await res.json();
        setXpEarned(data.data?.xpEarned ?? 100);
      } else {
        setXpEarned(100);
      }
    } catch {
      setXpEarned(100);
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, stageId]);

  const finishQuiz = useCallback(() => {
    setFinished(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    const finalScore = scoreRef.current;
    completeGame(finalScore);
  }, [completeGame]);

  const selectAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === QUIZ_QUESTIONS[currentQuestion].correctAnswer;
    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <DashboardLayout requiredRole="student">
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/gamification/arena/background/grass-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-3xl w-full">
          {/* Setup Screen */}
          {!started && !finished && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 shadow-2xl text-white">
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-6xl">⚡</span>
                </div>
                <h1 className="text-4xl font-black mb-2">SPRINT QUIZ</h1>
                <p className="text-orange-100 text-lg">Data Structures Challenge</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-3xl font-bold">{QUIZ_QUESTIONS.length}</p><p className="text-sm text-orange-100">Questions</p></div>
                  <div><p className="text-3xl font-bold">{TIMER_DURATION}s</p><p className="text-sm text-orange-100">Time Limit</p></div>
                  <div><p className="text-3xl font-bold">100</p><p className="text-sm text-orange-100">XP Reward</p></div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm"><span className="text-2xl">🎯</span><span>Score at least {PASS_SCORE}/{QUIZ_QUESTIONS.length} to pass</span></div>
                <div className="flex items-center gap-3 text-sm"><span className="text-2xl">⏱️</span><span>Answer within {TIMER_DURATION} seconds</span></div>
                <div className="flex items-center gap-3 text-sm"><span className="text-2xl">⚡</span><span>Speed and accuracy are key!</span></div>
              </div>
              <button onClick={startQuiz} className="w-full bg-white text-orange-600 font-bold py-4 rounded-xl text-xl hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg">
                START SPRINT 🚀
              </button>
            </motion.div>
          )}

          {/* Quiz Screen */}
          {started && !finished && question && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white">
                    <p className="text-sm font-semibold">Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</p>
                    <div className="w-48 h-2 bg-white/30 rounded-full mt-2 overflow-hidden">
                      <motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                  <div className={cn("text-white text-3xl font-black px-6 py-2 rounded-full", timeLeft <= 10 ? "bg-red-600 animate-pulse" : "bg-white/20")}>
                    {timeLeft}s
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">{question.question}</h2>
                <div className="space-y-3">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === question.correctAnswer;
                    const showResult = selectedAnswer !== null;
                    return (
                      <motion.button key={index} onClick={() => selectAnswer(index)} disabled={selectedAnswer !== null}
                        whileHover={selectedAnswer === null ? { scale: 1.02 } : {}} whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                        className={cn(
                          "w-full text-left p-4 rounded-xl font-semibold transition-all border-2",
                          !showResult && "bg-gray-50 border-gray-200 hover:border-orange-400 hover:bg-orange-50",
                          showResult && !isSelected && !isCorrect && "bg-gray-50 border-gray-200 opacity-50",
                          showResult && isSelected && isCorrect && "bg-green-100 border-green-500 text-green-700",
                          showResult && isSelected && !isCorrect && "bg-red-100 border-red-500 text-red-700",
                          showResult && !isSelected && isCorrect && "bg-green-100 border-green-500 text-green-700"
                        )}>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            !showResult && "bg-gray-200 text-gray-600",
                            showResult && isCorrect && "bg-green-500 text-white",
                            showResult && isSelected && !isCorrect && "bg-red-500 text-white"
                          )}>{String.fromCharCode(65 + index)}</span>
                          <span className="flex-1">{option}</span>
                          {showResult && isCorrect && <span className="text-2xl">✓</span>}
                          {showResult && isSelected && !isCorrect && <span className="text-2xl">✗</span>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Screen */}
          {finished && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl text-white">
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-7xl">{score >= 4 ? "🏆" : score >= PASS_SCORE ? "🎉" : "💪"}</span>
                </div>
                <h1 className="text-4xl font-black mb-2">QUIZ COMPLETE!</h1>
                <p className="text-purple-100 text-lg">
                  {score >= 4 ? "Excellent Work!" : score >= PASS_SCORE ? "Great Job!" : "Keep Practicing!"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
                <div className="text-center mb-6">
                  <p className="text-5xl font-black mb-2">{score} / {QUIZ_QUESTIONS.length}</p>
                  <p className="text-purple-100">Correct Answers</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-3xl font-bold">{Math.round((score / QUIZ_QUESTIONS.length) * 100)}%</p>
                    <p className="text-sm text-purple-100">Accuracy</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-3xl font-bold">+{score >= PASS_SCORE ? (xpEarned || 100) : 0}</p>
                    <p className="text-sm text-purple-100">XP Earned</p>
                  </div>
                </div>
                {score >= PASS_SCORE ? (
                  <div className="mt-4 bg-green-500/20 border border-green-400 rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-green-100">✓ Game Completed! +100 XP</p>
                  </div>
                ) : (
                  <div className="mt-4 bg-orange-500/20 border border-orange-400 rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-orange-100">Need {PASS_SCORE}+ correct to pass. Try again!</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={startQuiz} className="flex-1 bg-white text-purple-600 font-bold py-4 rounded-xl hover:bg-purple-50 transition-all">
                  Try Again
                </button>
                <button onClick={() => router.push('/student/gamification/arena')} className="flex-1 bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition-all">
                  Back to Arena
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SprintQuizPage() {
  return (
    <Suspense fallback={null}>
      <SprintQuizPageInner />
    </Suspense>
  );
}
