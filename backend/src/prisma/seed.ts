import {
  PrismaClient, UserRole, AIMode, MessageSender, ResponseType,
  ActivityType, XPSource, DifficultyLevel, BattleStatus, RewardType, InteractionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Starting comprehensive database seed...');

  // â”€â”€ 1. Institution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const institution = await prisma.institution.upsert({
    where: { domain: 'intellicampus.edu' },
    update: {},
    create: { name: 'IntelliCampus University', domain: 'intellicampus.edu' },
  });
  console.log(`ðŸ« Institution: ${institution.name}`);

  // AI Policy
  await prisma.aIPolicySettings.upsert({
    where: { institutionId: institution.id },
    update: {},
    create: { institutionId: institution.id, hintModeOnly: false, strictExamMode: false, maxTokens: 2048 },
  });

  // â”€â”€ 2. Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Admin User', email: 'admin@campus.edu', passwordHash,
      role: UserRole.admin, institutionId: institution.id,
      profile: { create: { bio: 'System Administrator', department: 'IT' } },
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Professor Turing', email: 'teacher@campus.edu', passwordHash,
      role: UserRole.teacher, institutionId: institution.id,
      profile: { create: { department: 'Computer Science', bio: 'Professor of Algorithms and AI. 15 years teaching experience.' } },
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Dr. Ada Lovelace', email: 'teacher2@campus.edu', passwordHash,
      role: UserRole.teacher, institutionId: institution.id,
      profile: { create: { department: 'Mathematics', bio: 'Professor of Discrete Mathematics and Logic.' } },
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Alice Johnson', email: 'student@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 2, department: 'Computer Science', bio: 'Eager to learn! Loves algorithms and AI.' } },
      accessibilitySettings: { create: { focusMode: true } },
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'bob@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Bob Kumar', email: 'bob@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 2, department: 'Computer Science', bio: 'Future software engineer. Interested in system design.' } },
      accessibilitySettings: { create: {} },
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: 'carol@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Carol Mendes', email: 'carol@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 1, department: 'Computer Science', bio: 'First-year student. Loves mathematics and problem solving.' } },
      accessibilitySettings: { create: { dyslexiaFont: true } },
    },
  });

  const student4 = await prisma.user.upsert({
    where: { email: 'david@campus.edu' }, update: { passwordHash },
    create: {
      name: 'David Osei', email: 'david@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 3, department: 'Computer Science', bio: 'Senior student. Working on final year project in ML.' } },
      accessibilitySettings: { create: {} },
    },
  });

  const student5 = await prisma.user.upsert({
    where: { email: 'emma@campus.edu' }, update: { passwordHash },
    create: {
      name: 'Emma Wilson', email: 'emma@campus.edu', passwordHash,
      role: UserRole.student, institutionId: institution.id,
      profile: { create: { yearOfStudy: 2, department: 'Computer Science', bio: 'Passionate about web development and UI design.' } },
      accessibilitySettings: { create: { highContrast: false } },
    },
  });

  console.log('ðŸ‘¥ Users seeded (2 teachers, 5 students, 1 admin)');

  // â”€â”€ 3. Courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const course = await prisma.course.upsert({
    where: { id: 'cs101-seed' }, update: {},
    create: {
      id: 'cs101-seed', name: 'Computer Science 101',
      description: 'Introduction to Computer Science, programming fundamentals, and algorithmic thinking.',
      institutionId: institution.id, createdBy: teacher.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'math201-seed' }, update: {},
    create: {
      id: 'math201-seed', name: 'Discrete Mathematics',
      description: 'Mathematical logic, set theory, graph theory, combinatorics, and proof techniques.',
      institutionId: institution.id, createdBy: teacher2.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 'cs201-seed' }, update: {},
    create: {
      id: 'cs201-seed', name: 'Data Structures & Algorithms',
      description: 'Advanced data structures, algorithm design paradigms, and complexity analysis.',
      institutionId: institution.id, createdBy: teacher.id,
    },
  });

  const course4 = await prisma.course.upsert({
    where: { id: 'cs301-seed' }, update: {},
    create: {
      id: 'cs301-seed', name: 'Database Systems',
      description: 'Relational databases, SQL, normalization, indexing, and transaction management.',
      institutionId: institution.id, createdBy: teacher2.id,
    },
  });

  // â”€â”€ 4. Subjects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // CS101 Subjects
  const subjAlgo = await prisma.subject.upsert({
    where: { id: 'algo-seed' }, update: {},
    create: { id: 'algo-seed', name: 'Algorithms', description: 'Sorting, searching, and fundamental algorithm design.', courseId: course.id },
  });
  const subjOOP = await prisma.subject.upsert({
    where: { id: 'oop-seed' }, update: {},
    create: { id: 'oop-seed', name: 'Object-Oriented Programming', description: 'Classes, inheritance, polymorphism and design patterns.', courseId: course.id },
  });
  const subjProg = await prisma.subject.upsert({
    where: { id: 'prog-seed' }, update: {},
    create: { id: 'prog-seed', name: 'Programming Fundamentals', description: 'Variables, control flow, functions and recursion.', courseId: course.id },
  });

  // Math201 Subjects
  const subjGraph = await prisma.subject.upsert({
    where: { id: 'graph-seed' }, update: {},
    create: { id: 'graph-seed', name: 'Graph Theory', description: 'Graphs, trees, traversal and shortest path algorithms.', courseId: course2.id },
  });
  const subjLogic = await prisma.subject.upsert({
    where: { id: 'logic-seed' }, update: {},
    create: { id: 'logic-seed', name: 'Mathematical Logic', description: 'Propositional and predicate logic, proof techniques.', courseId: course2.id },
  });

  // CS201 Subjects
  const subjTrees = await prisma.subject.upsert({
    where: { id: 'trees-seed' }, update: {},
    create: { id: 'trees-seed', name: 'Trees & Heaps', description: 'Binary trees, BSTs, AVL trees, heaps and tries.', courseId: course3.id },
  });
  const subjDP = await prisma.subject.upsert({
    where: { id: 'dp-seed' }, update: {},
    create: { id: 'dp-seed', name: 'Dynamic Programming', description: 'Memoization, tabulation, classic DP problems.', courseId: course3.id },
  });

  // CS301 Subjects
  const subjSQL = await prisma.subject.upsert({
    where: { id: 'sql-seed' }, update: {},
    create: { id: 'sql-seed', name: 'SQL & Relational Model', description: 'DDL, DML, joins, aggregation and subqueries.', courseId: course4.id },
  });
  const subjNorm = await prisma.subject.upsert({
    where: { id: 'norm-seed' }, update: {},
    create: { id: 'norm-seed', name: 'Database Design', description: 'ER modeling, normalization (1NFâ€“BCNF) and schema design.', courseId: course4.id },
  });

  // â”€â”€ 5. Topics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tSorting = await prisma.topic.upsert({
    where: { id: 'sorting-seed' }, update: {},
    create: { id: 'sorting-seed', name: 'Sorting Algorithms', description: 'Bubble, Merge, Quick, Heap sort and their complexities.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjAlgo.id, orderIndex: 1 },
  });
  const tSearching = await prisma.topic.upsert({
    where: { id: 'searching-seed' }, update: {},
    create: { id: 'searching-seed', name: 'Searching Algorithms', description: 'Linear and Binary search, complexity analysis.', difficultyLevel: DifficultyLevel.beginner, subjectId: subjAlgo.id, orderIndex: 2 },
  });
  const tComplexity = await prisma.topic.upsert({
    where: { id: 'complexity-seed' }, update: {},
    create: { id: 'complexity-seed', name: 'Time & Space Complexity', description: 'Big-O notation, best/average/worst case analysis.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjAlgo.id, orderIndex: 3 },
  });
  const tPolymorphism = await prisma.topic.upsert({
    where: { id: 'polymorphism-seed' }, update: {},
    create: { id: 'polymorphism-seed', name: 'Polymorphism', description: 'Method overriding, overloading and dynamic dispatch.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjOOP.id, orderIndex: 1 },
  });
  const tInheritance = await prisma.topic.upsert({
    where: { id: 'inheritance-seed' }, update: {},
    create: { id: 'inheritance-seed', name: 'Inheritance & Encapsulation', description: 'Class hierarchy, access modifiers, abstract classes.', difficultyLevel: DifficultyLevel.beginner, subjectId: subjOOP.id, orderIndex: 2 },
  });
  const tRecursion = await prisma.topic.upsert({
    where: { id: 'recursion-seed' }, update: {},
    create: { id: 'recursion-seed', name: 'Recursion', description: 'Base cases, recursive calls, call stack, tail recursion.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjProg.id, orderIndex: 1 },
  });
  const tBFSDFS = await prisma.topic.upsert({
    where: { id: 'bfs-dfs-seed' }, update: {},
    create: { id: 'bfs-dfs-seed', name: 'BFS & DFS', description: 'Breadth-first and depth-first graph traversal.', difficultyLevel: DifficultyLevel.advanced, subjectId: subjGraph.id, orderIndex: 1 },
  });
  const tShortestPath = await prisma.topic.upsert({
    where: { id: 'shortest-path-seed' }, update: {},
    create: { id: 'shortest-path-seed', name: 'Shortest Path Algorithms', description: 'Dijkstra, Bellman-Ford, Floyd-Warshall.', difficultyLevel: DifficultyLevel.advanced, subjectId: subjGraph.id, orderIndex: 2 },
  });
  const tProofTech = await prisma.topic.upsert({
    where: { id: 'proof-seed' }, update: {},
    create: { id: 'proof-seed', name: 'Proof Techniques', description: 'Direct proof, proof by contradiction, induction.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjLogic.id, orderIndex: 1 },
  });
  const tBST = await prisma.topic.upsert({
    where: { id: 'bst-seed' }, update: {},
    create: { id: 'bst-seed', name: 'Binary Search Trees', description: 'BST insertion, deletion, search and balancing.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjTrees.id, orderIndex: 1 },
  });
  const tAVL = await prisma.topic.upsert({
    where: { id: 'avl-seed' }, update: {},
    create: { id: 'avl-seed', name: 'AVL Trees & Rotations', description: 'Self-balancing BSTs, rotation types, balance factor.', difficultyLevel: DifficultyLevel.advanced, subjectId: subjTrees.id, orderIndex: 2 },
  });
  const tDPIntro = await prisma.topic.upsert({
    where: { id: 'dp-intro-seed' }, update: {},
    create: { id: 'dp-intro-seed', name: 'Dynamic Programming Basics', description: 'Overlapping subproblems, optimal substructure, memoization.', difficultyLevel: DifficultyLevel.advanced, subjectId: subjDP.id, orderIndex: 1 },
  });
  const tSQL = await prisma.topic.upsert({
    where: { id: 'sql-basics-seed' }, update: {},
    create: { id: 'sql-basics-seed', name: 'SQL Fundamentals', description: 'SELECT, WHERE, JOIN, GROUP BY, aggregate functions.', difficultyLevel: DifficultyLevel.beginner, subjectId: subjSQL.id, orderIndex: 1 },
  });
  const tNormalization = await prisma.topic.upsert({
    where: { id: 'normalization-seed' }, update: {},
    create: { id: 'normalization-seed', name: 'Normalization (1NFâ€“BCNF)', description: 'Functional dependencies, normal forms, decomposition.', difficultyLevel: DifficultyLevel.intermediate, subjectId: subjNorm.id, orderIndex: 1 },
  });

  console.log('ðŸ“š Courses, subjects and topics seeded');

  // â”€â”€ 6. Curriculum Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const contentItems = [
    { id: 'c-sorting', title: 'Sorting Algorithms Complete Guide', topicId: tSorting.id, contentText: '# Sorting Algorithms\n\n## Bubble Sort\nRepeatedly swap adjacent elements. **O(nÂ²)** worst case.\n\n## Merge Sort\nDivide and conquer. **O(n log n)** always. Stable sort.\n\n## Quick Sort\nPartition around pivot. **O(n log n)** average, **O(nÂ²)** worst case.\n\n## Heap Sort\nUse max-heap. **O(n log n)** always. Not stable.\n\n## Summary Table\n| Algorithm | Best | Average | Worst | Stable |\n|-----------|------|---------|-------|--------|\n| Bubble | O(n) | O(nÂ²) | O(nÂ²) | Yes |\n| Merge | O(n log n) | O(n log n) | O(n log n) | Yes |\n| Quick | O(n log n) | O(n log n) | O(nÂ²) | No |\n| Heap | O(n log n) | O(n log n) | O(n log n) | No |' },
    { id: 'c-searching', title: 'Searching Algorithms', topicId: tSearching.id, contentText: '# Searching Algorithms\n\n## Linear Search\nSequentially check each element. **O(n)** time.\n\n## Binary Search\nRequires **sorted** array. Divide search space in half each step. **O(log n)** time.\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1\n```\n\n## Interpolation Search\nImprovement over binary search for uniformly distributed data. **O(log log n)** average.' },
    { id: 'c-complexity', title: 'Big-O Complexity Analysis', topicId: tComplexity.id, contentText: '# Time & Space Complexity\n\n## Big-O Notation\nDescribes the **upper bound** of an algorithm\'s growth rate.\n\n## Common Complexities (slowest to fastest)\n- **O(1)** - Constant: array access\n- **O(log n)** - Logarithmic: binary search\n- **O(n)** - Linear: linear search\n- **O(n log n)** - Linearithmic: merge sort\n- **O(nÂ²)** - Quadratic: bubble sort\n- **O(2â¿)** - Exponential: recursive fibonacci\n\n## Space Complexity\nMeasures extra memory used. Merge sort needs **O(n)** space, Quick sort **O(log n)** average.' },
    { id: 'c-polymorphism', title: 'Polymorphism in Depth', topicId: tPolymorphism.id, contentText: '# Polymorphism\n\n## Compile-time Polymorphism (Static)\nAchieved via **method overloading** â€” same name, different parameters.\n\n## Runtime Polymorphism (Dynamic)\nAchieved via **method overriding** â€” subclass redefines parent method.\n\n```java\nclass Animal { void speak() { System.out.println("..."); } }\nclass Dog extends Animal { void speak() { System.out.println("Woof!"); } }\n```\n\n## Interfaces and Abstract Classes\n- Interface: contract with no implementation (Java 7)\n- Abstract class: partial implementation allowed' },
    { id: 'c-inheritance', title: 'Inheritance & Encapsulation', topicId: tInheritance.id, contentText: '# Inheritance & Encapsulation\n\n## Inheritance\nChild class inherits fields and methods from parent.\n- **Single inheritance**: one parent\n- **Multilevel**: chain of parents\n- **Hierarchical**: one parent, many children\n\n## Encapsulation\nBundle data + methods. Use **private** fields + **public** getters/setters.\n\n```java\npublic class BankAccount {\n    private double balance;\n    public double getBalance() { return balance; }\n    public void deposit(double amount) { balance += amount; }\n}\n```' },
    { id: 'c-recursion', title: 'Understanding Recursion', topicId: tRecursion.id, contentText: '# Recursion\n\nA function calls itself to solve a smaller subproblem.\n\n## Two Essential Parts\n1. **Base case** â€” stops the recursion\n2. **Recursive case** â€” reduces problem size\n\n## Classic Examples\n```python\n# Factorial\ndef factorial(n):\n    if n == 0: return 1  # base case\n    return n * factorial(n-1)  # recursive case\n\n# Fibonacci\ndef fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)\n```\n\n## Call Stack\nEach recursive call adds a frame. Deep recursion â†’ Stack Overflow!' },
    { id: 'c-bfsdfs', title: 'Graph Traversal: BFS & DFS', topicId: tBFSDFS.id, contentText: '# BFS & DFS\n\n## Breadth-First Search (BFS)\n- Uses a **Queue**\n- Explores level by level\n- Finds **shortest path** in unweighted graphs\n- Time: **O(V + E)**\n\n## Depth-First Search (DFS)\n- Uses a **Stack** (or recursion)\n- Goes as deep as possible before backtracking\n- Good for **topological sort**, **cycle detection**\n- Time: **O(V + E)**\n\n## Applications\n| BFS | DFS |\n|-----|-----|\n| Shortest path | Topological sort |\n| Level-order traversal | Cycle detection |\n| Peer-to-peer networks | Maze solving |' },
    { id: 'c-shortest', title: 'Shortest Path Algorithms', topicId: tShortestPath.id, contentText: '# Shortest Path Algorithms\n\n## Dijkstra\'s Algorithm\n- Single-source shortest path\n- Works with **non-negative** edge weights\n- Uses a **min-heap priority queue**\n- Time: **O((V + E) log V)**\n\n## Bellman-Ford\n- Handles **negative edge weights**\n- Detects **negative cycles**\n- Time: **O(VE)**\n\n## Floyd-Warshall\n- **All-pairs** shortest path\n- Dynamic programming approach\n- Time: **O(VÂ³)**, Space: **O(VÂ²)**' },
    { id: 'c-bst', title: 'Binary Search Trees', topicId: tBST.id, contentText: '# Binary Search Trees\n\n**Property**: left subtree < root < right subtree\n\n## Operations\n- **Search**: O(log n) avg, O(n) worst\n- **Insert**: O(log n) avg\n- **Delete**: 3 cases (leaf, one child, two children)\n- **In-order** traversal gives sorted output\n\n## Deletion Cases\n1. Node is a leaf â†’ remove directly\n2. Node has one child â†’ replace with child\n3. Node has two children â†’ replace with **in-order successor**' },
    { id: 'c-avl', title: 'AVL Trees', topicId: tAVL.id, contentText: '# AVL Trees\n\nSelf-balancing BST. **Balance factor** = height(left) - height(right). Must be -1, 0, or 1.\n\n## Rotations\n- **LL rotation**: Right rotate at unbalanced node\n- **RR rotation**: Left rotate at unbalanced node\n- **LR rotation**: Left rotate child, then right rotate\n- **RL rotation**: Right rotate child, then left rotate\n\n## Advantage over BST\nGuaranteed **O(log n)** for all operations.' },
    { id: 'c-dp', title: 'Dynamic Programming Introduction', topicId: tDPIntro.id, contentText: '# Dynamic Programming\n\n## Two Key Properties\n1. **Overlapping Subproblems**: same subproblems solved repeatedly\n2. **Optimal Substructure**: optimal solution built from optimal subproblems\n\n## Approaches\n- **Top-down (Memoization)**: recursion + cache\n- **Bottom-up (Tabulation)**: iterative table filling\n\n## Classic Problems\n- Fibonacci: O(n) with DP vs O(2â¿) naive\n- Knapsack 0/1\n- Longest Common Subsequence (LCS)\n- Coin Change\n- Matrix Chain Multiplication' },
    { id: 'c-sql', title: 'SQL Fundamentals', topicId: tSQL.id, contentText: '# SQL Fundamentals\n\n## SELECT Statement\n```sql\nSELECT column1, column2\nFROM table_name\nWHERE condition\nGROUP BY column\nHAVING group_condition\nORDER BY column DESC\nLIMIT 10;\n```\n\n## JOINs\n- **INNER JOIN**: rows matching in both tables\n- **LEFT JOIN**: all rows from left + matching right\n- **RIGHT JOIN**: all rows from right + matching left\n- **FULL OUTER JOIN**: all rows from both\n\n## Aggregate Functions\nCOUNT, SUM, AVG, MAX, MIN' },
    { id: 'c-norm', title: 'Database Normalization', topicId: tNormalization.id, contentText: '# Normalization\n\nProcess of organizing a relational database to reduce redundancy.\n\n## Normal Forms\n- **1NF**: Atomic values, no repeating groups\n- **2NF**: 1NF + no partial dependency on composite key\n- **3NF**: 2NF + no transitive dependency\n- **BCNF**: Every determinant is a candidate key\n\n## Functional Dependencies\nA â†’ B means knowing A determines B uniquely.\n\n## Anomalies Prevented\n- Insert anomaly, Delete anomaly, Update anomaly' },
  ];
  for (const c of contentItems) {
    await prisma.curriculumContent.upsert({
      where: { id: c.id }, update: {},
      create: { ...c, uploadedBy: teacher.id },
    });
  }
  console.log('ðŸ“„ Content seeded (13 content items across 13 topics)');

  // â”€â”€ 7. Questions (5+ per topic, linked to topics) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Helper to avoid re-seeding
  const seedQuestions = async (topicId: string, questions: any[]) => {
    const count = await prisma.question.count({ where: { topicId, assignmentId: null } });
    if (count === 0) await prisma.question.createMany({ data: questions.map(q => ({ ...q, topicId })) });
  };

  await seedQuestions(tSorting.id, [
    { questionText: 'What is the worst-case time complexity of Bubble Sort?', optionA: 'O(n)', optionB: 'O(n log n)', optionC: 'O(nÂ²)', optionD: 'O(1)', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Which sorting algorithm uses divide and conquer?', optionA: 'Bubble Sort', optionB: 'Merge Sort', optionC: 'Selection Sort', optionD: 'Insertion Sort', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'What is the best-case of Quick Sort?', optionA: 'O(nÂ²)', optionB: 'O(1)', optionC: 'O(n)', optionD: 'O(n log n)', correctOption: 'D', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Which sorting algorithm is guaranteed O(n log n) in all cases?', optionA: 'Quick Sort', optionB: 'Bubble Sort', optionC: 'Merge Sort', optionD: 'Insertion Sort', correctOption: 'C', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'Which sorting algorithm is stable?', optionA: 'Quick Sort', optionB: 'Heap Sort', optionC: 'Merge Sort', optionD: 'Selection Sort', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Space complexity of Merge Sort?', optionA: 'O(1)', optionB: 'O(log n)', optionC: 'O(n)', optionD: 'O(nÂ²)', correctOption: 'C', difficultyLevel: DifficultyLevel.advanced },
  ]);

  await seedQuestions(tSearching.id, [
    { questionText: 'Binary search requires the array to be?', optionA: 'Reversed', optionB: 'Unsorted', optionC: 'Sorted', optionD: 'Even-sized', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Time complexity of binary search?', optionA: 'O(n)', optionB: 'O(log n)', optionC: 'O(nÂ²)', optionD: 'O(1)', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Linear search worst case on n elements?', optionA: 'O(log n)', optionB: 'O(1)', optionC: 'O(n)', optionD: 'O(nÂ²)', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'What does binary search return if element not found?', optionA: '0', optionB: 'null', optionC: '-1', optionD: 'undefined', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Binary search mid element when left=2, right=8?', optionA: '4', optionB: '5', optionC: '6', optionD: '3', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
  ]);

  await seedQuestions(tComplexity.id, [
    { questionText: 'O(1) means?', optionA: 'Linear time', optionB: 'Constant time', optionC: 'Quadratic time', optionD: 'Logarithmic time', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Which is fastest for large n?', optionA: 'O(nÂ²)', optionB: 'O(n log n)', optionC: 'O(n)', optionD: 'O(log n)', correctOption: 'D', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'What notation gives the tight bound?', optionA: 'Big-O', optionB: 'Big-Omega', optionC: 'Big-Theta', optionD: 'Little-o', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Space complexity of an algorithm with a 2D nÃ—n array?', optionA: 'O(n)', optionB: 'O(nÂ²)', optionC: 'O(2n)', optionD: 'O(1)', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Accessing an element in an array by index is?', optionA: 'O(n)', optionB: 'O(log n)', optionC: 'O(nÂ²)', optionD: 'O(1)', correctOption: 'D', difficultyLevel: DifficultyLevel.beginner },
  ]);

  await seedQuestions(tPolymorphism.id, [
    { questionText: 'Method overriding is an example of?', optionA: 'Encapsulation', optionB: 'Compile-time polymorphism', optionC: 'Runtime polymorphism', optionD: 'Abstraction', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Method overloading is resolved at?', optionA: 'Runtime', optionB: 'Compile time', optionC: 'Link time', optionD: 'Load time', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Which keyword is used for runtime polymorphism in Java?', optionA: 'static', optionB: 'final', optionC: 'override', optionD: 'abstract', correctOption: 'D', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Operator overloading is supported in?', optionA: 'Java', optionB: 'C++', optionC: 'Python only', optionD: 'Neither', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'An interface in Java is an example of?', optionA: 'Concrete class', optionB: 'Polymorphism contract', optionC: 'Data type', optionD: 'Variable', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
  ]);

  await seedQuestions(tInheritance.id, [
    { questionText: 'Which keyword is used to inherit a class in Java?', optionA: 'implements', optionB: 'inherits', optionC: 'extends', optionD: 'base', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Private members of a parent class are?', optionA: 'Inherited and accessible', optionB: 'Not inherited', optionC: 'Inherited but not accessible directly', optionD: 'Converted to public', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'What prevents a class from being inherited in Java?', optionA: 'private class', optionB: 'abstract class', optionC: 'final class', optionD: 'static class', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'What is encapsulation?', optionA: 'Hiding implementation details', optionB: 'Multiple inheritance', optionC: 'Method overloading', optionD: 'Type casting', correctOption: 'A', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Which access modifier makes a member accessible only within the same class?', optionA: 'public', optionB: 'protected', optionC: 'default', optionD: 'private', correctOption: 'D', difficultyLevel: DifficultyLevel.beginner },
  ]);

  await seedQuestions(tRecursion.id, [
    { questionText: 'What is required to prevent infinite recursion?', optionA: 'Loop', optionB: 'Base case', optionC: 'Return type', optionD: 'Static keyword', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'factorial(0) in recursive factorial should return?', optionA: '0', optionB: '-1', optionC: '1', optionD: 'undefined', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Each recursive call is stored in?', optionA: 'Heap', optionB: 'Queue', optionC: 'Stack', optionD: 'Array', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Naive recursive Fibonacci has time complexity?', optionA: 'O(n)', optionB: 'O(n log n)', optionC: 'O(2â¿)', optionD: 'O(nÂ²)', correctOption: 'C', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'Tail recursion can be optimized to use what?', optionA: 'Extra stack', optionB: 'Constant stack space', optionC: 'Heap', optionD: 'Queue', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
  ]);

  await seedQuestions(tBFSDFS.id, [
    { questionText: 'BFS uses which data structure?', optionA: 'Stack', optionB: 'Queue', optionC: 'Heap', optionD: 'Tree', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'DFS uses which data structure?', optionA: 'Queue', optionB: 'Heap', optionC: 'Stack', optionD: 'Linked List', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Which algorithm finds the shortest path in an unweighted graph?', optionA: 'DFS', optionB: 'BFS', optionC: 'Dijkstra', optionD: 'Kruskal', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Time complexity of BFS on a graph with V vertices and E edges?', optionA: 'O(VÂ²)', optionB: 'O(V log V)', optionC: 'O(V + E)', optionD: 'O(EÂ²)', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Which traversal is used for topological sorting?', optionA: 'BFS', optionB: 'DFS', optionC: 'Both', optionD: 'Neither', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'DFS on a disconnected graph visits?', optionA: 'Only first component', optionB: 'All components if called for each unvisited node', optionC: 'No components', optionD: 'Random components', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
  ]);

  await seedQuestions(tBST.id, [
    { questionText: 'In a BST left child is always?', optionA: 'Greater than root', optionB: 'Equal to root', optionC: 'Less than root', optionD: 'None of the above', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'In-order traversal of a BST produces?', optionA: 'Random order', optionB: 'Descending order', optionC: 'Sorted ascending order', optionD: 'Level-order', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'BST search average time complexity?', optionA: 'O(n)', optionB: 'O(nÂ²)', optionC: 'O(log n)', optionD: 'O(1)', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Worst case BST search time (skewed)?', optionA: 'O(log n)', optionB: 'O(1)', optionC: 'O(n)', optionD: 'O(n log n)', correctOption: 'C', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'Deleting a node with two children uses?', optionA: 'Pre-order successor', optionB: 'In-order successor', optionC: 'Post-order successor', optionD: 'Level-order', correctOption: 'B', difficultyLevel: DifficultyLevel.advanced },
  ]);

  await seedQuestions(tSQL.id, [
    { questionText: 'Which SQL clause filters rows?', optionA: 'GROUP BY', optionB: 'HAVING', optionC: 'WHERE', optionD: 'ORDER BY', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'Which JOIN returns all rows from both tables?', optionA: 'INNER JOIN', optionB: 'LEFT JOIN', optionC: 'RIGHT JOIN', optionD: 'FULL OUTER JOIN', correctOption: 'D', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Which aggregate function counts rows?', optionA: 'SUM', optionB: 'AVG', optionC: 'COUNT', optionD: 'MAX', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
    { questionText: 'HAVING clause is used with?', optionA: 'WHERE', optionB: 'GROUP BY', optionC: 'ORDER BY', optionD: 'LIMIT', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'Which statement modifies existing rows?', optionA: 'INSERT', optionB: 'DELETE', optionC: 'UPDATE', optionD: 'SELECT', correctOption: 'C', difficultyLevel: DifficultyLevel.beginner },
  ]);

  await seedQuestions(tNormalization.id, [
    { questionText: '1NF requires?', optionA: 'No transitive dependency', optionB: 'Atomic column values', optionC: 'No partial dependency', optionD: 'Every determinant is a key', correctOption: 'B', difficultyLevel: DifficultyLevel.beginner },
    { questionText: '2NF requires 1NF plus?', optionA: 'No transitive dependency', optionB: 'No partial dependency', optionC: 'Every determinant is a candidate key', optionD: 'Single primary key', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: '3NF requires 2NF plus?', optionA: 'No partial dependency', optionB: 'Single primary key', optionC: 'No transitive dependency', optionD: 'Every determinant is a key', correctOption: 'C', difficultyLevel: DifficultyLevel.intermediate },
    { questionText: 'BCNF is stronger than?', optionA: '1NF', optionB: '2NF', optionC: '3NF', optionD: 'None', correctOption: 'C', difficultyLevel: DifficultyLevel.advanced },
    { questionText: 'A â†’ B means?', optionA: 'A depends on B', optionB: 'A determines B', optionC: 'A and B are independent', optionD: 'A is a subset of B', correctOption: 'B', difficultyLevel: DifficultyLevel.intermediate },
  ]);

  console.log('â“ Questions seeded (50+ questions across 10 topics)');

  // â”€â”€ 8. Assignments with linked questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const asn1 = await prisma.assignment.upsert({
    where: { id: 'asn-sorting-seed' }, update: {},
    create: { id: 'asn-sorting-seed', title: 'Sorting Algorithms Quiz', description: 'Test your understanding of sorting algorithm complexities and properties.', courseId: course.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 7 * 86400000), strictMode: false },
  });
  const asn2 = await prisma.assignment.upsert({
    where: { id: 'asn-searching-seed' }, update: {},
    create: { id: 'asn-searching-seed', title: 'Searching Algorithms Test', description: 'Binary search and linear search fundamentals.', courseId: course.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 14 * 86400000) },
  });
  const asn3 = await prisma.assignment.upsert({
    where: { id: 'asn-oop-seed' }, update: {},
    create: { id: 'asn-oop-seed', title: 'OOP Concepts Quiz', description: 'Polymorphism, inheritance and encapsulation.', courseId: course.id, teacherId: teacher2.id, dueDate: new Date(Date.now() + 10 * 86400000) },
  });
  const asn4 = await prisma.assignment.upsert({
    where: { id: 'asn-graphs-seed' }, update: {},
    create: { id: 'asn-graphs-seed', title: 'Graph Traversal Exam', description: 'BFS, DFS and shortest-path problems.', courseId: course2.id, teacherId: teacher2.id, dueDate: new Date(Date.now() + 21 * 86400000), strictMode: true },
  });
  const asn5 = await prisma.assignment.upsert({
    where: { id: 'asn-bst-seed' }, update: {},
    create: { id: 'asn-bst-seed', title: 'BST Operations Quiz', description: 'Binary Search Tree insertion, deletion and traversal.', courseId: course3.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 30 * 86400000) },
  });
  const asn6 = await prisma.assignment.upsert({
    where: { id: 'asn-sql-seed' }, update: {},
    create: { id: 'asn-sql-seed', title: 'SQL Basics Assessment', description: 'Fundamental SQL queries, joins and aggregation.', courseId: course4.id, teacherId: teacher2.id, dueDate: new Date(Date.now() + 5 * 86400000), strictMode: true },
  });
  const asn7 = await prisma.assignment.upsert({
    where: { id: 'asn-complexity-seed' }, update: {},
    create: { id: 'asn-complexity-seed', title: 'Complexity Analysis Quiz', description: 'Big-O notation and algorithm analysis.', courseId: course.id, teacherId: teacher.id, dueDate: new Date(Date.now() + 18 * 86400000) },
  });

  // Link questions to assignments
  const linkQToAssignment = async (assignmentId: string, topicId: string, limit: number) => {
    const qs = await prisma.question.findMany({ where: { topicId, assignmentId: null }, take: limit });
    for (const q of qs) {
      await prisma.question.update({ where: { id: q.id }, data: { assignmentId } });
    }
  };
  await linkQToAssignment(asn1.id, tSorting.id, 4);
  await linkQToAssignment(asn2.id, tSearching.id, 4);
  await linkQToAssignment(asn3.id, tPolymorphism.id, 4);
  await linkQToAssignment(asn4.id, tBFSDFS.id, 5);
  await linkQToAssignment(asn5.id, tBST.id, 4);
  await linkQToAssignment(asn6.id, tSQL.id, 4);
  await linkQToAssignment(asn7.id, tComplexity.id, 4);

  console.log('ðŸ“‹ 7 Assignments seeded with linked questions');

  // â”€â”€ 9. Student Attempts & Answers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const makeAttempt = async (id: string, studentId: string, assignmentId: string, score: number, submitted: boolean, flagged = false) => {
    await prisma.studentAttempt.upsert({
      where: { id }, update: {},
      create: {
        id, studentId, assignmentId, score,
        submittedAt: submitted ? new Date(Date.now() - Math.random() * 5 * 86400000) : undefined,
        integrityFlag: flagged,
      },
    });
    // Add answers if submitted
    if (submitted) {
      const ansCount = await prisma.studentAnswer.count({ where: { attemptId: id } });
      if (ansCount === 0) {
        const questions = await prisma.question.findMany({ where: { assignmentId } });
        if (questions.length > 0) {
          await prisma.studentAnswer.createMany({
            data: questions.map(q => ({
              attemptId: id, questionId: q.id,
              selectedOption: q.correctOption,
              isCorrect: true,
              timeTaken: flagged ? 2 : Math.floor(Math.random() * 60) + 15,
            })),
          });
        }
      }
    }
  };

  // Alice's attempts
  await makeAttempt('att-alice-sort', student.id, asn1.id, 85, true);
  await makeAttempt('att-alice-search', student.id, asn2.id, 78, true);
  await makeAttempt('att-alice-oop', student.id, asn3.id, 62, true);
  await makeAttempt('att-alice-graph', student.id, asn4.id, 70, true);
  await makeAttempt('att-alice-bst', student.id, asn5.id, 88, true);
  await makeAttempt('att-alice-sql', student.id, asn6.id, 91, true);
  await makeAttempt('att-alice-complexity', student.id, asn7.id, 76, false); // in progress

  // Bob's attempts
  await makeAttempt('att-bob-sort', student2.id, asn1.id, 60, true);
  await makeAttempt('att-bob-search', student2.id, asn2.id, 55, true);
  await makeAttempt('att-bob-oop', student2.id, asn3.id, 72, true);
  await makeAttempt('att-bob-graph', student2.id, asn4.id, 48, true);
  await makeAttempt('att-bob-sql', student2.id, asn6.id, 65, true);

  // Carol's attempts
  await makeAttempt('att-carol-sort', student3.id, asn1.id, 95, true);
  await makeAttempt('att-carol-oop', student3.id, asn3.id, 89, true);
  await makeAttempt('att-carol-graph', student3.id, asn4.id, 88, true);
  await makeAttempt('att-carol-bst', student3.id, asn5.id, 92, true);
  await makeAttempt('att-carol-sql', student3.id, asn6.id, 87, true);

  // David's attempts (with integrity flag â€” suspiciously fast)
  await makeAttempt('att-david-sort', student4.id, asn1.id, 100, true, true); // flagged
  await makeAttempt('att-david-search', student4.id, asn2.id, 100, true, true); // flagged
  await makeAttempt('att-david-bst', student4.id, asn5.id, 90, true);
  await makeAttempt('att-david-complexity', student4.id, asn7.id, 82, true);

  // Emma's attempts
  await makeAttempt('att-emma-sort', student5.id, asn1.id, 74, true);
  await makeAttempt('att-emma-sql', student5.id, asn6.id, 93, true);
  await makeAttempt('att-emma-bst', student5.id, asn5.id, 80, true);

  console.log('âœï¸ Student attempts and answers seeded');

  // â”€â”€ 10. Student XP & Levels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const xpData = [
    { userId: student.id, totalXp: 3200, level: 8, streakDays: 7 },
    { userId: student2.id, totalXp: 1800, level: 5, streakDays: 3 },
    { userId: student3.id, totalXp: 4500, level: 11, streakDays: 14 },
    { userId: student4.id, totalXp: 2100, level: 6, streakDays: 1 },
    { userId: student5.id, totalXp: 2800, level: 7, streakDays: 5 },
  ];
  for (const x of xpData) {
    await prisma.studentXP.upsert({
      where: { userId: x.userId },
      update: { totalXp: x.totalXp, level: x.level, streakDays: x.streakDays },
      create: x,
    });
  }

  // XP Logs (rich history)
  const xpLogsCount = await prisma.xPLog.count({ where: { userId: student.id } });
  if (xpLogsCount === 0) {
    await prisma.xPLog.createMany({
      data: [
        { userId: student.id, source: XPSource.quiz, xpAmount: 150, createdAt: new Date(Date.now() - 14 * 86400000) },
        { userId: student.id, source: XPSource.practice, xpAmount: 40, createdAt: new Date(Date.now() - 12 * 86400000) },
        { userId: student.id, source: XPSource.flashcard, xpAmount: 20, createdAt: new Date(Date.now() - 10 * 86400000) },
        { userId: student.id, source: XPSource.streak, xpAmount: 100, createdAt: new Date(Date.now() - 7 * 86400000) },
        { userId: student.id, source: XPSource.quiz, xpAmount: 200, createdAt: new Date(Date.now() - 5 * 86400000) },
        { userId: student.id, source: XPSource.boss_battle, xpAmount: 250, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student.id, source: XPSource.practice, xpAmount: 60, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student.id, source: XPSource.spin_wheel, xpAmount: 75, createdAt: new Date(Date.now() - 86400000) },
        { userId: student.id, source: XPSource.quiz, xpAmount: 180, createdAt: new Date() },
        { userId: student2.id, source: XPSource.quiz, xpAmount: 100, createdAt: new Date(Date.now() - 5 * 86400000) },
        { userId: student2.id, source: XPSource.practice, xpAmount: 35, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student2.id, source: XPSource.streak, xpAmount: 50, createdAt: new Date(Date.now() - 86400000) },
        { userId: student3.id, source: XPSource.streak, xpAmount: 200, createdAt: new Date(Date.now() - 7 * 86400000) },
        { userId: student3.id, source: XPSource.quiz, xpAmount: 300, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student3.id, source: XPSource.boss_battle, xpAmount: 350, createdAt: new Date() },
        { userId: student4.id, source: XPSource.quiz, xpAmount: 50, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student4.id, source: XPSource.spin_wheel, xpAmount: 100, createdAt: new Date() },
        { userId: student5.id, source: XPSource.flashcard, xpAmount: 80, createdAt: new Date(Date.now() - 4 * 86400000) },
        { userId: student5.id, source: XPSource.quiz, xpAmount: 120, createdAt: new Date(Date.now() - 86400000) },
        { userId: student5.id, source: XPSource.streak, xpAmount: 150, createdAt: new Date() },
      ],
    });
  }
  console.log('ðŸŽ® XP and gamification seeded');

  // â”€â”€ 11. Boss Battles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const battleCount = await prisma.bossBattle.count({ where: { userId: student.id } });
  if (battleCount === 0) {
    await prisma.bossBattle.createMany({
      data: [
        { userId: student.id, topicId: tSorting.id, bossHp: 0, playerHp: 65, status: BattleStatus.won, startedAt: new Date(Date.now() - 5 * 86400000), endedAt: new Date(Date.now() - 5 * 86400000 + 600000) },
        { userId: student.id, topicId: tBFSDFS.id, bossHp: 40, playerHp: 0, status: BattleStatus.lost, startedAt: new Date(Date.now() - 3 * 86400000), endedAt: new Date(Date.now() - 3 * 86400000 + 480000) },
        { userId: student.id, topicId: tBST.id, bossHp: 0, playerHp: 80, status: BattleStatus.won, startedAt: new Date(Date.now() - 86400000), endedAt: new Date(Date.now() - 86400000 + 720000) },
        { userId: student2.id, topicId: tSorting.id, bossHp: 20, playerHp: 0, status: BattleStatus.lost, startedAt: new Date(Date.now() - 4 * 86400000), endedAt: new Date(Date.now() - 4 * 86400000 + 540000) },
        { userId: student3.id, topicId: tSorting.id, bossHp: 0, playerHp: 90, status: BattleStatus.won, startedAt: new Date(Date.now() - 2 * 86400000), endedAt: new Date(Date.now() - 2 * 86400000 + 420000) },
        { userId: student3.id, topicId: tBFSDFS.id, bossHp: 0, playerHp: 75, status: BattleStatus.won, startedAt: new Date(Date.now() - 86400000), endedAt: new Date(Date.now() - 86400000 + 660000) },
        { userId: student4.id, topicId: tBST.id, bossHp: 100, playerHp: 100, status: BattleStatus.active, startedAt: new Date() },
        { userId: student5.id, topicId: tSQL.id, bossHp: 0, playerHp: 85, status: BattleStatus.won, startedAt: new Date(Date.now() - 86400000), endedAt: new Date(Date.now() - 86400000 + 500000) },
      ],
    });
  }

  // â”€â”€ 12. Flashcard Progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const flashCount = await prisma.flashcardProgress.count({ where: { userId: student.id } });
  if (flashCount === 0) {
    const flashcards = [
      // Sorting
      { userId: student.id, topicId: tSorting.id, cardText: 'What is the time complexity of Merge Sort?', known: true, repetitionCount: 3 },
      { userId: student.id, topicId: tSorting.id, cardText: 'Is Quick Sort stable?', known: false, repetitionCount: 2 },
      { userId: student.id, topicId: tSorting.id, cardText: 'Which sort uses a pivot element?', known: true, repetitionCount: 4 },
      { userId: student.id, topicId: tSorting.id, cardText: 'Space complexity of Heap Sort?', known: false, repetitionCount: 1 },
      // BFS/DFS
      { userId: student.id, topicId: tBFSDFS.id, cardText: 'BFS uses which data structure?', known: true, repetitionCount: 5 },
      { userId: student.id, topicId: tBFSDFS.id, cardText: 'Which traversal finds shortest path in unweighted graph?', known: true, repetitionCount: 3 },
      { userId: student.id, topicId: tBFSDFS.id, cardText: 'DFS time complexity?', known: false, repetitionCount: 1 },
      // BST
      { userId: student.id, topicId: tBST.id, cardText: 'In-order traversal of BST gives what output?', known: true, repetitionCount: 4 },
      { userId: student.id, topicId: tBST.id, cardText: 'Worst case for BST search?', known: false, repetitionCount: 2 },
      // Student2
      { userId: student2.id, topicId: tSorting.id, cardText: 'Which algorithm is O(n log n) in all cases?', known: false, repetitionCount: 1 },
      { userId: student2.id, topicId: tSorting.id, cardText: 'Bubble sort best case complexity?', known: true, repetitionCount: 2 },
      { userId: student3.id, topicId: tBFSDFS.id, cardText: 'BFS vs DFS: which uses more memory for wide graphs?', known: true, repetitionCount: 3 },
      { userId: student3.id, topicId: tSorting.id, cardText: 'What is a stable sort?', known: true, repetitionCount: 5 },
      { userId: student5.id, topicId: tSQL.id, cardText: 'Difference between WHERE and HAVING?', known: true, repetitionCount: 3 },
      { userId: student5.id, topicId: tSQL.id, cardText: 'What does INNER JOIN return?', known: false, repetitionCount: 1 },
    ];
    await prisma.flashcardProgress.createMany({ data: flashcards });
  }

  // â”€â”€ 13. Spin Wheel Rewards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const spinCount = await prisma.spinReward.count({ where: { userId: student.id } });
  if (spinCount === 0) {
    await prisma.spinReward.createMany({
      data: [
        { userId: student.id, rewardType: RewardType.xp_boost, rewardValue: '2x XP for 1 hour' },
        { userId: student.id, rewardType: RewardType.hint_token, rewardValue: '3 Hint Tokens' },
        { userId: student3.id, rewardType: RewardType.bonus_quiz, rewardValue: 'Bonus Quiz: Sorting' },
        { userId: student3.id, rewardType: RewardType.streak_bonus, rewardValue: '+50 XP Streak Bonus' },
        { userId: student5.id, rewardType: RewardType.xp_boost, rewardValue: '1.5x XP for 30 minutes' },
        { userId: student2.id, rewardType: RewardType.hint_token, rewardValue: '2 Hint Tokens' },
      ],
    });
  }

  // â”€â”€ 14. Mastery Graphs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const masteryData = [
    { userId: student.id, topicId: tSorting.id, masteryScore: 7.8, confidenceScore: 0.82, attemptsCount: 8, correctCount: 6 },
    { userId: student.id, topicId: tSearching.id, masteryScore: 6.5, confidenceScore: 0.70, attemptsCount: 5, correctCount: 4 },
    { userId: student.id, topicId: tPolymorphism.id, masteryScore: 5.2, confidenceScore: 0.55, attemptsCount: 4, correctCount: 3 },
    { userId: student.id, topicId: tBFSDFS.id, masteryScore: 4.0, confidenceScore: 0.45, attemptsCount: 6, correctCount: 3 },
    { userId: student.id, topicId: tBST.id, masteryScore: 6.9, confidenceScore: 0.72, attemptsCount: 5, correctCount: 4 },
    { userId: student.id, topicId: tSQL.id, masteryScore: 8.2, confidenceScore: 0.88, attemptsCount: 4, correctCount: 4 },
    { userId: student.id, topicId: tComplexity.id, masteryScore: 5.8, confidenceScore: 0.60, attemptsCount: 4, correctCount: 3 },
    { userId: student.id, topicId: tRecursion.id, masteryScore: 6.0, confidenceScore: 0.65, attemptsCount: 3, correctCount: 2 },

    { userId: student2.id, topicId: tSorting.id, masteryScore: 5.5, confidenceScore: 0.58, attemptsCount: 5, correctCount: 3 },
    { userId: student2.id, topicId: tSearching.id, masteryScore: 4.8, confidenceScore: 0.50, attemptsCount: 4, correctCount: 2 },
    { userId: student2.id, topicId: tPolymorphism.id, masteryScore: 6.2, confidenceScore: 0.66, attemptsCount: 4, correctCount: 3 },
    { userId: student2.id, topicId: tBFSDFS.id, masteryScore: 3.5, confidenceScore: 0.40, attemptsCount: 5, correctCount: 2 },
    { userId: student2.id, topicId: tSQL.id, masteryScore: 5.5, confidenceScore: 0.58, attemptsCount: 4, correctCount: 3 },

    { userId: student3.id, topicId: tSorting.id, masteryScore: 9.2, confidenceScore: 0.95, attemptsCount: 7, correctCount: 7 },
    { userId: student3.id, topicId: tPolymorphism.id, masteryScore: 8.8, confidenceScore: 0.90, attemptsCount: 5, correctCount: 5 },
    { userId: student3.id, topicId: tBFSDFS.id, masteryScore: 8.5, confidenceScore: 0.88, attemptsCount: 6, correctCount: 5 },
    { userId: student3.id, topicId: tBST.id, masteryScore: 9.0, confidenceScore: 0.92, attemptsCount: 5, correctCount: 5 },
    { userId: student3.id, topicId: tSQL.id, masteryScore: 8.3, confidenceScore: 0.85, attemptsCount: 4, correctCount: 4 },

    { userId: student4.id, topicId: tBFSDFS.id, masteryScore: 6.1, confidenceScore: 0.64, attemptsCount: 5, correctCount: 3 },
    { userId: student4.id, topicId: tBST.id, masteryScore: 7.2, confidenceScore: 0.75, attemptsCount: 4, correctCount: 3 },
    { userId: student4.id, topicId: tComplexity.id, masteryScore: 7.0, confidenceScore: 0.73, attemptsCount: 5, correctCount: 4 },
    { userId: student4.id, topicId: tSorting.id, masteryScore: 8.5, confidenceScore: 0.87, attemptsCount: 6, correctCount: 5 },

    { userId: student5.id, topicId: tSQL.id, masteryScore: 8.8, confidenceScore: 0.90, attemptsCount: 5, correctCount: 5 },
    { userId: student5.id, topicId: tNormalization.id, masteryScore: 7.5, confidenceScore: 0.78, attemptsCount: 4, correctCount: 3 },
    { userId: student5.id, topicId: tSorting.id, masteryScore: 6.8, confidenceScore: 0.70, attemptsCount: 4, correctCount: 3 },
    { userId: student5.id, topicId: tBST.id, masteryScore: 7.0, confidenceScore: 0.72, attemptsCount: 4, correctCount: 3 },
  ];
  for (const m of masteryData) {
    const existing = await prisma.masteryGraph.findFirst({ where: { userId: m.userId, topicId: m.topicId } });
    if (!existing) await prisma.masteryGraph.create({ data: m });
  }
  console.log('ðŸ§  Mastery graphs seeded');

  // â”€â”€ 15. Performance Logs (trend data for graphs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const perfCount = await prisma.performanceLog.count({ where: { userId: student.id } });
  if (perfCount === 0) {
    await prisma.performanceLog.createMany({
      data: [
        // Alice â€” improving trend over 2 weeks
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 55, accuracy: 0.58, timeSpent: 240, createdAt: new Date(Date.now() - 13 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.flashcard, score: 60, accuracy: 0.63, timeSpent: 180, createdAt: new Date(Date.now() - 11 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 68, accuracy: 0.70, timeSpent: 200, createdAt: new Date(Date.now() - 9 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.practice, score: 72, accuracy: 0.75, timeSpent: 160, createdAt: new Date(Date.now() - 7 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 78, accuracy: 0.80, timeSpent: 180, createdAt: new Date(Date.now() - 5 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 85, accuracy: 0.88, timeSpent: 140, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 90, accuracy: 0.92, timeSpent: 120, createdAt: new Date(Date.now() - 86400000) },
        { userId: student.id, topicId: tSearching.id, activityType: ActivityType.quiz, score: 60, accuracy: 0.62, timeSpent: 150, createdAt: new Date(Date.now() - 10 * 86400000) },
        { userId: student.id, topicId: tSearching.id, activityType: ActivityType.quiz, score: 72, accuracy: 0.74, timeSpent: 130, createdAt: new Date(Date.now() - 6 * 86400000) },
        { userId: student.id, topicId: tSearching.id, activityType: ActivityType.quiz, score: 78, accuracy: 0.80, timeSpent: 110, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student.id, topicId: tBFSDFS.id, activityType: ActivityType.ai_learning, score: 45, accuracy: 0.48, timeSpent: 300, createdAt: new Date(Date.now() - 8 * 86400000) },
        { userId: student.id, topicId: tBFSDFS.id, activityType: ActivityType.practice, score: 58, accuracy: 0.60, timeSpent: 240, createdAt: new Date(Date.now() - 4 * 86400000) },
        { userId: student.id, topicId: tBFSDFS.id, activityType: ActivityType.quiz, score: 70, accuracy: 0.72, timeSpent: 200, createdAt: new Date(Date.now() - 86400000) },
        { userId: student.id, topicId: tSQL.id, activityType: ActivityType.quiz, score: 88, accuracy: 0.90, timeSpent: 130, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student.id, topicId: tSQL.id, activityType: ActivityType.practice, score: 93, accuracy: 0.95, timeSpent: 100, createdAt: new Date(Date.now() - 86400000) },
        // Bob
        { userId: student2.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 52, accuracy: 0.55, timeSpent: 250, createdAt: new Date(Date.now() - 7 * 86400000) },
        { userId: student2.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 58, accuracy: 0.60, timeSpent: 220, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student2.id, topicId: tBFSDFS.id, activityType: ActivityType.quiz, score: 44, accuracy: 0.46, timeSpent: 280, createdAt: new Date(Date.now() - 4 * 86400000) },
        // Carol â€” high performer
        { userId: student3.id, topicId: tSorting.id, activityType: ActivityType.quiz, score: 93, accuracy: 0.95, timeSpent: 90, createdAt: new Date(Date.now() - 5 * 86400000) },
        { userId: student3.id, topicId: tBFSDFS.id, activityType: ActivityType.quiz, score: 88, accuracy: 0.90, timeSpent: 120, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student3.id, topicId: tPolymorphism.id, activityType: ActivityType.quiz, score: 90, accuracy: 0.92, timeSpent: 100, createdAt: new Date(Date.now() - 86400000) },
        // David
        { userId: student4.id, topicId: tBST.id, activityType: ActivityType.quiz, score: 88, accuracy: 0.90, timeSpent: 130, createdAt: new Date(Date.now() - 3 * 86400000) },
        { userId: student4.id, topicId: tComplexity.id, activityType: ActivityType.quiz, score: 82, accuracy: 0.85, timeSpent: 145, createdAt: new Date(Date.now() - 86400000) },
        // Emma
        { userId: student5.id, topicId: tSQL.id, activityType: ActivityType.quiz, score: 91, accuracy: 0.93, timeSpent: 110, createdAt: new Date(Date.now() - 2 * 86400000) },
        { userId: student5.id, topicId: tBST.id, activityType: ActivityType.quiz, score: 80, accuracy: 0.82, timeSpent: 150, createdAt: new Date(Date.now() - 86400000) },
      ],
    });
  }
  console.log('ðŸ“Š Performance logs seeded');

  // â”€â”€ 16. Weak Topic Flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weakTopics = [
    { userId: student.id, topicId: tBFSDFS.id, weaknessScore: 0.80 },
    { userId: student.id, topicId: tPolymorphism.id, weaknessScore: 0.65 },
    { userId: student2.id, topicId: tSorting.id, weaknessScore: 0.72 },
    { userId: student2.id, topicId: tBFSDFS.id, weaknessScore: 0.85 },
    { userId: student4.id, topicId: tPolymorphism.id, weaknessScore: 0.70 },
    { userId: student4.id, topicId: tBFSDFS.id, weaknessScore: 0.60 },
  ];
  for (const f of weakTopics) {
    const existing = await prisma.weakTopicFlag.findFirst({ where: { userId: f.userId, topicId: f.topicId } });
    if (!existing) await prisma.weakTopicFlag.create({ data: f });
  }
  console.log('ðŸš© Weak topic flags seeded');

  // â”€â”€ 17. Concept Interactions (AI tutor data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ciCount = await prisma.conceptInteraction.count({ where: { userId: student.id } });
  if (ciCount === 0) {
    await prisma.conceptInteraction.createMany({
      data: [
        { userId: student.id, topicId: tSorting.id, interactionType: InteractionType.quiz, correct: true, timeSpent: 45 },
        { userId: student.id, topicId: tSorting.id, interactionType: InteractionType.doubt, correct: true, timeSpent: 120 },
        { userId: student.id, topicId: tBFSDFS.id, interactionType: InteractionType.quiz, correct: false, timeSpent: 60 },
        { userId: student.id, topicId: tBFSDFS.id, interactionType: InteractionType.doubt, correct: true, timeSpent: 200 },
        { userId: student.id, topicId: tBST.id, interactionType: InteractionType.flashcard, correct: true, timeSpent: 30 },
        { userId: student2.id, topicId: tSorting.id, interactionType: InteractionType.quiz, correct: false, timeSpent: 55 },
        { userId: student3.id, topicId: tSorting.id, interactionType: InteractionType.quiz, correct: true, timeSpent: 30 },
        { userId: student3.id, topicId: tBFSDFS.id, interactionType: InteractionType.boss_battle, correct: true, timeSpent: 90 },
      ],
    });
  }

  // â”€â”€ 18. AI Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sessionsCount = await prisma.aISession.count({ where: { userId: student.id } });
  if (sessionsCount === 0) {
    await prisma.aISession.create({
      data: {
        userId: student.id, courseId: course.id, topicId: tSorting.id, mode: AIMode.learning,
        messages: {
          create: [
            { sender: MessageSender.student, messageText: 'Explain Quick Sort to me like I am 5.', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'Imagine a messy pile of toys. You pick one toy as a "pivot" and put smaller toys left, bigger toys right. Keep doing this recursively!', responseType: ResponseType.explanation },
            { sender: MessageSender.student, messageText: 'What is the worst case for Quick Sort and when does it happen?', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'Worst case is O(nÂ²). It happens when pivot is always the smallest or largest â€” like a sorted array with last element as pivot.', responseType: ResponseType.explanation },
            { sender: MessageSender.student, messageText: 'How does Merge Sort guarantee O(n log n)?', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'Merge Sort always divides into exactly 2 halves and merges in O(n). Since we divide log n times, total is O(n log n) â€” no matter the input!', responseType: ResponseType.explanation },
          ],
        },
      },
    });
    await prisma.aISession.create({
      data: {
        userId: student.id, courseId: course.id, topicId: tBFSDFS.id, mode: AIMode.practice,
        messages: {
          create: [
            { sender: MessageSender.student, messageText: 'I am confused about when to use BFS vs DFS.', responseType: ResponseType.hint },
            { sender: MessageSender.ai, messageText: 'Great question! Use BFS when you need shortest path in an unweighted graph. Use DFS for topological sort, cycle detection, or exploring all paths.', responseType: ResponseType.hint },
            { sender: MessageSender.student, messageText: 'Can you give me a practice problem?', responseType: ResponseType.explanation },
            { sender: MessageSender.ai, messageText: 'Sure! Given a grid with obstacles, find the minimum steps from top-left to bottom-right. Which algorithm would you use and why?', responseType: ResponseType.explanation },
          ],
        },
      },
    });
    await prisma.aISession.create({
      data: {
        userId: student3.id, courseId: course2.id, topicId: tBFSDFS.id, mode: AIMode.assessment,
        messages: {
          create: [
            { sender: MessageSender.student, messageText: 'What is the time complexity of BFS?', responseType: ResponseType.restricted },
            { sender: MessageSender.ai, messageText: 'In assessment mode I can only give hints. Think about how many vertices and edges are visited exactly once each...', responseType: ResponseType.restricted },
          ],
        },
      },
    });
  }
  console.log('ðŸ¤– AI sessions seeded');

  // â”€â”€ 19. Teacher Insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const insightCount = await prisma.teacherInsight.count({ where: { teacherId: teacher.id } });
  if (insightCount === 0) {
    await prisma.teacherInsight.createMany({
      data: [
        { teacherId: teacher.id, courseId: course.id, topicId: tSorting.id, avgMastery: 6.7, weakStudentCount: 1 },
        { teacherId: teacher.id, courseId: course.id, topicId: tBFSDFS.id, avgMastery: 4.2, weakStudentCount: 3 },
        { teacherId: teacher.id, courseId: course.id, topicId: tSearching.id, avgMastery: 5.9, weakStudentCount: 2 },
        { teacherId: teacher.id, courseId: course3.id, topicId: tBST.id, avgMastery: 7.5, weakStudentCount: 0 },
        { teacherId: teacher2.id, courseId: course2.id, topicId: tBFSDFS.id, avgMastery: 5.8, weakStudentCount: 2 },
        { teacherId: teacher2.id, courseId: course4.id, topicId: tSQL.id, avgMastery: 7.4, weakStudentCount: 1 },
      ],
    });
  }

  // â”€â”€ 20. System Usage Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const logCount = await prisma.systemUsageLog.count({ where: { userId: student.id } });
  if (logCount === 0) {
    await prisma.systemUsageLog.createMany({
      data: [
        { userId: student.id, actionType: 'ai_chat', metadata: { topicId: tSorting.id, mode: 'learning' } },
        { userId: student.id, actionType: 'quiz_attempt', metadata: { assignmentId: asn1.id } },
        { userId: student.id, actionType: 'flashcard_review', metadata: { topicId: tBFSDFS.id } },
        { userId: student.id, actionType: 'boss_battle', metadata: { topicId: tBST.id, result: 'won' } },
        { userId: student2.id, actionType: 'quiz_attempt', metadata: { assignmentId: asn1.id } },
        { userId: student3.id, actionType: 'ai_chat', metadata: { topicId: tBFSDFS.id, mode: 'practice' } },
        { userId: teacher.id, actionType: 'view_cohort_analytics', metadata: { courseId: course.id } },
        { userId: teacher.id, actionType: 'generate_insights', metadata: { courseId: course.id } },
        { userId: teacher2.id, actionType: 'export_report', metadata: { courseId: course2.id } },
        { userId: admin.id, actionType: 'view_admin_dashboard', metadata: {} },
      ],
    });
  }

  console.log('\nâœ… Comprehensive seed completed!');
  console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  console.log('ðŸ“¦ Data summary:');
  console.log('   ðŸ«  1 Institution + AI Policy');
  console.log('   ðŸ‘¥  7 Users (1 admin, 2 teachers, 4 students + Emma)');
  console.log('   ðŸ“š  4 Courses, 9 Subjects, 14 Topics');
  console.log('   ðŸ“„  13 Content documents');
  console.log('   â“  50+ Questions (5+ per topic)');
  console.log('   ðŸ“‹  7 Assignments with linked questions');
  console.log('   âœï¸  20+ Student attempts with answers');
  console.log('   ðŸŽ®  XP logs, boss battles, flashcards, spin rewards');
  console.log('   ðŸ§   26 Mastery graph entries');
  console.log('   ðŸ“Š  25 Performance log entries (trend data)');
  console.log('   ðŸš©  6 Weak topic flags');
  console.log('   ðŸ¤–  3 AI sessions with messages');
  console.log('   ðŸ“ˆ  6 Teacher insight records');
  console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
  console.log('ðŸ“Œ Login credentials (password: password123)');
  console.log('   admin    â†’ admin@campus.edu');
  console.log('   teacher  â†’ teacher@campus.edu   (CS101, CS201)');
  console.log('   teacher2 â†’ teacher2@campus.edu  (Math201, CS301)');
  console.log('   student  â†’ student@campus.edu   (Alice â€” avg performer)');
  console.log('   student2 â†’ bob@campus.edu        (Bob â€” struggling)');
  console.log('   student3 â†’ carol@campus.edu      (Carol â€” top performer)');
  console.log('   student4 â†’ david@campus.edu      (David â€” integrity flag)');
  console.log('   student5 â†’ emma@campus.edu       (Emma â€” SQL specialist)');
  console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');


}

main()
  .catch((e) => {
    console.error('âŒ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

