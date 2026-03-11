'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

const QUIZ_DURATION = 60; // 60 seconds
const PASS_SCORE = 6;

const WHEEL_TOPICS = ['Stack', 'Queue', 'Linked List', 'Tree', 'Graph', 'Hash Table', 'Heap', 'Trie'];
const WHEEL_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63'];

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const TOPIC_QUESTIONS: Record<string, Question[]> = {
  Stack: [
    { question: "What principle does a Stack follow?", options: ["FIFO", "LIFO", "LILO", "FILO"], correctAnswer: 1 },
    { question: "Which operation adds an element to a stack?", options: ["Enqueue", "Push", "Insert", "Append"], correctAnswer: 1 },
    { question: "Which operation removes the top element?", options: ["Dequeue", "Pop", "Delete", "Remove"], correctAnswer: 1 },
    { question: "What is the time complexity of push?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correctAnswer: 2 },
    { question: "Which is NOT a stack application?", options: ["Undo operation", "BFS traversal", "Function call stack", "Expression evaluation"], correctAnswer: 1 },
    { question: "What does peek do on a stack?", options: ["Remove top", "Add to top", "View top without removing", "Clear stack"], correctAnswer: 2 },
    { question: "A stack can be implemented using?", options: ["Only arrays", "Only linked lists", "Both arrays and linked lists", "Neither"], correctAnswer: 2 },
    { question: "What happens when you pop an empty stack?", options: ["Returns null", "Underflow", "Overflow", "Returns 0"], correctAnswer: 1 },
    { question: "Recursion uses which data structure internally?", options: ["Queue", "Stack", "Tree", "Graph"], correctAnswer: 1 },
    { question: "Infix to postfix conversion uses?", options: ["Queue", "Stack", "Heap", "Array"], correctAnswer: 1 },
  ],
  Queue: [
    { question: "What principle does a Queue follow?", options: ["LIFO", "FIFO", "LILO", "Random"], correctAnswer: 1 },
    { question: "Which operation adds to a queue?", options: ["Push", "Enqueue", "Insert", "Append"], correctAnswer: 1 },
    { question: "Which operation removes from a queue?", options: ["Pop", "Dequeue", "Delete", "Remove"], correctAnswer: 1 },
    { question: "BFS uses which data structure?", options: ["Stack", "Queue", "Heap", "Tree"], correctAnswer: 1 },
    { question: "A circular queue solves what problem?", options: ["Overflow", "Underflow", "Wasted space", "Sorting"], correctAnswer: 2 },
    { question: "In a priority queue, elements are served by?", options: ["Arrival order", "Priority", "Random", "Size"], correctAnswer: 1 },
    { question: "Double-ended queue is called?", options: ["Deque", "Stack", "Circular queue", "Priority queue"], correctAnswer: 0 },
    { question: "What is the front of a queue?", options: ["Last element", "First element", "Middle element", "Random"], correctAnswer: 1 },
    { question: "Queue overflow occurs when?", options: ["Queue is empty", "Queue is full", "Queue has one element", "Never"], correctAnswer: 1 },
    { question: "CPU scheduling uses?", options: ["Stack", "Queue", "Tree", "Graph"], correctAnswer: 1 },
  ],
  "Linked List": [
    { question: "Each node in a linked list contains?", options: ["Only data", "Data and pointer", "Only pointer", "Array"], correctAnswer: 1 },
    { question: "What is the head of a linked list?", options: ["Last node", "First node", "Middle node", "Null"], correctAnswer: 1 },
    { question: "Doubly linked list has pointers to?", options: ["Next only", "Prev only", "Next and prev", "None"], correctAnswer: 2 },
    { question: "Inserting at head of linked list is?", options: ["O(n)", "O(1)", "O(log n)", "O(n²)"], correctAnswer: 1 },
    { question: "Finding an element in linked list is?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: 2 },
    { question: "Last node in singly linked list points to?", options: ["Head", "Null", "Previous", "Self"], correctAnswer: 1 },
    { question: "Which is NOT a type of linked list?", options: ["Singly", "Doubly", "Circular", "Quaternary"], correctAnswer: 3 },
    { question: "Linked list vs array: advantage?", options: ["Random access", "Dynamic size", "Cache friendly", "Less memory"], correctAnswer: 1 },
    { question: "Circular linked list's last node points to?", options: ["Null", "Head", "Previous", "Self"], correctAnswer: 1 },
    { question: "Deleting a node requires?", options: ["Just removing data", "Updating pointers", "Shifting elements", "Rebuilding list"], correctAnswer: 1 },
  ],
  Tree: [
    { question: "A tree with no children is called?", options: ["Root", "Leaf", "Branch", "Node"], correctAnswer: 1 },
    { question: "Binary tree has at most how many children?", options: ["1", "2", "3", "Unlimited"], correctAnswer: 1 },
    { question: "The topmost node is called?", options: ["Leaf", "Root", "Branch", "Child"], correctAnswer: 1 },
    { question: "Inorder traversal of BST gives?", options: ["Random order", "Sorted order", "Reverse order", "Level order"], correctAnswer: 1 },
    { question: "Height of a tree with one node?", options: ["0", "1", "2", "-1"], correctAnswer: 0 },
    { question: "BST search time complexity (average)?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correctAnswer: 1 },
    { question: "A complete binary tree fills levels?", options: ["Right to left", "Left to right", "Random", "Bottom up"], correctAnswer: 1 },
    { question: "Preorder traversal visits root?", options: ["Last", "First", "Middle", "Random"], correctAnswer: 1 },
    { question: "AVL tree is a?", options: ["Balanced BST", "Unbalanced BST", "Heap", "Graph"], correctAnswer: 0 },
    { question: "Depth of root node?", options: ["1", "0", "-1", "Height"], correctAnswer: 1 },
  ],
  Graph: [
    { question: "A graph with directed edges is called?", options: ["Undirected", "Directed", "Weighted", "Complete"], correctAnswer: 1 },
    { question: "BFS uses which data structure?", options: ["Stack", "Queue", "Heap", "Array"], correctAnswer: 1 },
    { question: "DFS uses which data structure?", options: ["Queue", "Stack", "Heap", "Array"], correctAnswer: 1 },
    { question: "A graph with no cycles is called?", options: ["Cyclic", "Acyclic", "Complete", "Connected"], correctAnswer: 1 },
    { question: "Adjacency matrix space complexity?", options: ["O(V)", "O(E)", "O(V²)", "O(V+E)"], correctAnswer: 2 },
    { question: "Dijkstra's algorithm finds?", options: ["MST", "Shortest path", "Longest path", "All paths"], correctAnswer: 1 },
    { question: "A tree is a special case of?", options: ["Queue", "Stack", "Graph", "Array"], correctAnswer: 2 },
    { question: "Topological sort works on?", options: ["Undirected graphs", "DAGs", "Cyclic graphs", "Any graph"], correctAnswer: 1 },
    { question: "Degree of a vertex is?", options: ["Number of edges", "Number of vertices", "Weight of edges", "Path length"], correctAnswer: 0 },
    { question: "Kruskal's algorithm finds?", options: ["Shortest path", "MST", "Longest path", "Cycle"], correctAnswer: 1 },
  ],
  "Hash Table": [
    { question: "Hash table provides average lookup of?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correctAnswer: 2 },
    { question: "A hash collision occurs when?", options: ["Table is full", "Two keys map to same index", "Key not found", "Table is empty"], correctAnswer: 1 },
    { question: "Chaining resolves collisions using?", options: ["Arrays", "Linked lists", "Trees", "Stacks"], correctAnswer: 1 },
    { question: "Load factor is?", options: ["n/m", "m/n", "n*m", "n+m"], correctAnswer: 0 },
    { question: "Open addressing uses?", options: ["Extra memory", "Probing", "Chaining", "Trees"], correctAnswer: 1 },
    { question: "A good hash function distributes keys?", options: ["All to one slot", "Uniformly", "To first slot", "Randomly"], correctAnswer: 1 },
    { question: "Worst case hash table lookup?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: 2 },
    { question: "Linear probing suffers from?", options: ["Overflow", "Primary clustering", "Underflow", "No issues"], correctAnswer: 1 },
    { question: "Hash table is also called?", options: ["Map", "Dictionary", "Hash map", "All of these"], correctAnswer: 3 },
    { question: "Rehashing happens when?", options: ["Load factor too high", "Table empty", "No collisions", "Always"], correctAnswer: 0 },
  ],
  Heap: [
    { question: "A max-heap's root contains?", options: ["Minimum", "Maximum", "Median", "Random"], correctAnswer: 1 },
    { question: "Heap is typically implemented as?", options: ["Linked list", "Array", "Hash table", "Graph"], correctAnswer: 1 },
    { question: "Inserting into a heap is?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: 1 },
    { question: "Extracting max from max-heap is?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: 1 },
    { question: "Heap sort time complexity?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], correctAnswer: 1 },
    { question: "A min-heap's root contains?", options: ["Maximum", "Minimum", "Median", "Zero"], correctAnswer: 1 },
    { question: "Heapify operation is?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctAnswer: 2 },
    { question: "Priority queue is often implemented with?", options: ["Stack", "Queue", "Heap", "Array"], correctAnswer: 2 },
    { question: "In a heap, parent is at index?", options: ["i/2", "(i-1)/2", "2i", "2i+1"], correctAnswer: 1 },
    { question: "Building a heap from array is?", options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], correctAnswer: 1 },
  ],
  Trie: [
    { question: "Trie is also called?", options: ["Hash tree", "Prefix tree", "Binary tree", "B-tree"], correctAnswer: 1 },
    { question: "Trie is best for?", options: ["Sorting numbers", "String operations", "Graph traversal", "Heap operations"], correctAnswer: 1 },
    { question: "Each node in a trie represents?", options: ["A word", "A character", "A number", "A sentence"], correctAnswer: 1 },
    { question: "Search in trie is?", options: ["O(n)", "O(m) where m=key length", "O(log n)", "O(1)"], correctAnswer: 1 },
    { question: "Trie root typically contains?", options: ["First letter", "Empty/null", "Last letter", "Full word"], correctAnswer: 1 },
    { question: "Autocomplete uses?", options: ["Stack", "Queue", "Trie", "Heap"], correctAnswer: 2 },
    { question: "Trie space complexity is?", options: ["Low", "Can be high due to pointers", "O(1)", "Same as array"], correctAnswer: 1 },
    { question: "Inserting a word in trie is?", options: ["O(1)", "O(n)", "O(m) where m=word length", "O(n²)"], correctAnswer: 2 },
    { question: "Spell checkers often use?", options: ["Arrays", "Tries", "Stacks", "Queues"], correctAnswer: 1 },
    { question: "A compressed trie is called?", options: ["Radix tree", "B-tree", "Red-black tree", "Splay tree"], correctAnswer: 0 },
  ],
};

type View = 'wheel' | 'quiz' | 'result';

export default function SpinWheelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageId = Number(searchParams.get('stageId')) || 1;
  const { user } = useAuthStore();

  const [view, setView] = useState<View>('wheel');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [chosenTopic, setChosenTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (view !== 'quiz') return;
    if (timeLeft <= 0) { endQuiz(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [view, timeLeft]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    submittedRef.current = false;
    const spins = 5 * 360 + Math.floor(Math.random() * 360);
    const newRot = rotation + spins;
    setRotation(newRot);
    setTimeout(() => {
      const segAngle = 360 / WHEEL_TOPICS.length;
      const landAngle = ((360 - (newRot % 360)) % 360);
      const idx = Math.floor(landAngle / segAngle) % WHEEL_TOPICS.length;
      const topic = WHEEL_TOPICS[idx];
      setChosenTopic(topic);
      setSpinning(false);
      // Load questions for this topic
      const qs = TOPIC_QUESTIONS[topic] || TOPIC_QUESTIONS['Stack'];
      setQuestions(qs);
      setCurrentIdx(0);
      setScore(0);
      scoreRef.current = 0;
      setTimeLeft(QUIZ_DURATION);
      setAnswered(false);
      setSelected(null);
      setXpEarned(0);
      setView('quiz');
    }, 3000);
  };

  const pickAnswer = (optIndex: number) => {
    if (answered || !questions[currentIdx]) return;
    setSelected(optIndex);
    setAnswered(true);
    if (optIndex === questions[currentIdx].correctAnswer) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(i => i + 1);
        setAnswered(false);
        setSelected(null);
      } else {
        endQuiz();
      }
    }, 700);
  };

  const endQuiz = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const finalScore = scoreRef.current;
    setScore(finalScore);

    if (finalScore >= PASS_SCORE && user?.id && !submittedRef.current) {
      submittedRef.current = true;
      try {
        const res = await fetch('/api/gamification/complete-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, stageId, gameType: 'spin' }),
        });
        if (res.ok) {
          const data = await res.json();
          setXpEarned(data.data?.xpEarned ?? 100);
        } else { setXpEarned(100); }
      } catch { setXpEarned(100); }
    }
    setView('result');
  }, [user?.id, stageId]);

  const segAngle = 360 / WHEEL_TOPICS.length;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const q = questions[currentIdx];

  return (
    <DashboardLayout requiredRole="student">
      <style>{`
        .spin-bg { min-height:calc(100vh - 64px); background:#f5e642;
          background-image:radial-gradient(circle at 20% 30%,#f7ec5a 0%,transparent 60%),
          radial-gradient(circle at 80% 70%,#e8d800 0%,transparent 60%);
          display:flex; flex-direction:column; align-items:center;
          padding:12px 16px; font-family:'Segoe UI',system-ui,sans-serif; }
        .spin-back { background:none; border:none; cursor:pointer; font-size:13px;
          font-weight:700; color:#5d4e00; padding:8px 0 16px; align-self:flex-start; }
        .spin-back:hover { color:#3a3000; }
        .spin-wheel-wrap { position:relative; width:280px; height:280px; margin:16px auto; }
        .spin-wheel-svg { width:100%; height:100%; filter:drop-shadow(0 6px 16px rgba(0,0,0,0.3)); }
        .spin-pointer { position:absolute; top:-8px; left:50%; transform:translateX(-50%);
          width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent;
          border-top:24px solid #c0392b; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
        .spin-hub { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:44px; height:44px; background:#2c3e50; border-radius:50%;
          border:4px solid #fff; display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:900; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.4); }
        .spin-btn { background:#c0392b; border:4px solid #922b21; border-radius:12px;
          padding:14px 48px; font-size:20px; font-weight:900; color:#fff;
          letter-spacing:3px; text-transform:uppercase; cursor:pointer;
          box-shadow:0 4px 12px rgba(192,57,43,0.4); transition:transform 0.15s; }
        .spin-btn:hover:not(:disabled) { background:#a93226; transform:scale(1.04); }
        .spin-btn:disabled { opacity:.6; cursor:default; }
        .spin-quiz-card { width:100%; max-width:440px; background:#5d3b1a;
          border-radius:16px; border:4px solid #3a2200; padding:20px;
          box-shadow:0 6px 20px rgba(0,0,0,0.3); }
        .spin-quiz-q { background:#8b6430; border-radius:10px; padding:14px;
          font-size:14px; font-weight:700; color:#fff5e0; margin-bottom:14px; min-height:60px; }
        .spin-ans-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .spin-ans-btn { background:#6aad5b; border:3px solid #3d7a35; border-radius:10px;
          padding:12px 8px; font-size:12px; font-weight:700; color:#fff;
          cursor:pointer; text-align:center; min-height:48px; display:flex;
          align-items:center; justify-content:center; transition:transform 0.1s; }
        .spin-ans-btn:hover:not(:disabled) { transform:scale(1.03); background:#5a9a4c; }
        .spin-ans-btn:disabled { cursor:default; }
        .spin-ans-btn.correct { background:#27ae60; border-color:#1a7a40; }
        .spin-ans-btn.wrong { background:#c0392b; border-color:#922b21; }
        .spin-timer { font-family:'Courier New',monospace; font-size:20px; font-weight:900;
          color:#f1c40f; letter-spacing:2px; text-align:right; margin-bottom:8px; }
        .spin-result-box { background:#2d7a3b; border-radius:16px; border:5px solid #1a5228;
          padding:24px; text-align:center; }
        .spin-res-title { font-family:'Courier New',monospace; font-size:32px; font-weight:900;
          color:#f1c40f; text-shadow:3px 3px 0 rgba(0,0,0,0.5); }
        .spin-score-badge { display:inline-flex; align-items:center; justify-content:center;
          width:64px; height:64px; background:radial-gradient(circle,#f1c40f 60%,#f39c12 100%);
          border-radius:50%; font-size:28px; font-weight:900; color:#2c3e50;
          box-shadow:0 0 0 4px #fff,0 0 0 6px #f39c12; margin:12px auto 0; }
      `}</style>

      <div className="spin-bg">
        {/* WHEEL VIEW */}
        {view === 'wheel' && (
          <>
            <button className="spin-back" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 24, fontWeight: 900, color: '#2c3e50', letterSpacing: 2, marginBottom: 4 }}>
              SPIN THE WHEEL
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#5d4e00', marginBottom: 8 }}>
              Spin to pick a topic, answer 10 questions in 60s!
            </div>
            <div className="spin-wheel-wrap">
              <svg className="spin-wheel-svg" viewBox="-1 -1 2 2"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.2,1)' : 'none' }}>
                {WHEEL_TOPICS.map((topic, i) => {
                  const startA = (i * segAngle - 90) * Math.PI / 180;
                  const endA = ((i + 1) * segAngle - 90) * Math.PI / 180;
                  const x1 = Math.cos(startA), y1 = Math.sin(startA);
                  const x2 = Math.cos(endA), y2 = Math.sin(endA);
                  const large = segAngle > 180 ? 1 : 0;
                  const labelA = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
                  const lx = 0.65 * Math.cos(labelA), ly = 0.65 * Math.sin(labelA);
                  return (
                    <g key={i}>
                      <path d={`M0,0 L${x1},${y1} A1,1,0,${large},1,${x2},${y2} Z`}
                        fill={WHEEL_COLORS[i]} stroke="#fff" strokeWidth="0.02" />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        fontSize="0.1" fontWeight="bold" fill="#fff"
                        transform={`rotate(${(i + 0.5) * segAngle}, ${lx}, ${ly})`}>
                        {topic.slice(0, 10)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="spin-pointer" />
              <div className="spin-hub">SPIN</div>
            </div>
            {chosenTopic && !spinning && (
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 18, fontWeight: 900, color: '#2c3e50', background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 20px', marginBottom: 8 }}>
                Topic: {chosenTopic}
              </div>
            )}
            <button className="spin-btn" onClick={spin} disabled={spinning}>
              {spinning ? 'SPINNING…' : 'SPIN'}
            </button>
          </>
        )}

        {/* QUIZ VIEW */}
        {view === 'quiz' && (
          <>
            <button className="spin-back" onClick={() => setView('wheel')}>◀ Back to Wheel</button>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 14, fontWeight: 900, color: '#2c3e50', marginBottom: 8 }}>
              Topic: {chosenTopic}
            </div>
            <div className="spin-quiz-card">
              <div className="spin-timer">{mm} : {ss}</div>
              <div style={{ fontSize: 11, color: '#c9a87a', fontWeight: 700, marginBottom: 8 }}>
                Q{currentIdx + 1}/{questions.length} · Score: {score} · Need {PASS_SCORE} to pass
              </div>
              {q ? (
                <>
                  <div className="spin-quiz-q">{q.question}</div>
                  <div className="spin-ans-grid">
                    {q.options.map((opt, i) => {
                      let cls = 'spin-ans-btn';
                      if (answered && selected === i) {
                        cls += i === q.correctAnswer ? ' correct' : ' wrong';
                      }
                      if (answered && i === q.correctAnswer && selected !== i) {
                        cls += ' correct';
                      }
                      return (
                        <button key={i} className={cls} disabled={answered} onClick={() => pickAnswer(i)}>
                          {opt}
                        </button>
                      );
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
          <div style={{ width: '100%', maxWidth: 380 }}>
            <button className="spin-back" onClick={() => router.push('/student/gamification/arena')}>◀ Back to Arena</button>
            <div style={{ textAlign: 'center', fontSize: 56, padding: '12px 0' }}>{score >= PASS_SCORE ? '🏆' : '💪'}</div>
            <div className="spin-result-box">
              <div className="spin-res-title">{score >= PASS_SCORE ? 'PASSED!' : 'TRY AGAIN'}</div>
              <div className="spin-score-badge">{score}/{questions.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
                {score >= PASS_SCORE ? `+${xpEarned || 100} XP earned!` : `Need ${PASS_SCORE}+ to pass`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="spin-btn" style={{ flex: 1, padding: '12px 16px', fontSize: 14 }} onClick={() => { setView('wheel'); setChosenTopic(''); }}>
                SPIN AGAIN
              </button>
              <button className="spin-btn" style={{ flex: 1, padding: '12px 16px', fontSize: 14, background: '#27ae60', borderColor: '#1a7a40' }}
                onClick={() => router.push('/student/gamification/arena')}>
                ARENA
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
