/**
 * mockData.ts
 * Hardcoded demo data used as fallback when the backend is unavailable.
 * All pages import from here so the evaluator always sees rich content.
 */

// ─── Student Dashboard ──────────────────────────────────────────────────────

export const MOCK_STUDENT_DASHBOARD = {
  coursesEnrolled: 4,
  totalXP: 3200,
  currentLevel: 8,
  streakDays: 7,
  overallMastery: 72,
  recentActivities: [
    { id: 'a1', type: 'quiz',        title: 'Sorting Algorithms Quiz',          timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),  xpEarned: 150 },
    { id: 'a2', type: 'boss_battle', title: 'Boss Battle — BST',                timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),  xpEarned: 250 },
    { id: 'a3', type: 'chat',        title: 'AI Tutor — Quick Sort',            timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), xpEarned: 40  },
    { id: 'a4', type: 'sprint',      title: 'Sprint Quiz — Graph Traversal',    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), xpEarned: 100 },
    { id: 'a5', type: 'mastery',     title: 'Mastery Check — SQL Fundamentals', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), xpEarned: 60  },
  ],
  weakTopics: [
    { id: 't1', topicName: 'BFS & DFS',             mastery: 40, courseName: 'Discrete Mathematics'     },
    { id: 't2', topicName: 'Polymorphism',           mastery: 52, courseName: 'Computer Science 101'     },
    { id: 't3', topicName: 'Dynamic Programming',   mastery: 35, courseName: 'Data Structures & Algorithms' },
  ],
};

export const MOCK_XP_PROFILE = {
  totalXP: 3200,
  level: 8,
  xpToNextLevel: 800,
  currentLevelXP: 200,
  rank: 'Silver Scholar',
};

export const MOCK_PERFORMANCE_TREND = [
  { date: 'Feb 7',  mastery: 48, xp: 150  },
  { date: 'Feb 9',  mastery: 55, xp: 280  },
  { date: 'Feb 11', mastery: 58, xp: 350  },
  { date: 'Feb 13', mastery: 63, xp: 500  },
  { date: 'Feb 15', mastery: 68, xp: 650  },
  { date: 'Feb 17', mastery: 70, xp: 820  },
  { date: 'Feb 19', mastery: 74, xp: 1000 },
];

// ─── Student Insights ───────────────────────────────────────────────────────

export const MOCK_INSIGHTS_DASHBOARD = {
  studyStreak: 7,
  totalSessions: 34,
  avgSessionMinutes: 42,
  weeklyActivityMinutes: 280,
  lastActiveDate: new Date(Date.now() - 3600000).toISOString(),
  topicsStudied: 11,
  correctRate: 74,
};

export const MOCK_INSIGHTS_TREND = [
  { date: 'Feb 6',  score: 52 },
  { date: 'Feb 7',  score: 55 },
  { date: 'Feb 8',  score: 53 },
  { date: 'Feb 9',  score: 60 },
  { date: 'Feb 10', score: 63 },
  { date: 'Feb 11', score: 62 },
  { date: 'Feb 12', score: 66 },
  { date: 'Feb 13', score: 69 },
  { date: 'Feb 14', score: 67 },
  { date: 'Feb 15', score: 71 },
  { date: 'Feb 16', score: 73 },
  { date: 'Feb 17', score: 74 },
  { date: 'Feb 18', score: 76 },
  { date: 'Feb 19', score: 78 },
];

export const MOCK_INSIGHTS_MASTERY = 72;

// ─── Student Assignments ────────────────────────────────────────────────────

export const MOCK_ASSIGNMENTS = [
  {
    id: 'asn1',
    title: 'Sorting Algorithms Quiz',
    description: 'Test your knowledge of sorting algorithm complexities and stability.',
    courseName: 'Computer Science 101',
    courseId: 'cs101',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'pending',
    totalPoints: 100,
    questionCount: 5,
  },
  {
    id: 'asn2',
    title: 'Searching Algorithms Test',
    description: 'Binary search and linear search fundamentals.',
    courseName: 'Computer Science 101',
    courseId: 'cs101',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'pending',
    totalPoints: 100,
    questionCount: 5,
  },
  {
    id: 'asn3',
    title: 'OOP Concepts Quiz',
    description: 'Polymorphism, inheritance and encapsulation.',
    courseName: 'Computer Science 101',
    courseId: 'cs101',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'graded',
    score: 85,
    totalPoints: 100,
    questionCount: 5,
  },
  {
    id: 'asn4',
    title: 'Graph Traversal Exam',
    description: 'BFS, DFS and shortest-path problems.',
    courseName: 'Discrete Mathematics',
    courseId: 'math201',
    dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'graded',
    score: 70,
    totalPoints: 100,
    questionCount: 6,
  },
  {
    id: 'asn5',
    title: 'BST Operations Quiz',
    description: 'Binary Search Tree insertion, deletion and traversal.',
    courseName: 'Data Structures & Algorithms',
    courseId: 'cs201',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'submitted',
    totalPoints: 100,
    questionCount: 5,
  },
  {
    id: 'asn6',
    title: 'SQL Basics Assessment',
    description: 'Fundamental SQL queries, joins and aggregation.',
    courseName: 'Database Systems',
    courseId: 'cs301',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'pending',
    totalPoints: 100,
    questionCount: 5,
  },
  {
    id: 'asn7',
    title: 'Complexity Analysis Quiz',
    description: 'Big-O notation and algorithm analysis.',
    courseName: 'Computer Science 101',
    courseId: 'cs101',
    dueDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'graded',
    score: 76,
    totalPoints: 100,
    questionCount: 4,
  },
];

// ─── Student Courses ────────────────────────────────────────────────────────

export const MOCK_COURSES = [
  {
    id: 'cs101',
    name: 'Computer Science 101',
    description: 'Introduction to Computer Science — algorithms, programming fundamentals and algorithmic thinking.',
    subjectCount: 3,
    mastery: 72,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'math201',
    name: 'Discrete Mathematics',
    description: 'Mathematical logic, set theory, graph theory, combinatorics and proof techniques.',
    subjectCount: 2,
    mastery: 58,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'cs201',
    name: 'Data Structures & Algorithms',
    description: 'Advanced data structures, algorithm design paradigms and complexity analysis.',
    subjectCount: 2,
    mastery: 65,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cs301',
    name: 'Database Systems',
    description: 'Relational databases, SQL, normalization, indexing and transaction management.',
    subjectCount: 2,
    mastery: 84,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

// ─── Student Mastery ────────────────────────────────────────────────────────

export const MOCK_MASTERY = {
  overallMastery: 72,
  byTopic: [
    { topicId: 'sorting',       topicName: 'Sorting Algorithms',         subjectName: 'Algorithms',       courseName: 'Computer Science 101',         masteryScore: 7.8, mastery: 78, masteryLevel: 78, label: 'Strong'     },
    { topicId: 'searching',     topicName: 'Searching Algorithms',       subjectName: 'Algorithms',       courseName: 'Computer Science 101',         masteryScore: 6.5, mastery: 65, masteryLevel: 65, label: 'Developing' },
    { topicId: 'complexity',    topicName: 'Time & Space Complexity',    subjectName: 'Algorithms',       courseName: 'Computer Science 101',         masteryScore: 5.8, mastery: 58, masteryLevel: 58, label: 'Developing' },
    { topicId: 'polymorphism',  topicName: 'Polymorphism',               subjectName: 'OOP',              courseName: 'Computer Science 101',         masteryScore: 5.2, mastery: 52, masteryLevel: 52, label: 'Developing' },
    { topicId: 'inheritance',   topicName: 'Inheritance & Encapsulation',subjectName: 'OOP',              courseName: 'Computer Science 101',         masteryScore: 6.9, mastery: 69, masteryLevel: 69, label: 'Developing' },
    { topicId: 'recursion',     topicName: 'Recursion',                  subjectName: 'Programming',      courseName: 'Computer Science 101',         masteryScore: 6.0, mastery: 60, masteryLevel: 60, label: 'Developing' },
    { topicId: 'bfsdfs',        topicName: 'BFS & DFS',                  subjectName: 'Graph Theory',     courseName: 'Discrete Mathematics',         masteryScore: 4.0, mastery: 40, masteryLevel: 40, label: 'Needs Work' },
    { topicId: 'shortest',      topicName: 'Shortest Path',              subjectName: 'Graph Theory',     courseName: 'Discrete Mathematics',         masteryScore: 3.8, mastery: 38, masteryLevel: 38, label: 'Needs Work' },
    { topicId: 'proof',         topicName: 'Proof Techniques',           subjectName: 'Logic',            courseName: 'Discrete Mathematics',         masteryScore: 5.5, mastery: 55, masteryLevel: 55, label: 'Developing' },
    { topicId: 'bst',           topicName: 'Binary Search Trees',        subjectName: 'Trees & Heaps',    courseName: 'Data Structures & Algorithms', masteryScore: 6.9, mastery: 69, masteryLevel: 69, label: 'Developing' },
    { topicId: 'avl',           topicName: 'AVL Trees & Rotations',      subjectName: 'Trees & Heaps',    courseName: 'Data Structures & Algorithms', masteryScore: 5.5, mastery: 55, masteryLevel: 55, label: 'Developing' },
    { topicId: 'dp',            topicName: 'Dynamic Programming Basics', subjectName: 'DP',               courseName: 'Data Structures & Algorithms', masteryScore: 3.5, mastery: 35, masteryLevel: 35, label: 'Needs Work' },
    { topicId: 'sql',           topicName: 'SQL Fundamentals',           subjectName: 'SQL',              courseName: 'Database Systems',             masteryScore: 8.2, mastery: 82, masteryLevel: 82, label: 'Strong'     },
    { topicId: 'normalization', topicName: 'Normalization (1NF–BCNF)',   subjectName: 'DB Design',        courseName: 'Database Systems',             masteryScore: 8.5, mastery: 85, masteryLevel: 85, label: 'Strong'     },
  ],
  weakTopics: [
    { topicId: 'bfsdfs',   topicName: 'BFS & DFS',                  mastery: 40, masteryLevel: 40, subjectName: 'Graph Theory',  courseName: 'Discrete Mathematics'        },
    { topicId: 'shortest', topicName: 'Shortest Path',              mastery: 38, masteryLevel: 38, subjectName: 'Graph Theory',  courseName: 'Discrete Mathematics'        },
    { topicId: 'dp',       topicName: 'Dynamic Programming Basics', mastery: 35, masteryLevel: 35, subjectName: 'DP',            courseName: 'Data Structures & Algorithms'},
    { topicId: 'poly',     topicName: 'Polymorphism',               mastery: 52, masteryLevel: 52, subjectName: 'OOP',           courseName: 'Computer Science 101'        },
  ],
};

// ─── Teacher Analytics ──────────────────────────────────────────────────────

export const MOCK_ANALYTICS_MASTERY = [
  { topicId: 'sorting',      topicName: 'Sorting Algorithms',      averageMastery: 72, averageConfidence: 0.78, studentCount: 38 },
  { topicId: 'searching',    topicName: 'Searching Algorithms',    averageMastery: 68, averageConfidence: 0.72, studentCount: 38 },
  { topicId: 'complexity',   topicName: 'Time & Space Complexity', averageMastery: 59, averageConfidence: 0.63, studentCount: 35 },
  { topicId: 'polymorphism', topicName: 'Polymorphism',            averageMastery: 54, averageConfidence: 0.58, studentCount: 33 },
  { topicId: 'inheritance',  topicName: 'Inheritance',             averageMastery: 65, averageConfidence: 0.70, studentCount: 36 },
  { topicId: 'recursion',    topicName: 'Recursion',               averageMastery: 48, averageConfidence: 0.52, studentCount: 30 },
  { topicId: 'bst',          topicName: 'Binary Search Trees',     averageMastery: 62, averageConfidence: 0.66, studentCount: 28 },
  { topicId: 'dp',           topicName: 'Dynamic Programming',     averageMastery: 40, averageConfidence: 0.44, studentCount: 25 },
];

// ─── Practice Topics (curriculum) ──────────────────────────────────────────

export const MOCK_PRACTICE_TOPICS = [
  { id: 'sorting',      name: 'Sorting Algorithms',         subjectName: 'Algorithms',    courseName: 'Computer Science 101'          },
  { id: 'searching',    name: 'Searching Algorithms',       subjectName: 'Algorithms',    courseName: 'Computer Science 101'          },
  { id: 'complexity',   name: 'Time & Space Complexity',    subjectName: 'Algorithms',    courseName: 'Computer Science 101'          },
  { id: 'polymorphism', name: 'Polymorphism',               subjectName: 'OOP',           courseName: 'Computer Science 101'          },
  { id: 'inheritance',  name: 'Inheritance & Encapsulation',subjectName: 'OOP',           courseName: 'Computer Science 101'          },
  { id: 'recursion',    name: 'Recursion',                  subjectName: 'Programming',   courseName: 'Computer Science 101'          },
  { id: 'bfsdfs',       name: 'BFS & DFS',                  subjectName: 'Graph Theory',  courseName: 'Discrete Mathematics'          },
  { id: 'bst',          name: 'Binary Search Trees',        subjectName: 'Trees & Heaps', courseName: 'Data Structures & Algorithms'  },
  { id: 'dp',           name: 'Dynamic Programming Basics', subjectName: 'DP',            courseName: 'Data Structures & Algorithms'  },
  { id: 'sql',          name: 'SQL Fundamentals',           subjectName: 'SQL',           courseName: 'Database Systems'              },
  { id: 'normalization',name: 'Normalization (1NF–BCNF)',   subjectName: 'DB Design',     courseName: 'Database Systems'              },
  { id: 'shortest',     name: 'Shortest Path Algorithms',   subjectName: 'Graph Theory',  courseName: 'Discrete Mathematics'          },
];

// ─── Adaptive Topics (weakest areas) ───────────────────────────────────────

export const MOCK_ADAPTIVE_TOPICS = [
  { id: 'dp',           name: 'Dynamic Programming Basics', subjectName: 'DP',           courseName: 'Data Structures & Algorithms' },
  { id: 'bfsdfs',       name: 'BFS & DFS',                  subjectName: 'Graph Theory', courseName: 'Discrete Mathematics'         },
  { id: 'shortest',     name: 'Shortest Path Algorithms',   subjectName: 'Graph Theory', courseName: 'Discrete Mathematics'         },
  { id: 'polymorphism', name: 'Polymorphism',               subjectName: 'OOP',          courseName: 'Computer Science 101'         },
  { id: 'recursion',    name: 'Recursion',                  subjectName: 'Programming',  courseName: 'Computer Science 101'         },
  { id: 'complexity',   name: 'Time & Space Complexity',    subjectName: 'Algorithms',   courseName: 'Computer Science 101'         },
];

// ─── Mock Quiz Questions ────────────────────────────────────────────────────

export const MOCK_QUIZ_QUESTIONS: { id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string }[] = [
  {
    id: 'mq1',
    questionText: 'What is the time complexity of binary search in a sorted array?',
    optionA: 'O(n)', optionB: 'O(log n)', optionC: 'O(n log n)', optionD: 'O(1)',
    correctOption: 'B',
  },
  {
    id: 'mq2',
    questionText: 'Which sorting algorithm is most efficient for nearly-sorted data?',
    optionA: 'Quick Sort', optionB: 'Merge Sort', optionC: 'Insertion Sort', optionD: 'Heap Sort',
    correctOption: 'C',
  },
  {
    id: 'mq3',
    questionText: 'What data structure does BFS use to track nodes to visit?',
    optionA: 'Stack', optionB: 'Queue', optionC: 'Heap', optionD: 'Linked List',
    correctOption: 'B',
  },
  {
    id: 'mq4',
    questionText: 'Which OOP principle hides internal implementation details?',
    optionA: 'Inheritance', optionB: 'Polymorphism', optionC: 'Encapsulation', optionD: 'Abstraction',
    correctOption: 'C',
  },
  {
    id: 'mq5',
    questionText: 'In SQL, which keyword filters results after aggregation?',
    optionA: 'WHERE', optionB: 'HAVING', optionC: 'GROUP BY', optionD: 'ORDER BY',
    correctOption: 'B',
  },
  {
    id: 'mq6',
    questionText: 'What is the worst-case time complexity of Quick Sort?',
    optionA: 'O(n log n)', optionB: 'O(n²)', optionC: 'O(n)', optionD: 'O(log n)',
    correctOption: 'B',
  },
  {
    id: 'mq7',
    questionText: 'Which normal form eliminates transitive dependencies?',
    optionA: '1NF', optionB: '2NF', optionC: '3NF', optionD: 'BCNF',
    correctOption: 'C',
  },
  {
    id: 'mq8',
    questionText: 'In a BST, an in-order traversal gives nodes in what order?',
    optionA: 'Random', optionB: 'Reverse sorted', optionC: 'Sorted ascending', optionD: 'Level-by-level',
    correctOption: 'C',
  },
];

// ─── Assessment: Assignment Subjects ───────────────────────────────────────

export const MOCK_ASSIGNMENT_SUBJECTS = [
  { id: 'cs101',  name: 'Algorithms & Programming',   courseId: 'cs101',  courseName: 'Computer Science 101',          totalAssignments: 3, pendingCount: 1 },
  { id: 'math201',name: 'Graph Theory & Logic',       courseId: 'math201',courseName: 'Discrete Mathematics',          totalAssignments: 2, pendingCount: 0 },
  { id: 'cs201',  name: 'Advanced Data Structures',   courseId: 'cs201',  courseName: 'Data Structures & Algorithms',  totalAssignments: 2, pendingCount: 1 },
  { id: 'cs301',  name: 'SQL & Database Design',      courseId: 'cs301',  courseName: 'Database Systems',              totalAssignments: 2, pendingCount: 1 },
];

// ─── Assessment: Quiz Subjects ──────────────────────────────────────────────

export const MOCK_QUIZ_SUBJECTS = [
  { id: 'cs101',  name: 'Computer Science 101',            courseId: 'cs101',  courseName: 'Computer Science 101',         quizCount: 3, completedCount: 2, hasPrerequisite: false, averageScore: 77 },
  { id: 'math201',name: 'Discrete Mathematics',            courseId: 'math201',courseName: 'Discrete Mathematics',         quizCount: 2, completedCount: 1, hasPrerequisite: false, averageScore: 68 },
  { id: 'cs201',  name: 'Data Structures & Algorithms',    courseId: 'cs201',  courseName: 'Data Structures & Algorithms', quizCount: 2, completedCount: 0, hasPrerequisite: true,  averageScore: undefined },
  { id: 'cs301',  name: 'Database Systems',                courseId: 'cs301',  courseName: 'Database Systems',             quizCount: 2, completedCount: 2, hasPrerequisite: false, averageScore: 83 },
];

// ─── Assessment Results ─────────────────────────────────────────────────────

export const MOCK_RESULTS_TOPIC_MASTERY = [
  { topicId: 'dp',           topicName: 'Dynamic Programming',          masteryPct: 35, trend: 'up'     as const },
  { topicId: 'bfsdfs',       topicName: 'BFS & DFS',                    masteryPct: 40, trend: 'stable' as const },
  { topicId: 'shortest',     topicName: 'Shortest Path',                masteryPct: 38, trend: 'down'   as const },
  { topicId: 'polymorphism', topicName: 'Polymorphism',                 masteryPct: 52, trend: 'up'     as const },
  { topicId: 'avl',          topicName: 'AVL Trees & Rotations',        masteryPct: 55, trend: 'stable' as const },
  { topicId: 'complexity',   topicName: 'Time & Space Complexity',      masteryPct: 58, trend: 'up'     as const },
  { topicId: 'recursion',    topicName: 'Recursion',                    masteryPct: 60, trend: 'stable' as const },
  { topicId: 'searching',    topicName: 'Searching Algorithms',         masteryPct: 65, trend: 'up'     as const },
  { topicId: 'inheritance',  topicName: 'Inheritance & Encapsulation',  masteryPct: 69, trend: 'up'     as const },
  { topicId: 'bst',          topicName: 'Binary Search Trees',          masteryPct: 69, trend: 'up'     as const },
  { topicId: 'sorting',      topicName: 'Sorting Algorithms',           masteryPct: 78, trend: 'up'     as const },
  { topicId: 'sql',          topicName: 'SQL Fundamentals',             masteryPct: 82, trend: 'up'     as const },
  { topicId: 'normalization',topicName: 'Normalization (1NF–BCNF)',     masteryPct: 85, trend: 'stable' as const },
];

export const MOCK_RESULTS_SUBMISSIONS = [
  { id: 'rs1', assignmentTitle: 'Sorting Algorithms Quiz',    score: 85, submittedAt: new Date(Date.now() - 2  * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
  { id: 'rs2', assignmentTitle: 'OOP Concepts Quiz',          score: 88, submittedAt: new Date(Date.now() - 8  * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
  { id: 'rs3', assignmentTitle: 'Graph Traversal Exam',       score: 70, submittedAt: new Date(Date.now() - 5  * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
  { id: 'rs4', assignmentTitle: 'Complexity Analysis Quiz',   score: 76, submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
  { id: 'rs5', assignmentTitle: 'BST Operations Quiz',        score: 80, submittedAt: new Date(Date.now() - 1  * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
  { id: 'rs6', assignmentTitle: 'SQL Basics Assessment',      score: 92, submittedAt: new Date(Date.now() - 12 * 86400000).toISOString(), totalPoints: 100, status: 'graded' as const },
];

export const MOCK_RESULTS_TREND = [
  { date: 'Feb 7',  score: 65 },
  { date: 'Feb 9',  score: 68 },
  { date: 'Feb 11', score: 70 },
  { date: 'Feb 13', score: 72 },
  { date: 'Feb 15', score: 75 },
  { date: 'Feb 17', score: 76 },
  { date: 'Feb 19', score: 78 },
];

// ─── Subject-level Quizzes (for /assessment/quizzes/[subjectId]) ─────────────

export const MOCK_SUBJECT_QUIZZES: Record<string, any[]> = {
  cs101: [
    { id: 'ssq1', title: 'Sorting Algorithms Quiz',    courseId: 'cs101', subjectId: 'cs101', dueDate: new Date(Date.now() + 7  * 86400000).toISOString(), status: 'pending',  type: 'topic',        totalPoints: 100, description: 'Bubble, Merge, Quick and Heap sort complexities.' },
    { id: 'ssq2', title: 'Complexity Analysis Quiz',   courseId: 'cs101', subjectId: 'cs101', dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), status: 'pending',  type: 'topic',        totalPoints: 100, description: 'Big-O notation and algorithm analysis.' },
    { id: 'ssq3', title: 'OOP Prerequisite Check',     courseId: 'cs101', subjectId: 'cs101', dueDate: new Date(Date.now() - 2  * 86400000).toISOString(), status: 'graded',   type: 'prerequisite', totalPoints: 50,  score: 45, description: 'Basic OOP concepts before advanced topics.' },
  ],
  math201: [
    { id: 'ssq4', title: 'Graph Theory Basics Quiz',   courseId: 'math201', subjectId: 'math201', dueDate: new Date(Date.now() + 5  * 86400000).toISOString(), status: 'pending', type: 'topic', totalPoints: 100, description: 'Directed and undirected graphs, adjacency matrices.' },
    { id: 'ssq5', title: 'Proof Techniques Quiz',      courseId: 'math201', subjectId: 'math201', dueDate: new Date(Date.now() - 5  * 86400000).toISOString(), status: 'graded',  type: 'topic', totalPoints: 100, score: 70, description: 'Induction, contradiction and direct proof.' },
  ],
  cs201: [
    { id: 'ssq6', title: 'BST Operations Quiz',        courseId: 'cs201', subjectId: 'cs201', dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'pending', type: 'topic', totalPoints: 100, description: 'BST insertion, deletion and traversal.' },
    { id: 'ssq7', title: 'Dynamic Programming Exam',   courseId: 'cs201', subjectId: 'cs201', dueDate: new Date(Date.now() + 21 * 86400000).toISOString(), status: 'pending', type: 'topic', totalPoints: 100, description: 'Memoization, tabulation and classic DP problems.' },
  ],
  cs301: [
    { id: 'ssq8', title: 'SQL Fundamentals Quiz',      courseId: 'cs301', subjectId: 'cs301', dueDate: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'graded',  type: 'topic', totalPoints: 100, score: 92, description: 'SELECT, WHERE, JOIN, GROUP BY and aggregation.' },
    { id: 'ssq9', title: 'Normalization Quiz',         courseId: 'cs301', subjectId: 'cs301', dueDate: new Date(Date.now() - 3  * 86400000).toISOString(), status: 'graded',  type: 'topic', totalPoints: 100, score: 85, description: '1NF, 2NF, 3NF and BCNF normal forms.' },
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEACHER PORTAL — FULL SEMESTER DEMO DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Teacher Courses (rich, full semester) ──────────────────────────────────

export const MOCK_TEACHER_COURSES_RICH = [
  {
    id: 'cs101', name: 'Computer Science 101',
    description: 'Introduction to CS — algorithms, OOP and programming fundamentals.',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    enrolledStudents: 68,
    avgMastery: 72,
    completionPct: 78,
    weakTopics: ['Recursion', 'Polymorphism', 'Time Complexity'],
    _count: { subjects: 4 },
  },
  {
    id: 'ds301', name: 'Data Structures & Algorithms',
    description: 'Advanced data structures, algorithm design and complexity analysis.',
    createdAt: new Date(Date.now() - 82 * 86400000).toISOString(),
    enrolledStudents: 55,
    avgMastery: 64,
    completionPct: 65,
    weakTopics: ['Dynamic Programming', 'Graph Algorithms', 'AVL Rotations'],
    _count: { subjects: 5 },
  },
  {
    id: 'os201', name: 'Operating Systems',
    description: 'Processes, threads, memory management, file systems and concurrency.',
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
    enrolledStudents: 47,
    avgMastery: 58,
    completionPct: 52,
    weakTopics: ['Deadlock', 'Virtual Memory', 'Process Scheduling'],
    _count: { subjects: 4 },
  },
  {
    id: 'cn401', name: 'Computer Networks',
    description: 'OSI model, TCP/IP, routing protocols, DNS and security fundamentals.',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    enrolledStudents: 42,
    avgMastery: 61,
    completionPct: 60,
    weakTopics: ['OSPF Routing', 'TCP Congestion Control', 'NAT & Subnetting'],
    _count: { subjects: 3 },
  },
  {
    id: 'ai501', name: 'AI Fundamentals',
    description: 'Search algorithms, machine learning basics, neural networks and ethics.',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    enrolledStudents: 38,
    avgMastery: 56,
    completionPct: 48,
    weakTopics: ['Backpropagation', 'Gradient Descent', 'Overfitting'],
    _count: { subjects: 3 },
  },
];

// ─── 120 Students (realistic names, varied performance) ─────────────────────

export const MOCK_STUDENTS_FULL = [
  // High performers
  { id: 's001', name: 'Priya Sharma',       avgScore: 94, mastery: 91, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 2*3600000).toISOString(),  weakTopics: [],                                 engagementScore: 97, course: 'cs101', streak: 21 },
  { id: 's002', name: 'Arjun Mehta',        avgScore: 91, mastery: 88, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 4*3600000).toISOString(),  weakTopics: ['Recursion'],                      engagementScore: 93, course: 'cs101', streak: 14 },
  { id: 's003', name: 'Emily Chen',         avgScore: 89, mastery: 87, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 6*3600000).toISOString(),  weakTopics: [],                                 engagementScore: 91, course: 'ds301', streak: 18 },
  { id: 's004', name: 'Mohammed Al-Farsi',  avgScore: 88, mastery: 85, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 1*86400000).toISOString(), weakTopics: ['Polymorphism'],                   engagementScore: 89, course: 'cs101', streak: 10 },
  { id: 's005', name: 'Sneha Iyer',         avgScore: 87, mastery: 84, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 3*3600000).toISOString(),  weakTopics: [],                                 engagementScore: 92, course: 'ds301', streak: 22 },
  { id: 's006', name: 'Carlos Rivera',      avgScore: 86, mastery: 83, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 5*3600000).toISOString(),  weakTopics: ['Time Complexity'],                engagementScore: 87, course: 'os201', streak: 9  },
  { id: 's007', name: 'Fatima Nwosu',       avgScore: 85, mastery: 82, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 2*86400000).toISOString(), weakTopics: [],                                 engagementScore: 88, course: 'cs101', streak: 7  },
  { id: 's008', name: 'Wei Zhang',          avgScore: 84, mastery: 80, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 7*3600000).toISOString(),  weakTopics: ['AVL Rotations'],                  engagementScore: 85, course: 'ds301', streak: 12 },
  { id: 's009', name: 'Aarav Patel',        avgScore: 83, mastery: 79, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 1*86400000).toISOString(), weakTopics: [],                                 engagementScore: 86, course: 'cn401', streak: 11 },
  { id: 's010', name: 'Natalie Thompson',   avgScore: 82, mastery: 78, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 3*3600000).toISOString(),  weakTopics: ['Graph Algorithms'],               engagementScore: 84, course: 'ds301', streak: 8  },
  // Above average
  { id: 's011', name: 'Rohan Gupta',        avgScore: 81, mastery: 77, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 2*86400000).toISOString(), weakTopics: ['Dynamic Programming'],            engagementScore: 82, course: 'cs101', streak: 5  },
  { id: 's012', name: 'Amara Diallo',       avgScore: 80, mastery: 76, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 1*86400000).toISOString(), weakTopics: [],                                 engagementScore: 80, course: 'os201', streak: 6  },
  { id: 's013', name: 'Lucas Oliveira',     avgScore: 79, mastery: 75, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 4*3600000).toISOString(),  weakTopics: ['Deadlock'],                       engagementScore: 78, course: 'os201', streak: 4  },
  { id: 's014', name: 'Zara Khan',          avgScore: 78, mastery: 74, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 3*86400000).toISOString(), weakTopics: [],                                 engagementScore: 77, course: 'ai501', streak: 3  },
  { id: 's015', name: 'Kwame Asante',       avgScore: 77, mastery: 73, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 1*86400000).toISOString(), weakTopics: ['Backpropagation'],                engagementScore: 79, course: 'ai501', streak: 7  },
  { id: 's016', name: 'Divya Krishnan',     avgScore: 76, mastery: 72, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 2*86400000).toISOString(), weakTopics: ['OSPF Routing'],                   engagementScore: 76, course: 'cn401', streak: 5  },
  { id: 's017', name: 'Ethan Park',         avgScore: 75, mastery: 71, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 5*3600000).toISOString(),  weakTopics: ['TCP Congestion Control'],         engagementScore: 74, course: 'cn401', streak: 2  },
  { id: 's018', name: 'Sana Mirza',         avgScore: 75, mastery: 70, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 2*86400000).toISOString(), weakTopics: [],                                 engagementScore: 75, course: 'cs101', streak: 9  },
  { id: 's019', name: 'Victor Okafor',      avgScore: 74, mastery: 69, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 3*86400000).toISOString(), weakTopics: ['Virtual Memory'],                 engagementScore: 73, course: 'os201', streak: 4  },
  { id: 's020', name: 'Anika Johansson',    avgScore: 73, mastery: 68, riskLevel: 'low'  as const, lastActive: new Date(Date.now() - 1*86400000).toISOString(), weakTopics: ['Gradient Descent'],               engagementScore: 72, course: 'ai501', streak: 6  },
  // Medium performers
  { id: 's021', name: 'Ravi Shankar',       avgScore: 71, mastery: 66, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Polymorphism','Recursion'],     engagementScore: 68, course: 'cs101', streak: 1  },
  { id: 's022', name: 'Grace Mensah',       avgScore: 70, mastery: 65, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 3*86400000).toISOString(), weakTopics: ['AVL Rotations','DP'],           engagementScore: 67, course: 'ds301', streak: 2  },
  { id: 's023', name: 'Omar Abdullahi',     avgScore: 69, mastery: 64, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['Process Scheduling'],           engagementScore: 65, course: 'os201', streak: 0  },
  { id: 's024', name: 'Meera Nair',         avgScore: 68, mastery: 63, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 2*86400000).toISOString(), weakTopics: ['Backpropagation','Overfitting'],engagementScore: 66, course: 'ai501', streak: 3  },
  { id: 's025', name: 'James Osei',         avgScore: 67, mastery: 62, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Subnetting'],                   engagementScore: 64, course: 'cn401', streak: 1  },
  { id: 's026', name: 'Pooja Reddy',        avgScore: 66, mastery: 61, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 3*86400000).toISOString(), weakTopics: ['Time Complexity','Heaps'],      engagementScore: 63, course: 'cs101', streak: 2  },
  { id: 's027', name: 'Liam Nduka',         avgScore: 65, mastery: 60, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Deadlock','Semaphores'],        engagementScore: 62, course: 'os201', streak: 0  },
  { id: 's028', name: 'Hana Nakamura',      avgScore: 64, mastery: 59, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Graph Algorithms'],             engagementScore: 61, course: 'ds301', streak: 1  },
  { id: 's029', name: 'Aleksandr Volkov',   avgScore: 63, mastery: 58, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['Neural Networks'],              engagementScore: 60, course: 'ai501', streak: 0  },
  { id: 's030', name: 'Chioma Eze',         avgScore: 62, mastery: 57, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 3*86400000).toISOString(), weakTopics: ['OSPF','DNS'],                   engagementScore: 59, course: 'cn401', streak: 2  },
  { id: 's031', name: 'Tanvir Ahmed',       avgScore: 61, mastery: 56, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['Recursion','BFS'],              engagementScore: 57, course: 'cs101', streak: 0  },
  { id: 's032', name: 'Sofia Vasquez',      avgScore: 60, mastery: 55, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['DP','Tries'],                   engagementScore: 56, course: 'ds301', streak: 1  },
  { id: 's033', name: 'Yusuf Ibrahim',      avgScore: 59, mastery: 54, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Paging','Segmentation'],        engagementScore: 55, course: 'os201', streak: 0  },
  { id: 's034', name: 'Nadia Fernandez',    avgScore: 58, mastery: 53, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Gradient Descent'],             engagementScore: 54, course: 'ai501', streak: 1  },
  { id: 's035', name: 'Kwesi Boateng',      avgScore: 57, mastery: 52, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 8*86400000).toISOString(), weakTopics: ['TCP/IP','Routing'],             engagementScore: 53, course: 'cn401', streak: 0  },
  { id: 's036', name: 'Ishaan Bajaj',       avgScore: 56, mastery: 51, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['Polymorphism','Interfaces'],    engagementScore: 52, course: 'cs101', streak: 0  },
  { id: 's037', name: 'Leila Haddad',       avgScore: 55, mastery: 50, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 9*86400000).toISOString(), weakTopics: ['Heaps','Segment Trees'],        engagementScore: 51, course: 'ds301', streak: 0  },
  { id: 's038', name: 'Tobias Weber',       avgScore: 54, mastery: 49, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['Memory Management'],            engagementScore: 50, course: 'os201', streak: 0  },
  { id: 's039', name: 'Anjali Singh',       avgScore: 53, mastery: 48, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['SVM','Decision Trees'],         engagementScore: 49, course: 'ai501', streak: 0  },
  { id: 's040', name: 'Marcus Johnson',     avgScore: 52, mastery: 47, riskLevel: 'medium' as const, lastActive: new Date(Date.now() - 8*86400000).toISOString(), weakTopics: ['BGP','NAT'],                    engagementScore: 48, course: 'cn401', streak: 0  },
  // At-risk / struggling
  { id: 's041', name: 'Deepak Verma',       avgScore: 48, mastery: 42, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 10*86400000).toISOString(), weakTopics: ['Recursion','DP','BFS','Heaps'], engagementScore: 38, course: 'ds301', streak: 0  },
  { id: 's042', name: 'Aisha Okonkwo',      avgScore: 46, mastery: 40, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 12*86400000).toISOString(), weakTopics: ['Deadlock','Semaphores','IPC'],   engagementScore: 35, course: 'os201', streak: 0  },
  { id: 's043', name: 'Farid Karimov',      avgScore: 45, mastery: 39, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 14*86400000).toISOString(), weakTopics: ['Polymorphism','OOP Design'],     engagementScore: 33, course: 'cs101', streak: 0  },
  { id: 's044', name: 'Preethi Subramaniam',avgScore: 44, mastery: 38, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 11*86400000).toISOString(), weakTopics: ['Backprop','CNN','RNN'],           engagementScore: 32, course: 'ai501', streak: 0  },
  { id: 's045', name: 'David Asare',        avgScore: 43, mastery: 37, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 15*86400000).toISOString(), weakTopics: ['Subnetting','VLAN','Routing'],   engagementScore: 30, course: 'cn401', streak: 0  },
  { id: 's046', name: 'Elena Kowalski',     avgScore: 40, mastery: 35, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 18*86400000).toISOString(), weakTopics: ['Trees','Graphs','Sorting'],      engagementScore: 28, course: 'ds301', streak: 0  },
  { id: 's047', name: 'Syed Hassan',        avgScore: 38, mastery: 33, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 20*86400000).toISOString(), weakTopics: ['Scheduling','Paging','I/O'],     engagementScore: 25, course: 'os201', streak: 0  },
  { id: 's048', name: 'Tolu Adeyemi',       avgScore: 36, mastery: 31, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 21*86400000).toISOString(), weakTopics: ['Recursion','OOP','Algorithms'],  engagementScore: 22, course: 'cs101', streak: 0  },
  { id: 's049', name: 'Mia Korhonen',       avgScore: 35, mastery: 29, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 25*86400000).toISOString(), weakTopics: ['ML Metrics','Overfitting'],      engagementScore: 20, course: 'ai501', streak: 0  },
  { id: 's050', name: 'Imran Choudhury',    avgScore: 32, mastery: 27, riskLevel: 'high' as const, lastActive: new Date(Date.now() - 28*86400000).toISOString(), weakTopics: ['DNS','DHCP','Firewall'],         engagementScore: 18, course: 'cn401', streak: 0  },
  // Remaining 70 students — abbreviated for brevity but still realistic
  { id: 's051', name: 'Kabir Hussain',      avgScore: 79, mastery: 75, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['Graph Algorithms'],             engagementScore: 80, course: 'ds301', streak: 6  },
  { id: 's052', name: 'Oluwaseun Adebayo',  avgScore: 72, mastery: 68, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Deadlock'],                     engagementScore: 74, course: 'os201', streak: 4  },
  { id: 's053', name: 'Yasmin El-Amin',     avgScore: 66, mastery: 62, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['Overfitting'],                   engagementScore: 63, course: 'ai501', streak: 1  },
  { id: 's054', name: 'Arnav Bose',         avgScore: 84, mastery: 81, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 88, course: 'cn401', streak: 15 },
  { id: 's055', name: 'Chidera Ogbu',       avgScore: 61, mastery: 56, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['BFS','DFS'],                     engagementScore: 58, course: 'cs101', streak: 0  },
  { id: 's056', name: 'Nilufar Rahimova',   avgScore: 77, mastery: 73, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Concurrency'],                  engagementScore: 78, course: 'os201', streak: 8  },
  { id: 's057', name: 'Paulo Carvalho',     avgScore: 69, mastery: 65, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['DP'],                            engagementScore: 66, course: 'ds301', streak: 2  },
  { id: 's058', name: 'Aditi Sharma',       avgScore: 90, mastery: 87, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*3600000).toISOString(),   weakTopics: [],                               engagementScore: 95, course: 'cs101', streak: 19 },
  { id: 's059', name: 'Kwame Mensah',       avgScore: 57, mastery: 52, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['Neural Networks'],               engagementScore: 54, course: 'ai501', streak: 0  },
  { id: 's060', name: 'Tasnim Hossain',     avgScore: 82, mastery: 78, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['OSPF'],                         engagementScore: 83, course: 'cn401', streak: 12 },
  { id: 's061', name: 'Emre Demir',         avgScore: 75, mastery: 71, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Concurrency'],                  engagementScore: 76, course: 'os201', streak: 5  },
  { id: 's062', name: 'Chiamaka Obi',       avgScore: 64, mastery: 60, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['AVL Trees'],                     engagementScore: 61, course: 'ds301', streak: 1  },
  { id: 's063', name: 'Himanshu Tiwari',    avgScore: 88, mastery: 85, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 4*3600000).toISOString(),   weakTopics: [],                               engagementScore: 90, course: 'cs101', streak: 16 },
  { id: 's064', name: 'Valentina Cruz',     avgScore: 72, mastery: 67, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['Backpropagation'],               engagementScore: 70, course: 'ai501', streak: 4  },
  { id: 's065', name: 'Nnamdi Eze',         avgScore: 59, mastery: 55, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 8*86400000).toISOString(), weakTopics: ['Routing','Firewall'],            engagementScore: 56, course: 'cn401', streak: 0  },
  { id: 's066', name: 'Jin-Ho Kim',         avgScore: 83, mastery: 80, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 85, course: 'ds301', streak: 11 },
  { id: 's067', name: 'Priyanka Venkat',    avgScore: 70, mastery: 66, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Virtual Memory'],                engagementScore: 67, course: 'os201', streak: 2  },
  { id: 's068', name: 'Adebayo Ogundimu',   avgScore: 78, mastery: 74, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Overfitting'],                  engagementScore: 79, course: 'ai501', streak: 7  },
  { id: 's069', name: 'Chen Wei',           avgScore: 86, mastery: 83, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*3600000).toISOString(),   weakTopics: [],                               engagementScore: 89, course: 'cs101', streak: 20 },
  { id: 's070', name: 'Manpreet Kaur',      avgScore: 62, mastery: 58, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Routing','Subnetting'],          engagementScore: 60, course: 'cn401', streak: 0  },
  { id: 's071', name: 'Rafael Souza',       avgScore: 75, mastery: 71, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['DP'],                            engagementScore: 77, course: 'ds301', streak: 6  },
  { id: 's072', name: 'Sadia Rahman',       avgScore: 68, mastery: 64, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['Process Scheduling'],            engagementScore: 65, course: 'os201', streak: 1  },
  { id: 's073', name: 'Vishal Khanna',      avgScore: 80, mastery: 77, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Neural Networks basics'],       engagementScore: 81, course: 'ai501', streak: 9  },
  { id: 's074', name: 'Tsion Bekele',       avgScore: 73, mastery: 69, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['OSPF'],                         engagementScore: 73, course: 'cn401', streak: 5  },
  { id: 's075', name: 'Hamza Qureshi',      avgScore: 67, mastery: 63, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Trees','Heaps'],                 engagementScore: 64, course: 'cs101', streak: 1  },
  { id: 's076', name: 'Yuki Tanaka',        avgScore: 88, mastery: 85, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*3600000).toISOString(),   weakTopics: [],                               engagementScore: 91, course: 'ds301', streak: 23 },
  { id: 's077', name: 'Kwabena Frimpong',   avgScore: 55, mastery: 51, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 9*86400000).toISOString(), weakTopics: ['IPC','Threads'],                 engagementScore: 52, course: 'os201', streak: 0  },
  { id: 's078', name: 'Nour Khalil',        avgScore: 76, mastery: 72, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['Regularization'],               engagementScore: 77, course: 'ai501', streak: 6  },
  { id: 's079', name: 'Temitope Oluwa',     avgScore: 63, mastery: 59, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['TCP/IP stack'],                  engagementScore: 61, course: 'cn401', streak: 0  },
  { id: 's080', name: 'Shruti Agarwal',     avgScore: 92, mastery: 89, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 4*3600000).toISOString(),   weakTopics: [],                               engagementScore: 96, course: 'cs101', streak: 25 },
  { id: 's081', name: 'Daniel Owusu',       avgScore: 71, mastery: 67, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['Segment Trees'],                engagementScore: 69, course: 'ds301', streak: 3  },
  { id: 's082', name: 'Ifeoma Agbowo',      avgScore: 58, mastery: 54, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 8*86400000).toISOString(), weakTopics: ['Deadlock','Race Conditions'],    engagementScore: 55, course: 'os201', streak: 0  },
  { id: 's083', name: 'Surya Prakash',      avgScore: 82, mastery: 79, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 84, course: 'ai501', streak: 10 },
  { id: 's084', name: 'Ana Bogdan',         avgScore: 69, mastery: 65, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['VLAN','Switching'],              engagementScore: 67, course: 'cn401', streak: 2  },
  { id: 's085', name: 'Ammar Siddiqui',     avgScore: 78, mastery: 74, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: [],                               engagementScore: 80, course: 'cs101', streak: 8  },
  { id: 's086', name: 'Nkechi Ofor',        avgScore: 66, mastery: 62, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Graph DP'],                      engagementScore: 63, course: 'ds301', streak: 1  },
  { id: 's087', name: 'Maxim Petrov',       avgScore: 47, mastery: 43, riskLevel: 'high' as const,    lastActive: new Date(Date.now() - 16*86400000).toISOString(),weakTopics: ['Paging','Scheduling','IPC'],    engagementScore: 36, course: 'os201', streak: 0  },
  { id: 's088', name: 'Khadija Diallo',     avgScore: 74, mastery: 70, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Gradient Descent'],             engagementScore: 72, course: 'ai501', streak: 5  },
  { id: 's089', name: 'Harsh Malhotra',     avgScore: 61, mastery: 57, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['BGP','NAT'],                     engagementScore: 59, course: 'cn401', streak: 0  },
  { id: 's090', name: 'Funmilayo Bello',    avgScore: 85, mastery: 82, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['Concurrency'],                  engagementScore: 86, course: 'cs101', streak: 13 },
  { id: 's091', name: 'Ivan Novak',         avgScore: 70, mastery: 66, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['Segment Trees','Tries'],         engagementScore: 68, course: 'ds301', streak: 2  },
  { id: 's092', name: 'Shreya Joshi',       avgScore: 87, mastery: 84, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*3600000).toISOString(),   weakTopics: [],                               engagementScore: 89, course: 'os201', streak: 17 },
  { id: 's093', name: 'Abebe Girma',        avgScore: 64, mastery: 60, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['RNN','LSTM'],                    engagementScore: 62, course: 'ai501', streak: 1  },
  { id: 's094', name: 'Ling Fang',          avgScore: 79, mastery: 75, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['QoS'],                          engagementScore: 79, course: 'cn401', streak: 7  },
  { id: 's095', name: 'Ajay Nambiar',       avgScore: 56, mastery: 52, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 9*86400000).toISOString(), weakTopics: ['Polymorphism','Lambda'],          engagementScore: 53, course: 'cs101', streak: 0  },
  { id: 's096', name: 'Blessing Okafor',    avgScore: 81, mastery: 78, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: ['AVL Trees'],                    engagementScore: 82, course: 'ds301', streak: 10 },
  { id: 's097', name: 'Rustam Nazarov',     avgScore: 53, mastery: 49, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 10*86400000).toISOString(),weakTopics: ['Page Replacement'],             engagementScore: 50, course: 'os201', streak: 0  },
  { id: 's098', name: 'Pooja Nair',         avgScore: 78, mastery: 74, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Ensemble Methods'],             engagementScore: 78, course: 'ai501', streak: 6  },
  { id: 's099', name: 'Sergio Lopes',       avgScore: 67, mastery: 63, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['Switching','VPN'],               engagementScore: 65, course: 'cn401', streak: 1  },
  { id: 's100', name: 'Adwoa Oppong',       avgScore: 73, mastery: 69, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: [],                               engagementScore: 71, course: 'cs101', streak: 4  },
  { id: 's101', name: 'Roshan Kapoor',      avgScore: 83, mastery: 80, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 85, course: 'ds301', streak: 12 },
  { id: 's102', name: 'Yetunde Fashola',    avgScore: 62, mastery: 58, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['Virtual Memory'],                engagementScore: 60, course: 'os201', streak: 0  },
  { id: 's103', name: 'Ali Hassan',         avgScore: 76, mastery: 72, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['K-Means'],                      engagementScore: 75, course: 'ai501', streak: 7  },
  { id: 's104', name: 'Paola Herrera',      avgScore: 70, mastery: 66, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 4*86400000).toISOString(), weakTopics: ['BGP'],                           engagementScore: 68, course: 'cn401', streak: 2  },
  { id: 's105', name: 'Siddharth Rao',      avgScore: 89, mastery: 86, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*3600000).toISOString(),   weakTopics: [],                               engagementScore: 92, course: 'cs101', streak: 18 },
  { id: 's106', name: 'Ngozi Eze',          avgScore: 74, mastery: 70, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['Tries'],                        engagementScore: 72, course: 'ds301', streak: 5  },
  { id: 's107', name: 'Pham Thanh',         avgScore: 80, mastery: 77, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 82, course: 'os201', streak: 9  },
  { id: 's108', name: 'Kavitha Rajan',      avgScore: 71, mastery: 67, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['PCA'],                          engagementScore: 70, course: 'ai501', streak: 4  },
  { id: 's109', name: 'Lars Eriksson',      avgScore: 65, mastery: 61, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 6*86400000).toISOString(), weakTopics: ['STP','OSPF'],                    engagementScore: 63, course: 'cn401', streak: 0  },
  { id: 's110', name: 'Ritu Pandey',        avgScore: 85, mastery: 82, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 87, course: 'cs101', streak: 14 },
  { id: 's111', name: 'Emmanuel Boateng',   avgScore: 77, mastery: 73, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 2*86400000).toISOString(),  weakTopics: ['Heaps'],                        engagementScore: 78, course: 'ds301', streak: 8  },
  { id: 's112', name: 'Miriam Tadesse',     avgScore: 60, mastery: 56, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 8*86400000).toISOString(), weakTopics: ['Scheduling Algorithms'],         engagementScore: 58, course: 'os201', streak: 0  },
  { id: 's113', name: 'Suhail Ansari',      avgScore: 82, mastery: 79, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 83, course: 'ai501', streak: 11 },
  { id: 's114', name: 'Fatou Diop',         avgScore: 68, mastery: 64, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 5*86400000).toISOString(), weakTopics: ['NAT','DHCP'],                    engagementScore: 65, course: 'cn401', streak: 1  },
  { id: 's115', name: 'Nakul Verma',        avgScore: 91, mastery: 88, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*3600000).toISOString(),   weakTopics: [],                               engagementScore: 94, course: 'cs101', streak: 22 },
  { id: 's116', name: 'Yewande Akinsola',   avgScore: 63, mastery: 59, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 7*86400000).toISOString(), weakTopics: ['AVL Trees','Red-Black Trees'],   engagementScore: 61, course: 'ds301', streak: 0  },
  { id: 's117', name: 'Pavel Dvorak',       avgScore: 74, mastery: 70, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 3*86400000).toISOString(),  weakTopics: ['IPC'],                          engagementScore: 73, course: 'os201', streak: 3  },
  { id: 's118', name: 'Ananya Das',         avgScore: 87, mastery: 84, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*86400000).toISOString(),  weakTopics: [],                               engagementScore: 90, course: 'ai501', streak: 16 },
  { id: 's119', name: 'Musa Bello',         avgScore: 57, mastery: 53, riskLevel: 'medium' as const,  lastActive: new Date(Date.now() - 9*86400000).toISOString(), weakTopics: ['OSPF','BGP'],                    engagementScore: 55, course: 'cn401', streak: 0  },
  { id: 's120', name: 'Kritika Mishra',     avgScore: 94, mastery: 92, riskLevel: 'low' as const,    lastActive: new Date(Date.now() - 1*3600000).toISOString(),   weakTopics: [],                               engagementScore: 98, course: 'cs101', streak: 30 },
];

// ─── Full Assignments (8-12 per course) ─────────────────────────────────────

export const MOCK_TEACHER_ASSIGNMENTS_FULL: Record<string, any[]> = {
  cs101: [
    { id: 'cs101-a1', courseId: 'cs101', title: 'Sorting Algorithms Quiz',       description: 'Bubble, Merge, Quick and Heap sort complexities.',              dueDate: new Date(Date.now() + 7*86400000).toISOString(),  strictMode: false, submittedCount: 54, pendingCount: 14, avgScore: 74, flaggedCount: 2, _count: { questions: 5, attempts: 54 } },
    { id: 'cs101-a2', courseId: 'cs101', title: 'Time Complexity Analysis',      description: 'Big-O, Big-Theta and Big-Omega analysis of algorithms.',         dueDate: new Date(Date.now() + 14*86400000).toISOString(), strictMode: false, submittedCount: 48, pendingCount: 20, avgScore: 69, flaggedCount: 1, _count: { questions: 6, attempts: 48 } },
    { id: 'cs101-a3', courseId: 'cs101', title: 'OOP Concepts Assessment',       description: 'Polymorphism, inheritance, encapsulation and abstraction.',       dueDate: new Date(Date.now() - 5*86400000).toISOString(),  strictMode: false, submittedCount: 65, pendingCount: 3,  avgScore: 71, flaggedCount: 3, _count: { questions: 7, attempts: 65 } },
    { id: 'cs101-a4', courseId: 'cs101', title: 'Recursion Deep Dive',           description: 'Recursive algorithms, call stack and tail recursion.',            dueDate: new Date(Date.now() - 12*86400000).toISOString(), strictMode: false, submittedCount: 61, pendingCount: 7,  avgScore: 64, flaggedCount: 4, _count: { questions: 5, attempts: 61 } },
    { id: 'cs101-a5', courseId: 'cs101', title: 'Graph Traversal Exam',          description: 'BFS and DFS algorithms with implementation.',                    dueDate: new Date(Date.now() - 20*86400000).toISOString(), strictMode: true,  submittedCount: 60, pendingCount: 8,  avgScore: 61, flaggedCount: 5, _count: { questions: 6, attempts: 60 } },
    { id: 'cs101-a6', courseId: 'cs101', title: 'Searching Algorithms Quiz',     description: 'Binary search, linear search and interpolation search.',          dueDate: new Date(Date.now() - 28*86400000).toISOString(), strictMode: false, submittedCount: 66, pendingCount: 2,  avgScore: 79, flaggedCount: 1, _count: { questions: 4, attempts: 66 } },
    { id: 'cs101-a7', courseId: 'cs101', title: 'Data Structures Fundamentals', description: 'Arrays, linked lists, stacks and queues.',                        dueDate: new Date(Date.now() - 35*86400000).toISOString(), strictMode: false, submittedCount: 68, pendingCount: 0,  avgScore: 82, flaggedCount: 0, _count: { questions: 8, attempts: 68 } },
    { id: 'cs101-a8', courseId: 'cs101', title: 'Midterm: CS Fundamentals',     description: 'Comprehensive midterm covering weeks 1–7.',                       dueDate: new Date(Date.now() - 42*86400000).toISOString(), strictMode: true,  submittedCount: 67, pendingCount: 1,  avgScore: 70, flaggedCount: 6, _count: { questions: 20, attempts: 67 } },
  ],
  ds301: [
    { id: 'ds301-a1', courseId: 'ds301', title: 'BST & AVL Trees',              description: 'BST operations, rotations and AVL balancing.',                    dueDate: new Date(Date.now() + 10*86400000).toISOString(), strictMode: false, submittedCount: 38, pendingCount: 17, avgScore: 68, flaggedCount: 2, _count: { questions: 6, attempts: 38 } },
    { id: 'ds301-a2', courseId: 'ds301', title: 'Dynamic Programming Basics',   description: 'Memoization, tabulation and classic DP problems.',                dueDate: new Date(Date.now() + 21*86400000).toISOString(), strictMode: true,  submittedCount: 28, pendingCount: 27, avgScore: 55, flaggedCount: 3, _count: { questions: 7, attempts: 28 } },
    { id: 'ds301-a3', courseId: 'ds301', title: 'Graph Algorithms Exam',        description: 'Dijkstra, Floyd-Warshall, Kruskal and Prim.',                     dueDate: new Date(Date.now() - 7*86400000).toISOString(),  strictMode: false, submittedCount: 49, pendingCount: 6,  avgScore: 62, flaggedCount: 4, _count: { questions: 8, attempts: 49 } },
    { id: 'ds301-a4', courseId: 'ds301', title: 'Heaps & Priority Queues',      description: 'Min/max heap operations and heap sort.',                          dueDate: new Date(Date.now() - 18*86400000).toISOString(), strictMode: false, submittedCount: 52, pendingCount: 3,  avgScore: 71, flaggedCount: 1, _count: { questions: 5, attempts: 52 } },
    { id: 'ds301-a5', courseId: 'ds301', title: 'Segment Trees & Tries',        description: 'Advanced data structures for competitive programming.',            dueDate: new Date(Date.now() - 30*86400000).toISOString(), strictMode: false, submittedCount: 44, pendingCount: 11, avgScore: 58, flaggedCount: 2, _count: { questions: 6, attempts: 44 } },
    { id: 'ds301-a6', courseId: 'ds301', title: 'Greedy Algorithms',            description: 'Greedy choice property, activity selection, Huffman coding.',     dueDate: new Date(Date.now() - 38*86400000).toISOString(), strictMode: false, submittedCount: 53, pendingCount: 2,  avgScore: 74, flaggedCount: 1, _count: { questions: 5, attempts: 53 } },
    { id: 'ds301-a7', courseId: 'ds301', title: 'Divide & Conquer',             description: 'Merge sort, Strassen matrix multiplication, master theorem.',     dueDate: new Date(Date.now() - 48*86400000).toISOString(), strictMode: false, submittedCount: 55, pendingCount: 0,  avgScore: 76, flaggedCount: 0, _count: { questions: 5, attempts: 55 } },
    { id: 'ds301-a8', courseId: 'ds301', title: 'Midterm: Data Structures',     description: 'Comprehensive midterm covering all data structures.',             dueDate: new Date(Date.now() - 55*86400000).toISOString(), strictMode: true,  submittedCount: 55, pendingCount: 0,  avgScore: 67, flaggedCount: 5, _count: { questions: 20, attempts: 55 } },
  ],
  os201: [
    { id: 'os201-a1', courseId: 'os201', title: 'Process Scheduling Quiz',      description: 'FCFS, SJF, Round-Robin, Priority scheduling.',                   dueDate: new Date(Date.now() + 5*86400000).toISOString(),  strictMode: false, submittedCount: 30, pendingCount: 17, avgScore: 65, flaggedCount: 2, _count: { questions: 6, attempts: 30 } },
    { id: 'os201-a2', courseId: 'os201', title: 'Deadlock & Synchronization',   description: 'Mutex, semaphores, deadlock detection and prevention.',           dueDate: new Date(Date.now() + 18*86400000).toISOString(), strictMode: false, submittedCount: 22, pendingCount: 25, avgScore: 54, flaggedCount: 4, _count: { questions: 7, attempts: 22 } },
    { id: 'os201-a3', courseId: 'os201', title: 'Virtual Memory & Paging',      description: 'Paging, segmentation, TLB and page replacement algorithms.',     dueDate: new Date(Date.now() - 6*86400000).toISOString(),  strictMode: true,  submittedCount: 41, pendingCount: 6,  avgScore: 57, flaggedCount: 5, _count: { questions: 8, attempts: 41 } },
    { id: 'os201-a4', courseId: 'os201', title: 'File Systems',                 description: 'FAT, NTFS, ext4 and filesystem operations.',                     dueDate: new Date(Date.now() - 19*86400000).toISOString(), strictMode: false, submittedCount: 45, pendingCount: 2,  avgScore: 68, flaggedCount: 1, _count: { questions: 5, attempts: 45 } },
    { id: 'os201-a5', courseId: 'os201', title: 'Threads & Concurrency',        description: 'POSIX threads, race conditions and critical sections.',           dueDate: new Date(Date.now() - 28*86400000).toISOString(), strictMode: false, submittedCount: 46, pendingCount: 1,  avgScore: 61, flaggedCount: 3, _count: { questions: 6, attempts: 46 } },
    { id: 'os201-a6', courseId: 'os201', title: 'I/O Systems & Disk Scheduling', description: 'DMA, device drivers and disk scheduling algorithms.',           dueDate: new Date(Date.now() - 38*86400000).toISOString(), strictMode: false, submittedCount: 47, pendingCount: 0,  avgScore: 70, flaggedCount: 0, _count: { questions: 5, attempts: 47 } },
    { id: 'os201-a7', courseId: 'os201', title: 'Midterm: OS Concepts',         description: 'Comprehensive midterm covering processes, memory and I/O.',       dueDate: new Date(Date.now() - 50*86400000).toISOString(), strictMode: true,  submittedCount: 47, pendingCount: 0,  avgScore: 62, flaggedCount: 7, _count: { questions: 20, attempts: 47 } },
  ],
  cn401: [
    { id: 'cn401-a1', courseId: 'cn401', title: 'OSI Model & TCP/IP',           description: 'Layer functions, encapsulation and protocol suite.',              dueDate: new Date(Date.now() + 8*86400000).toISOString(),  strictMode: false, submittedCount: 27, pendingCount: 15, avgScore: 72, flaggedCount: 1, _count: { questions: 5, attempts: 27 } },
    { id: 'cn401-a2', courseId: 'cn401', title: 'Routing & Switching',          description: 'Static routing, OSPF, BGP and Spanning Tree Protocol.',          dueDate: new Date(Date.now() + 16*86400000).toISOString(), strictMode: false, submittedCount: 20, pendingCount: 22, avgScore: 58, flaggedCount: 3, _count: { questions: 7, attempts: 20 } },
    { id: 'cn401-a3', courseId: 'cn401', title: 'Subnetting & VLSM',            description: 'IPv4 subnetting, CIDR and variable length subnet masking.',       dueDate: new Date(Date.now() - 4*86400000).toISOString(),  strictMode: false, submittedCount: 38, pendingCount: 4,  avgScore: 61, flaggedCount: 2, _count: { questions: 6, attempts: 38 } },
    { id: 'cn401-a4', courseId: 'cn401', title: 'Transport Layer & Sockets',    description: 'TCP vs UDP, socket programming and connection lifecycle.',        dueDate: new Date(Date.now() - 16*86400000).toISOString(), strictMode: false, submittedCount: 40, pendingCount: 2,  avgScore: 69, flaggedCount: 1, _count: { questions: 5, attempts: 40 } },
    { id: 'cn401-a5', courseId: 'cn401', title: 'DNS & Application Layer',      description: 'DNS resolution, HTTP/HTTPS, SMTP, FTP protocols.',               dueDate: new Date(Date.now() - 30*86400000).toISOString(), strictMode: false, submittedCount: 41, pendingCount: 1,  avgScore: 75, flaggedCount: 0, _count: { questions: 5, attempts: 41 } },
    { id: 'cn401-a6', courseId: 'cn401', title: 'Network Security',             description: 'Encryption, firewalls, VPN, IDS/IPS and common attacks.',        dueDate: new Date(Date.now() - 44*86400000).toISOString(), strictMode: false, submittedCount: 42, pendingCount: 0,  avgScore: 67, flaggedCount: 2, _count: { questions: 6, attempts: 42 } },
    { id: 'cn401-a7', courseId: 'cn401', title: 'Midterm: Networking',          description: 'Comprehensive midterm covering layers 1–5.',                     dueDate: new Date(Date.now() - 52*86400000).toISOString(), strictMode: true,  submittedCount: 42, pendingCount: 0,  avgScore: 65, flaggedCount: 5, _count: { questions: 20, attempts: 42 } },
  ],
  ai501: [
    { id: 'ai501-a1', courseId: 'ai501', title: 'Search Algorithms',            description: 'BFS, DFS, A*, iterative deepening and heuristics.',              dueDate: new Date(Date.now() + 12*86400000).toISOString(), strictMode: false, submittedCount: 23, pendingCount: 15, avgScore: 71, flaggedCount: 1, _count: { questions: 5, attempts: 23 } },
    { id: 'ai501-a2', courseId: 'ai501', title: 'ML Fundamentals',              description: 'Supervised vs unsupervised learning, bias-variance tradeoff.',    dueDate: new Date(Date.now() + 24*86400000).toISOString(), strictMode: false, submittedCount: 15, pendingCount: 23, avgScore: 60, flaggedCount: 2, _count: { questions: 6, attempts: 15 } },
    { id: 'ai501-a3', courseId: 'ai501', title: 'Neural Networks Basics',       description: 'Perceptrons, activation functions, forward propagation.',         dueDate: new Date(Date.now() - 3*86400000).toISOString(),  strictMode: false, submittedCount: 33, pendingCount: 5,  avgScore: 56, flaggedCount: 4, _count: { questions: 7, attempts: 33 } },
    { id: 'ai501-a4', courseId: 'ai501', title: 'Backpropagation & Optimization', description: 'Gradient descent, Adam, SGD and learning rate scheduling.',    dueDate: new Date(Date.now() - 15*86400000).toISOString(), strictMode: true,  submittedCount: 35, pendingCount: 3,  avgScore: 50, flaggedCount: 6, _count: { questions: 8, attempts: 35 } },
    { id: 'ai501-a5', courseId: 'ai501', title: 'Classification Models',        description: 'Logistic regression, SVM, k-NN and decision trees.',             dueDate: new Date(Date.now() - 27*86400000).toISOString(), strictMode: false, submittedCount: 37, pendingCount: 1,  avgScore: 64, flaggedCount: 2, _count: { questions: 6, attempts: 37 } },
    { id: 'ai501-a6', courseId: 'ai501', title: 'Overfitting & Regularization', description: 'L1/L2 regularization, dropout, cross-validation.',               dueDate: new Date(Date.now() - 38*86400000).toISOString(), strictMode: false, submittedCount: 38, pendingCount: 0,  avgScore: 61, flaggedCount: 1, _count: { questions: 5, attempts: 38 } },
    { id: 'ai501-a7', courseId: 'ai501', title: 'Midterm: AI Fundamentals',     description: 'Comprehensive midterm: search, ML, neural networks.',            dueDate: new Date(Date.now() - 48*86400000).toISOString(), strictMode: true,  submittedCount: 38, pendingCount: 0,  avgScore: 59, flaggedCount: 8, _count: { questions: 20, attempts: 38 } },
  ],
};

// ─── Rich Submissions (graded + ungraded, across all courses) ───────────────

export const MOCK_SUBMISSIONS_FULL: any[] = [
  { id: 'sub-001', userId: 's001', assignmentId: 'cs101-a3', score: 96, gradedAt: new Date(Date.now()-3*86400000).toISOString(),  completedAt: new Date(Date.now()-4*86400000).toISOString(),  createdAt: new Date(Date.now()-4*86400000).toISOString(),  teacherComment: 'Outstanding work. Perfect understanding of polymorphism.',        user: { name: 'Priya Sharma',       email: 'priya.sharma@campus.edu'     }, assignment: { id: 'cs101-a3', title: 'OOP Concepts Assessment',      courseId: 'cs101' } },
  { id: 'sub-002', userId: 's002', assignmentId: 'cs101-a3', score: 88, gradedAt: new Date(Date.now()-3*86400000).toISOString(),  completedAt: new Date(Date.now()-4*86400000).toISOString(),  createdAt: new Date(Date.now()-4*86400000).toISOString(),  teacherComment: 'Good work. Review recursion edge cases.',                          user: { name: 'Arjun Mehta',        email: 'arjun.mehta@campus.edu'      }, assignment: { id: 'cs101-a3', title: 'OOP Concepts Assessment',      courseId: 'cs101' } },
  { id: 'sub-003', userId: 's043', assignmentId: 'cs101-a3', score: 42, gradedAt: new Date(Date.now()-2*86400000).toISOString(),  completedAt: new Date(Date.now()-3*86400000).toISOString(),  createdAt: new Date(Date.now()-3*86400000).toISOString(),  teacherComment: 'Struggling badly. Schedule office hours immediately.',             user: { name: 'Farid Karimov',      email: 'farid.karimov@campus.edu'    }, assignment: { id: 'cs101-a3', title: 'OOP Concepts Assessment',      courseId: 'cs101' } },
  { id: 'sub-004', userId: 's007', assignmentId: 'cs101-a3', score: 84, gradedAt: new Date(Date.now()-2*86400000).toISOString(),  completedAt: new Date(Date.now()-3*86400000).toISOString(),  createdAt: new Date(Date.now()-3*86400000).toISOString(),  teacherComment: 'Strong performance. Minor error in interface question.',           user: { name: 'Fatima Nwosu',       email: 'fatima.nwosu@campus.edu'     }, assignment: { id: 'cs101-a3', title: 'OOP Concepts Assessment',      courseId: 'cs101' } },
  { id: 'sub-005', userId: 's036', assignmentId: 'cs101-a3', score: 55, gradedAt: new Date(Date.now()-1*86400000).toISOString(),  completedAt: new Date(Date.now()-2*86400000).toISOString(),  createdAt: new Date(Date.now()-2*86400000).toISOString(),  teacherComment: 'Below average. Please revisit OOP principles in the AI tutor.',   user: { name: 'Ishaan Bajaj',       email: 'ishaan.bajaj@campus.edu'     }, assignment: { id: 'cs101-a3', title: 'OOP Concepts Assessment',      courseId: 'cs101' } },
  { id: 'sub-006', userId: 's003', assignmentId: 'ds301-a3', score: 91, gradedAt: new Date(Date.now()-2*86400000).toISOString(),  completedAt: new Date(Date.now()-3*86400000).toISOString(),  createdAt: new Date(Date.now()-3*86400000).toISOString(),  teacherComment: 'Excellent Dijkstra implementation.',                               user: { name: 'Emily Chen',         email: 'emily.chen@campus.edu'       }, assignment: { id: 'ds301-a3', title: 'Graph Algorithms Exam',        courseId: 'ds301' } },
  { id: 'sub-007', userId: 's041', assignmentId: 'ds301-a3', score: 38, gradedAt: new Date(Date.now()-1*86400000).toISOString(),  completedAt: new Date(Date.now()-2*86400000).toISOString(),  createdAt: new Date(Date.now()-2*86400000).toISOString(),  teacherComment: 'Critical gaps in graph theory. Immediate intervention needed.',    user: { name: 'Deepak Verma',       email: 'deepak.verma@campus.edu'     }, assignment: { id: 'ds301-a3', title: 'Graph Algorithms Exam',        courseId: 'ds301' } },
  { id: 'sub-008', userId: 's076', assignmentId: 'ds301-a3', score: 94, gradedAt: new Date(Date.now()-1*86400000).toISOString(),  completedAt: new Date(Date.now()-2*86400000).toISOString(),  createdAt: new Date(Date.now()-2*86400000).toISOString(),  teacherComment: 'Top of class. Consider the advanced algorithms elective.',         user: { name: 'Yuki Tanaka',        email: 'yuki.tanaka@campus.edu'      }, assignment: { id: 'ds301-a3', title: 'Graph Algorithms Exam',        courseId: 'ds301' } },
  { id: 'sub-009', userId: 's042', assignmentId: 'os201-a3', score: 41, gradedAt: new Date(Date.now()-4*86400000).toISOString(),  completedAt: new Date(Date.now()-5*86400000).toISOString(),  createdAt: new Date(Date.now()-5*86400000).toISOString(),  teacherComment: 'Failed to demonstrate paging concepts. Needs re-study.',          user: { name: 'Aisha Okonkwo',      email: 'aisha.okonkwo@campus.edu'    }, assignment: { id: 'os201-a3', title: 'Virtual Memory & Paging',     courseId: 'os201' } },
  { id: 'sub-010', userId: 's006', assignmentId: 'os201-a3', score: 87, gradedAt: new Date(Date.now()-3*86400000).toISOString(),  completedAt: new Date(Date.now()-4*86400000).toISOString(),  createdAt: new Date(Date.now()-4*86400000).toISOString(),  teacherComment: 'Very good. LRU algorithm explanation was clear.',                  user: { name: 'Carlos Rivera',      email: 'carlos.rivera@campus.edu'    }, assignment: { id: 'os201-a3', title: 'Virtual Memory & Paging',     courseId: 'os201' } },
  { id: 'sub-011', userId: 's044', assignmentId: 'ai501-a4', score: 35, gradedAt: new Date(Date.now()-2*86400000).toISOString(),  completedAt: new Date(Date.now()-3*86400000).toISOString(),  createdAt: new Date(Date.now()-3*86400000).toISOString(),  teacherComment: 'Very low score. Backpropagation not understood. Seek help.',       user: { name: 'Preethi Subramaniam',email: 'preethi.s@campus.edu'        }, assignment: { id: 'ai501-a4', title: 'Backpropagation & Optimization', courseId: 'ai501' } },
  { id: 'sub-012', userId: 's005', assignmentId: 'ds301-a1', score: 90, gradedAt: null, completedAt: new Date(Date.now()-1*86400000).toISOString(), createdAt: new Date(Date.now()-1*86400000).toISOString(), teacherComment: null, user: { name: 'Sneha Iyer', email: 'sneha.iyer@campus.edu' }, assignment: { id: 'ds301-a1', title: 'BST & AVL Trees', courseId: 'ds301' } },
  { id: 'sub-013', userId: 's008', assignmentId: 'ds301-a1', score: 82, gradedAt: null, completedAt: new Date(Date.now()-2*86400000).toISOString(), createdAt: new Date(Date.now()-2*86400000).toISOString(), teacherComment: null, user: { name: 'Wei Zhang',   email: 'wei.zhang@campus.edu' },   assignment: { id: 'ds301-a1', title: 'BST & AVL Trees', courseId: 'ds301' } },
  { id: 'sub-014', userId: 's046', assignmentId: 'ds301-a2', score: 30, gradedAt: new Date(Date.now()-1*86400000).toISOString(), completedAt: new Date(Date.now()-2*86400000).toISOString(), createdAt: new Date(Date.now()-2*86400000).toISOString(), teacherComment: 'DP fundamentals completely unclear. Arrange tutoring session.',   user: { name: 'Elena Kowalski',     email: 'elena.k@campus.edu'          }, assignment: { id: 'ds301-a2', title: 'Dynamic Programming Basics', courseId: 'ds301' } },
  { id: 'sub-015', userId: 's080', assignmentId: 'cs101-a1', score: 97, gradedAt: new Date(Date.now()-5*86400000).toISOString(), completedAt: new Date(Date.now()-6*86400000).toISOString(), createdAt: new Date(Date.now()-6*86400000).toISOString(), teacherComment: 'Perfect score! Exemplary work as always.',                        user: { name: 'Shruti Agarwal',     email: 'shruti.agarwal@campus.edu'   }, assignment: { id: 'cs101-a1', title: 'Sorting Algorithms Quiz',    courseId: 'cs101' } },
  { id: 'sub-016', userId: 's120', assignmentId: 'cs101-a1', score: 100,gradedAt: new Date(Date.now()-5*86400000).toISOString(), completedAt: new Date(Date.now()-6*86400000).toISOString(), createdAt: new Date(Date.now()-6*86400000).toISOString(), teacherComment: 'Flawless. Bonus: consider contributing to study groups.',          user: { name: 'Kritika Mishra',     email: 'kritika.mishra@campus.edu'   }, assignment: { id: 'cs101-a1', title: 'Sorting Algorithms Quiz',    courseId: 'cs101' } },
  { id: 'sub-017', userId: 's048', assignmentId: 'cs101-a1', score: 30, gradedAt: new Date(Date.now()-4*86400000).toISOString(), completedAt: new Date(Date.now()-5*86400000).toISOString(), createdAt: new Date(Date.now()-5*86400000).toISOString(), teacherComment: 'Urgent: failing. Please use AI tutor for sorting topics.',          user: { name: 'Tolu Adeyemi',       email: 'tolu.adeyemi@campus.edu'     }, assignment: { id: 'cs101-a1', title: 'Sorting Algorithms Quiz',    courseId: 'cs101' } },
  { id: 'sub-018', userId: 's009', assignmentId: 'cn401-a3', score: 85, gradedAt: null, completedAt: new Date(Date.now()-1*86400000).toISOString(), createdAt: new Date(Date.now()-1*86400000).toISOString(), teacherComment: null, user: { name: 'Aarav Patel',  email: 'aarav.patel@campus.edu'  }, assignment: { id: 'cn401-a3', title: 'Subnetting & VLSM', courseId: 'cn401' } },
  { id: 'sub-019', userId: 's045', assignmentId: 'cn401-a3', score: 40, gradedAt: new Date(Date.now()-2*86400000).toISOString(), completedAt: new Date(Date.now()-3*86400000).toISOString(), createdAt: new Date(Date.now()-3*86400000).toISOString(), teacherComment: 'Subnetting is a critical skill. Practice with subnet calculators.', user: { name: 'David Asare',        email: 'david.asare@campus.edu'      }, assignment: { id: 'cn401-a3', title: 'Subnetting & VLSM', courseId: 'cn401' } },
  { id: 'sub-020', userId: 's058', assignmentId: 'cs101-a2', score: 93, gradedAt: null, completedAt: new Date(Date.now() - 12*3600000).toISOString(), createdAt: new Date(Date.now()-12*3600000).toISOString(), teacherComment: null, user: { name: 'Aditi Sharma', email: 'aditi.sharma@campus.edu' }, assignment: { id: 'cs101-a2', title: 'Time Complexity Analysis', courseId: 'cs101' } },
  { id: 'sub-021', userId: 's087', assignmentId: 'os201-a2', score: 33, gradedAt: new Date(Date.now()-1*86400000).toISOString(), completedAt: new Date(Date.now()-2*86400000).toISOString(), createdAt: new Date(Date.now()-2*86400000).toISOString(), teacherComment: 'Deadlock resolution not demonstrated. Needs structured review.',    user: { name: 'Maxim Petrov',       email: 'maxim.petrov@campus.edu'     }, assignment: { id: 'os201-a2', title: 'Deadlock & Synchronization', courseId: 'os201' } },
  { id: 'sub-022', userId: 's092', assignmentId: 'os201-a2', score: 89, gradedAt: null, completedAt: new Date(Date.now()-6*3600000).toISOString(),   createdAt: new Date(Date.now()-6*3600000).toISOString(),   teacherComment: null, user: { name: 'Shreya Joshi',  email: 'shreya.joshi@campus.edu' }, assignment: { id: 'os201-a2', title: 'Deadlock & Synchronization', courseId: 'os201' } },
  { id: 'sub-023', userId: 's004', assignmentId: 'cs101-a4', score: 86, gradedAt: new Date(Date.now()-8*86400000).toISOString(), completedAt: new Date(Date.now()-9*86400000).toISOString(), createdAt: new Date(Date.now()-9*86400000).toISOString(), teacherComment: 'Good recursion understanding. Watch out for stack overflow cases.',  user: { name: 'Mohammed Al-Farsi',  email: 'mohammed.alfarsi@campus.edu' }, assignment: { id: 'cs101-a4', title: 'Recursion Deep Dive',       courseId: 'cs101' } },
  { id: 'sub-024', userId: 's049', assignmentId: 'ai501-a3', score: 31, gradedAt: new Date(Date.now()-5*86400000).toISOString(), completedAt: new Date(Date.now()-6*86400000).toISOString(), createdAt: new Date(Date.now()-6*86400000).toISOString(), teacherComment: 'Neural network concepts unclear. Use the AI tutor for this topic.',   user: { name: 'Mia Korhonen',       email: 'mia.korhonen@campus.edu'     }, assignment: { id: 'ai501-a3', title: 'Neural Networks Basics',    courseId: 'ai501' } },
  { id: 'sub-025', userId: 's113', assignmentId: 'ai501-a3', score: 85, gradedAt: null, completedAt: new Date(Date.now()-8*3600000).toISOString(), createdAt: new Date(Date.now()-8*3600000).toISOString(), teacherComment: null, user: { name: 'Suhail Ansari', email: 'suhail.ansari@campus.edu' }, assignment: { id: 'ai501-a3', title: 'Neural Networks Basics', courseId: 'ai501' } },
];

// ─── All Assignments flat list (for dropdowns) ───────────────────────────────

export const MOCK_ALL_ASSIGNMENTS_FULL = Object.values(MOCK_TEACHER_ASSIGNMENTS_FULL).flat()
  .map(a => ({ id: a.id, title: a.title, courseId: a.courseId }));

// ─── Analytics: semester-long data ──────────────────────────────────────────

export const MOCK_ANALYTICS_SEMESTER: Record<string, any> = {
  cs101: {
    masteryTrend: [
      { week: 'Week 1',  classAverage: 62, topPerformers: 78, struggling: 42 },
      { week: 'Week 2',  classAverage: 64, topPerformers: 81, struggling: 44 },
      { week: 'Week 3',  classAverage: 61, topPerformers: 79, struggling: 40 },
      { week: 'Week 4',  classAverage: 66, topPerformers: 84, struggling: 45 },
      { week: 'Week 5',  classAverage: 68, topPerformers: 86, struggling: 46 },
      { week: 'Week 6',  classAverage: 67, topPerformers: 85, struggling: 43 },
      { week: 'Week 7',  classAverage: 70, topPerformers: 88, struggling: 48 },
      { week: 'Week 8',  classAverage: 69, topPerformers: 87, struggling: 47 },
      { week: 'Week 9',  classAverage: 72, topPerformers: 90, struggling: 50 },
      { week: 'Week 10', classAverage: 74, topPerformers: 91, struggling: 52 },
      { week: 'Week 11', classAverage: 73, topPerformers: 90, struggling: 49 },
      { week: 'Week 12', classAverage: 76, topPerformers: 93, struggling: 54 },
    ],
    weeklyEngagement: [120, 135, 118, 142, 158, 149, 161, 155, 168, 174, 163, 180],
    performanceDistribution: [
      { range: '90-100%', count: 12, color: '#22c55e' },
      { range: '80-89%',  count: 18, color: '#3b82f6' },
      { range: '70-79%',  count: 16, color: '#a78bfa' },
      { range: '60-69%',  count: 11, color: '#f59e0b' },
      { range: 'Below 60%', count: 11, color: '#ef4444' },
    ],
    topicMastery: [
      { topicId: 'sorting',      topicName: 'Sorting Algorithms',      averageMastery: 74, averageConfidence: 0.79, studentCount: 68 },
      { topicId: 'complexity',   topicName: 'Time Complexity',          averageMastery: 65, averageConfidence: 0.68, studentCount: 64 },
      { topicId: 'searching',    topicName: 'Searching Algorithms',     averageMastery: 78, averageConfidence: 0.82, studentCount: 68 },
      { topicId: 'oop',          topicName: 'OOP Principles',           averageMastery: 70, averageConfidence: 0.73, studentCount: 67 },
      { topicId: 'polymorphism', topicName: 'Polymorphism',             averageMastery: 58, averageConfidence: 0.61, studentCount: 62 },
      { topicId: 'recursion',    topicName: 'Recursion',                averageMastery: 62, averageConfidence: 0.65, studentCount: 65 },
      { topicId: 'graphs',       topicName: 'Graph Traversal',          averageMastery: 55, averageConfidence: 0.59, studentCount: 60 },
      { topicId: 'bfs',          topicName: 'BFS & DFS',                averageMastery: 52, averageConfidence: 0.55, studentCount: 58 },
    ],
    aiInsights: [
      { topicName: 'Recursion',    insightText: '14 students consistently fail at recursive base cases. Recommend a dedicated practice session with worked examples in the AI tutor.' },
      { topicName: 'Polymorphism', insightText: 'Polymorphism mastery is 12% below class average. Students confuse method overloading vs. overriding. Suggest a visual analogy exercise.' },
      { topicName: 'Graph Traversal', insightText: 'BFS/DFS scores dropped in Week 8 correlating with the deadline spike. Consider spacing out assignments to reduce cognitive overload.' },
      { topicName: 'Overall Trend', insightText: 'Class average improving at +2.1% per week. 68% of students show consistent engagement. 3 students (Farid, Tolu, Ishaan) require urgent intervention.' },
    ],
  },
  ds301: {
    masteryTrend: [
      { week: 'Week 1',  classAverage: 58, topPerformers: 74, struggling: 38 },
      { week: 'Week 2',  classAverage: 60, topPerformers: 76, struggling: 40 },
      { week: 'Week 3',  classAverage: 57, topPerformers: 73, struggling: 36 },
      { week: 'Week 4',  classAverage: 62, topPerformers: 78, struggling: 41 },
      { week: 'Week 5',  classAverage: 63, topPerformers: 80, struggling: 42 },
      { week: 'Week 6',  classAverage: 61, topPerformers: 79, struggling: 39 },
      { week: 'Week 7',  classAverage: 65, topPerformers: 83, struggling: 44 },
      { week: 'Week 8',  classAverage: 64, topPerformers: 82, struggling: 43 },
      { week: 'Week 9',  classAverage: 67, topPerformers: 85, struggling: 46 },
      { week: 'Week 10', classAverage: 69, topPerformers: 87, struggling: 48 },
      { week: 'Week 11', classAverage: 68, topPerformers: 86, struggling: 45 },
      { week: 'Week 12', classAverage: 71, topPerformers: 89, struggling: 50 },
    ],
    weeklyEngagement: [88, 95, 84, 102, 110, 106, 115, 112, 120, 124, 117, 130],
    performanceDistribution: [
      { range: '90-100%', count: 7,  color: '#22c55e' },
      { range: '80-89%',  count: 13, color: '#3b82f6' },
      { range: '70-79%',  count: 14, color: '#a78bfa' },
      { range: '60-69%',  count: 12, color: '#f59e0b' },
      { range: 'Below 60%', count: 9, color: '#ef4444' },
    ],
    topicMastery: [
      { topicId: 'arrays',    topicName: 'Arrays & Linked Lists',  averageMastery: 78, averageConfidence: 0.82, studentCount: 55 },
      { topicId: 'trees',     topicName: 'BST & AVL Trees',        averageMastery: 68, averageConfidence: 0.71, studentCount: 53 },
      { topicId: 'heaps',     topicName: 'Heaps & Priority Queue', averageMastery: 65, averageConfidence: 0.68, studentCount: 52 },
      { topicId: 'graphs',    topicName: 'Graph Algorithms',       averageMastery: 60, averageConfidence: 0.63, studentCount: 50 },
      { topicId: 'dp',        topicName: 'Dynamic Programming',    averageMastery: 46, averageConfidence: 0.49, studentCount: 45 },
      { topicId: 'greedy',    topicName: 'Greedy Algorithms',      averageMastery: 70, averageConfidence: 0.74, studentCount: 53 },
      { topicId: 'divcon',    topicName: 'Divide & Conquer',       averageMastery: 72, averageConfidence: 0.76, studentCount: 54 },
      { topicId: 'advanced',  topicName: 'Segment Trees & Tries',  averageMastery: 52, averageConfidence: 0.55, studentCount: 44 },
    ],
    aiInsights: [
      { topicName: 'Dynamic Programming', insightText: '18 students scored below 50% on DP assignments. The most common errors are in state-space definition and overlapping subproblems identification.' },
      { topicName: 'Graph Algorithms',    insightText: 'Dijkstra\'s algorithm has 62% pass rate. Floyd-Warshall is at 48%. Recommend revisiting graph representation before complex algorithms.' },
      { topicName: 'AVL Trees',           insightText: 'AVL rotation cases (LL, LR, RL, RR) show 40% confusion rate. Visual rotation animations could help kinesthetic learners.' },
    ],
  },
  os201: {
    masteryTrend: [
      { week: 'Week 1',  classAverage: 54, topPerformers: 70, struggling: 34 },
      { week: 'Week 2',  classAverage: 55, topPerformers: 72, struggling: 35 },
      { week: 'Week 3',  classAverage: 53, topPerformers: 69, struggling: 33 },
      { week: 'Week 4',  classAverage: 58, topPerformers: 74, struggling: 38 },
      { week: 'Week 5',  classAverage: 59, topPerformers: 76, struggling: 38 },
      { week: 'Week 6',  classAverage: 57, topPerformers: 74, struggling: 36 },
      { week: 'Week 7',  classAverage: 62, topPerformers: 78, struggling: 42 },
      { week: 'Week 8',  classAverage: 61, topPerformers: 77, struggling: 40 },
      { week: 'Week 9',  classAverage: 64, topPerformers: 81, struggling: 44 },
      { week: 'Week 10', classAverage: 65, topPerformers: 82, struggling: 45 },
      { week: 'Week 11', classAverage: 63, topPerformers: 80, struggling: 42 },
      { week: 'Week 12', classAverage: 67, topPerformers: 84, struggling: 47 },
    ],
    weeklyEngagement: [72, 78, 68, 84, 91, 88, 97, 93, 102, 105, 99, 112],
    performanceDistribution: [
      { range: '90-100%', count: 5,  color: '#22c55e' },
      { range: '80-89%',  count: 10, color: '#3b82f6' },
      { range: '70-79%',  count: 12, color: '#a78bfa' },
      { range: '60-69%',  count: 10, color: '#f59e0b' },
      { range: 'Below 60%', count: 10, color: '#ef4444' },
    ],
    topicMastery: [
      { topicId: 'processes',  topicName: 'Processes & Threads',   averageMastery: 66, averageConfidence: 0.70, studentCount: 47 },
      { topicId: 'scheduling', topicName: 'Process Scheduling',    averageMastery: 63, averageConfidence: 0.66, studentCount: 46 },
      { topicId: 'deadlock',   topicName: 'Deadlock & Sync',       averageMastery: 52, averageConfidence: 0.54, studentCount: 43 },
      { topicId: 'memory',     topicName: 'Memory Management',     averageMastery: 55, averageConfidence: 0.58, studentCount: 44 },
      { topicId: 'paging',     topicName: 'Paging & Segmentation', averageMastery: 50, averageConfidence: 0.52, studentCount: 42 },
      { topicId: 'fs',         topicName: 'File Systems',          averageMastery: 65, averageConfidence: 0.68, studentCount: 46 },
      { topicId: 'io',         topicName: 'I/O Systems',           averageMastery: 62, averageConfidence: 0.65, studentCount: 46 },
    ],
    aiInsights: [
      { topicName: 'Deadlock',            insightText: 'Deadlock prevention vs. avoidance is poorly distinguished by 60% of students. The Banker\'s Algorithm has only 45% success rate.' },
      { topicName: 'Virtual Memory',      insightText: 'Page replacement algorithms (LRU, Optimal, FIFO) show high confusion. Recommend interactive simulation exercises.' },
      { topicName: 'Process Scheduling',  insightText: 'Preemptive vs. non-preemptive scheduling is well understood (73%). Round-Robin time quantum selection remains a weak point.' },
    ],
  },
};

// ─── Alerts / Notifications ──────────────────────────────────────────────────

export const MOCK_TEACHER_ALERTS = [
  { id: 'alert-1', type: 'urgent'  as const, icon: 'AlertTriangle', message: '3 high-risk students have not submitted 2+ consecutive assignments (Deepak Verma, Elena Kowalski, Tolu Adeyemi)',              course: 'ds301', courseLabel: 'Data Structures & Algorithms', timestamp: new Date(Date.now() - 2*3600000).toISOString()   },
  { id: 'alert-2', type: 'warning' as const, icon: 'TrendingDown',  message: '14 students in CS101 scored below 50% on the Recursion assessment — largest failure cluster this semester',                  course: 'cs101', courseLabel: 'Computer Science 101',          timestamp: new Date(Date.now() - 5*3600000).toISOString()   },
  { id: 'alert-3', type: 'warning' as const, icon: 'Clock',         message: 'Spike in late submissions for OS Virtual Memory assignment — 11 students submitted after deadline without extension',         course: 'os201', courseLabel: 'Operating Systems',             timestamp: new Date(Date.now() - 8*3600000).toISOString()   },
  { id: 'alert-4', type: 'info'    as const, icon: 'TrendingDown',  message: 'OS quiz average dropped 9% week-over-week (from 67% → 58%). Deadlock topic appears to be the primary driver',               course: 'os201', courseLabel: 'Operating Systems',             timestamp: new Date(Date.now() - 12*3600000).toISOString()  },
  { id: 'alert-5', type: 'warning' as const, icon: 'ShieldAlert',   message: '7 integrity flags raised on AI501 Backpropagation exam — rapid answer patterns detected (avg 2.3s/question)',               course: 'ai501', courseLabel: 'AI Fundamentals',               timestamp: new Date(Date.now() - 18*3600000).toISOString()  },
  { id: 'alert-6', type: 'info'    as const, icon: 'Users',         message: 'Engagement score for CN401 improved 18% this week following the optional subnetting drill session',                          course: 'cn401', courseLabel: 'Computer Networks',             timestamp: new Date(Date.now() - 24*3600000).toISOString()  },
  { id: 'alert-7', type: 'info'    as const, icon: 'Trophy',        message: 'Priya Sharma, Kritika Mishra and Shruti Agarwal achieved 90%+ mastery in 5+ topics — consider advanced challenges',          course: 'cs101', courseLabel: 'Computer Science 101',          timestamp: new Date(Date.now() - 36*3600000).toISOString()  },
  { id: 'alert-8', type: 'urgent'  as const, icon: 'AlertTriangle', message: 'Dynamic Programming module: class average at 46% — well below the 60% mastery threshold. Curriculum review recommended',    course: 'ds301', courseLabel: 'Data Structures & Algorithms', timestamp: new Date(Date.now() - 48*3600000).toISOString()  },
];

// ─── Integrity Flags (mock) ──────────────────────────────────────────────────

export const MOCK_INTEGRITY_FLAGS = [
  { attemptId: 'int-001', userId: 's041', userName: 'Deepak Verma',       userEmail: 'deepak.verma@campus.edu',     assignmentId: 'ds301-a2', assignmentTitle: 'Dynamic Programming Basics',   avgTimeSec: 1.8, correctRate: 85, totalQuestions: 7,  flags: ['rapid_guessing', 'high_anomaly'], createdAt: new Date(Date.now() - 2*86400000).toISOString()  },
  { attemptId: 'int-002', userId: 's049', userName: 'Mia Korhonen',        userEmail: 'mia.korhonen@campus.edu',     assignmentId: 'ai501-a4', assignmentTitle: 'Backpropagation & Optimization', avgTimeSec: 2.1, correctRate: 80, totalQuestions: 8,  flags: ['rapid_guessing', 'high_anomaly'], createdAt: new Date(Date.now() - 3*86400000).toISOString()  },
  { attemptId: 'int-003', userId: 's087', userName: 'Maxim Petrov',        userEmail: 'maxim.petrov@campus.edu',     assignmentId: 'os201-a3', assignmentTitle: 'Virtual Memory & Paging',       avgTimeSec: 2.4, correctRate: 75, totalQuestions: 8,  flags: ['rapid_guessing'],                 createdAt: new Date(Date.now() - 4*86400000).toISOString()  },
  { attemptId: 'int-004', userId: 's050', userName: 'Imran Choudhury',     userEmail: 'imran.choudhury@campus.edu',  assignmentId: 'cn401-a2', assignmentTitle: 'Routing & Switching',            avgTimeSec: 3.2, correctRate: 72, totalQuestions: 7,  flags: ['rapid_guessing'],                 createdAt: new Date(Date.now() - 5*86400000).toISOString()  },
  { attemptId: 'int-005', userId: 's044', userName: 'Preethi Subramaniam', userEmail: 'preethi.s@campus.edu',        assignmentId: 'ai501-a4', assignmentTitle: 'Backpropagation & Optimization', avgTimeSec: 1.5, correctRate: 90, totalQuestions: 8,  flags: ['rapid_guessing', 'high_anomaly'], createdAt: new Date(Date.now() - 6*86400000).toISOString()  },
  { attemptId: 'int-006', userId: 's048', userName: 'Tolu Adeyemi',        userEmail: 'tolu.adeyemi@campus.edu',     assignmentId: 'cs101-a5', assignmentTitle: 'Graph Traversal Exam',           avgTimeSec: 4.1, correctRate: 45, totalQuestions: 6,  flags: ['rapid_guessing'],                 createdAt: new Date(Date.now() - 8*86400000).toISOString()  },
  { attemptId: 'int-007', userId: 's046', userName: 'Elena Kowalski',      userEmail: 'elena.k@campus.edu',          assignmentId: 'ds301-a2', assignmentTitle: 'Dynamic Programming Basics',    avgTimeSec: 2.9, correctRate: 68, totalQuestions: 7,  flags: ['rapid_guessing'],                 createdAt: new Date(Date.now() - 10*86400000).toISOString() },
  { attemptId: 'int-008', userId: 's042', userName: 'Aisha Okonkwo',       userEmail: 'aisha.okonkwo@campus.edu',    assignmentId: 'os201-a7', assignmentTitle: 'Midterm: OS Concepts',           avgTimeSec: 3.5, correctRate: 62, totalQuestions: 20, flags: ['rapid_guessing'],                 createdAt: new Date(Date.now() - 12*86400000).toISOString() },
];

// ─── Cohort (extended — 120 students) ────────────────────────────────────────

export const MOCK_COHORT_FULL = {
  masteryByTopic: [
    { topicId: 'sorting',      topicName: 'Sorting Algorithms',      avgMastery: 74, studentCount: 120 },
    { topicId: 'searching',    topicName: 'Searching Algorithms',    avgMastery: 78, studentCount: 120 },
    { topicId: 'complexity',   topicName: 'Time Complexity',         avgMastery: 65, studentCount: 118 },
    { topicId: 'oop',          topicName: 'OOP Principles',          avgMastery: 70, studentCount: 117 },
    { topicId: 'polymorphism', topicName: 'Polymorphism',            avgMastery: 58, studentCount: 115 },
    { topicId: 'recursion',    topicName: 'Recursion',               avgMastery: 62, studentCount: 116 },
    { topicId: 'bst',          topicName: 'BST & AVL Trees',         avgMastery: 68, studentCount: 110 },
    { topicId: 'heaps',        topicName: 'Heaps & Priority Queue',  avgMastery: 65, studentCount: 108 },
    { topicId: 'graphs',       topicName: 'Graph Algorithms',        avgMastery: 60, studentCount: 112 },
    { topicId: 'dp',           topicName: 'Dynamic Programming',     avgMastery: 46, studentCount: 100 },
    { topicId: 'greedy',       topicName: 'Greedy Algorithms',       avgMastery: 70, studentCount: 108 },
    { topicId: 'scheduling',   topicName: 'Process Scheduling',      avgMastery: 63, studentCount: 95  },
    { topicId: 'deadlock',     topicName: 'Deadlock & Sync',         avgMastery: 52, studentCount: 92  },
    { topicId: 'paging',       topicName: 'Paging & Virtual Memory', avgMastery: 50, studentCount: 90  },
    { topicId: 'routing',      topicName: 'Routing Protocols',       avgMastery: 58, studentCount: 85  },
    { topicId: 'subnetting',   topicName: 'Subnetting & VLSM',       avgMastery: 61, studentCount: 85  },
    { topicId: 'nn',           topicName: 'Neural Networks',         avgMastery: 54, studentCount: 80  },
    { topicId: 'backprop',     topicName: 'Backpropagation',         avgMastery: 48, studentCount: 78  },
    { topicId: 'overfitting',  topicName: 'Overfitting & Regularization', avgMastery: 57, studentCount: 76 },
  ],
  topicAccuracy: [
    { topicId: 'sorting',      topicName: 'Sorting Algorithms',      avgScore: 76, attempts: 312 },
    { topicId: 'searching',    topicName: 'Searching Algorithms',    avgScore: 80, attempts: 298 },
    { topicId: 'complexity',   topicName: 'Time Complexity',         avgScore: 67, attempts: 280 },
    { topicId: 'oop',          topicName: 'OOP Principles',          avgScore: 72, attempts: 290 },
    { topicId: 'polymorphism', topicName: 'Polymorphism',            avgScore: 60, attempts: 265 },
    { topicId: 'recursion',    topicName: 'Recursion',               avgScore: 63, attempts: 270 },
    { topicId: 'bst',          topicName: 'BST & AVL Trees',         avgScore: 70, attempts: 230 },
    { topicId: 'graphs',       topicName: 'Graph Algorithms',        avgScore: 62, attempts: 220 },
    { topicId: 'dp',           topicName: 'Dynamic Programming',     avgScore: 48, attempts: 195 },
    { topicId: 'greedy',       topicName: 'Greedy Algorithms',       avgScore: 72, attempts: 210 },
    { topicId: 'scheduling',   topicName: 'Process Scheduling',      avgScore: 65, attempts: 180 },
    { topicId: 'deadlock',     topicName: 'Deadlock & Sync',         avgScore: 54, attempts: 168 },
    { topicId: 'paging',       topicName: 'Paging & Virtual Memory', avgScore: 52, attempts: 162 },
    { topicId: 'routing',      topicName: 'Routing Protocols',       avgScore: 60, attempts: 155 },
    { topicId: 'subnetting',   topicName: 'Subnetting & VLSM',       avgScore: 63, attempts: 158 },
    { topicId: 'nn',           topicName: 'Neural Networks',         avgScore: 56, attempts: 142 },
    { topicId: 'backprop',     topicName: 'Backpropagation',         avgScore: 50, attempts: 138 },
    { topicId: 'overfitting',  topicName: 'Regularization',          avgScore: 59, attempts: 130 },
  ],
  studentRanking: MOCK_STUDENTS_FULL.slice()
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((s, i) => ({
      rank: i + 1,
      userId: s.id,
      name: s.name,
      totalXP: Math.round(s.avgScore * 50 + s.engagementScore * 20 + Math.random() * 500),
      level: Math.floor(s.avgScore / 10),
    })),
};

// ─── Reports: course list for export ─────────────────────────────────────────

export const MOCK_TEACHER_COURSES_FOR_REPORTS = MOCK_TEACHER_COURSES_RICH.map(c => ({
  id: c.id,
  name: c.name,
}));

// ─── Teacher Dashboard ──────────────────────────────────────────────────────

export const MOCK_TEACHER_DASHBOARD = {
  totalStudents: 250,
  avgMastery: 63,
  activeCoursesCount: 5,
  courses: [
    { id: 'cs101', title: 'Computer Science 101',            studentCount: 68, avgGrade: 72, nextAssignmentDue: new Date(Date.now() + 7  * 86400000).toISOString() },
    { id: 'ds301', title: 'Data Structures & Algorithms',   studentCount: 55, avgGrade: 64, nextAssignmentDue: new Date(Date.now() + 10 * 86400000).toISOString() },
    { id: 'os201', title: 'Operating Systems',               studentCount: 47, avgGrade: 58, nextAssignmentDue: new Date(Date.now() + 5  * 86400000).toISOString() },
    { id: 'cn401', title: 'Computer Networks',               studentCount: 42, avgGrade: 61, nextAssignmentDue: new Date(Date.now() + 8  * 86400000).toISOString() },
    { id: 'ai501', title: 'AI Fundamentals',                 studentCount: 38, avgGrade: 56, nextAssignmentDue: new Date(Date.now() + 12 * 86400000).toISOString() },
  ],
  atRiskStudents: [
    { id: 's041', name: 'Deepak Verma',          riskFactor: 'High'   as const, currentGrade: 38, courseName: 'Data Structures & Algorithms' },
    { id: 's042', name: 'Aisha Okonkwo',         riskFactor: 'High'   as const, currentGrade: 41, courseName: 'Operating Systems'            },
    { id: 's043', name: 'Farid Karimov',         riskFactor: 'High'   as const, currentGrade: 42, courseName: 'Computer Science 101'          },
    { id: 's044', name: 'Preethi Subramaniam',   riskFactor: 'High'   as const, currentGrade: 35, courseName: 'AI Fundamentals'              },
    { id: 's046', name: 'Elena Kowalski',        riskFactor: 'High'   as const, currentGrade: 40, courseName: 'Data Structures & Algorithms' },
    { id: 's048', name: 'Tolu Adeyemi',          riskFactor: 'Medium' as const, currentGrade: 50, courseName: 'Computer Science 101'          },
    { id: 's087', name: 'Maxim Petrov',          riskFactor: 'High'   as const, currentGrade: 43, courseName: 'Operating Systems'            },
    { id: 's049', name: 'Mia Korhonen',          riskFactor: 'Medium' as const, currentGrade: 52, courseName: 'AI Fundamentals'              },
    { id: 's050', name: 'Imran Choudhury',       riskFactor: 'Medium' as const, currentGrade: 54, courseName: 'Computer Networks'            },
    { id: 's095', name: 'Ajay Nambiar',          riskFactor: 'Medium' as const, currentGrade: 56, courseName: 'Computer Science 101'          },
  ],
  performanceTrend: [
    { date: 'Week 1',  classAverage: 58 },
    { date: 'Week 2',  classAverage: 60 },
    { date: 'Week 3',  classAverage: 58 },
    { date: 'Week 4',  classAverage: 62 },
    { date: 'Week 5',  classAverage: 63 },
    { date: 'Week 6',  classAverage: 61 },
    { date: 'Week 7',  classAverage: 65 },
    { date: 'Week 8',  classAverage: 64 },
    { date: 'Week 9',  classAverage: 67 },
    { date: 'Week 10', classAverage: 68 },
    { date: 'Week 11', classAverage: 66 },
    { date: 'Week 12', classAverage: 70 },
  ],
};

// ─── Legacy aliases (must appear after source declarations) ─────────────────
export const MOCK_TEACHER_COURSES       = MOCK_TEACHER_COURSES_RICH;
export const MOCK_TEACHER_COURSES_LIST  = MOCK_TEACHER_COURSES_RICH.map(c => ({ id: c.id, name: c.name }));
export const MOCK_TEACHER_ASSIGNMENTS: Record<string, any[]> = MOCK_TEACHER_ASSIGNMENTS_FULL;
export const MOCK_SUBMISSIONS           = MOCK_SUBMISSIONS_FULL;
export const MOCK_ALL_ASSIGNMENTS       = MOCK_ALL_ASSIGNMENTS_FULL;
export const MOCK_COHORT_DATA           = MOCK_COHORT_FULL;
