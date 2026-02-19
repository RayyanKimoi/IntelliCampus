# IntelliCampus - Comprehensive Project Context

> **Complete technical documentation for AI assistants, developers, and onboarding**

---

## 🎯 PROJECT OVERVIEW

**IntelliCampus** is an AI-powered adaptive learning platform that provides personalized education through intelligent tutoring, mastery-based learning progression, and gamification elements.

### Core Mission
- **Adaptive Learning**: Students learn at their own pace with AI-driven personalized content
- **Mastery Tracking**: Knowledge graphs track concept understanding and dependencies
- **Gamification**: XP system, boss battles, flashcards, and rewards keep students engaged
- **AI Governance**: Admin-controlled policies ensure appropriate AI interactions
- **Accessibility First**: ADHD mode, dyslexia fonts, speech-to-text, and focus modes

### Target Users
1. **Students**: Interactive AI tutor, assignments, gamified learning
2. **Teachers**: Course management, analytics, assignment creation, student insights
3. **Admins**: User management, AI policy control, usage analytics, system configuration

---

## 🏗️ ARCHITECTURE

### Current Architecture (February 2026 - Fullstack Next.js)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend Pages & UI Components                    │    │
│  │  (Student/Teacher/Admin dashboards, Auth, etc.)     │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │ Client-side API calls (/api/*)        │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  API Routes (src/app/api/**/route.ts)              │    │
│  │  - Node.js runtime (NOT Edge)                       │    │
│  │  - JWT authentication via getAuthUser()             │    │
│  │  - Role-based access control                        │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Services Layer (Business Logic)                    │    │
│  │  - user.service.ts                                  │    │
│  │  - mastery.service.ts                               │    │
│  │  - gamification.service.ts                          │    │
│  │  - curriculum.service.ts                            │    │
│  │  - assessment.service.ts                            │    │
│  │  - analytics.service.ts                             │    │
│  │  - ai.service.ts                                    │    │
│  │  - accessibility.service.ts                         │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Prisma ORM Client                                  │    │
│  │  - Singleton pattern (src/lib/prisma.ts)            │    │
│  │  - Type-safe database queries                       │    │
│  └──────────────────┬──────────────────────────────────┘    │
└────────────────────┼──────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │  PostgreSQL Database  │
         │    (Supabase)         │
         │  - Connection pooling │
         │  - Direct migrations  │
         └───────────────────────┘

         ┌──────────────────────┐
         │   AI Services         │
         │   (Separate service)  │
         │  - OpenAI GPT         │
         │  - Pinecone Vector DB │
         │  - Speech APIs        │
         └──────────────────────┘
```

### Architecture Evolution
- **Before**: Separate Express backend (port 4000) + Next.js frontend (port 3000)
- **After**: Unified Next.js 15 fullstack app with API routes
- **Reason**: Simpler deployment, better DX, Vercel-native, no CORS issues

---

## 📦 TECHNOLOGY STACK

### Frontend
- **Next.js 15.5.12**: App Router, React Server Components
- **React 19**: Latest React features
- **TypeScript 5.7.2**: Strict type checking
- **Tailwind CSS 3.4**: Utility-first styling
- **shadcn/ui**: Radix UI components (accessible primitives)
- **Zustand 5.0.2**: Lightweight state management
- **Recharts 2.15**: Data visualization

### Backend (API Layer)
- **Next.js API Routes**: RESTful endpoints in `/api`
- **Node.js Runtime**: All routes use `export const runtime = 'nodejs'`
- **JWT Authentication**: `jsonwebtoken` 9.0.2
- **Bcrypt**: Password hashing (`bcryptjs`)
- **Zod**: Schema validation

### Database
- **PostgreSQL**: Relational database (Supabase-hosted)
- **Prisma ORM 6.19.2**: Type-safe database client
- **Connection Pooling**: PgBouncer via Supabase
- **Direct Connection**: For migrations

### AI & ML
- **OpenAI GPT**: Conversational AI tutor
- **Pinecone**: Vector database for RAG (Retrieval Augmented Generation)
- **Speech APIs**: Google Speech (STT) + ElevenLabs (TTS)

### Development Tools
- **PNPM Workspace**: Monorepo package manager
- **ESLint**: Code linting
- **Prettier**: Code formatting (assumed)
- **Prisma Studio**: Database GUI

### Deployment
- **Vercel**: Production hosting (primary target)
- **Supabase**: Database hosting
- **Environment**: Serverless functions

---

## 🗄️ DATABASE SCHEMA

### Schema Overview (578 lines, 30+ models)

The database is organized into **8 main categories**:

#### 1. **Users & Authentication**
```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          UserRole  // student | teacher | admin
  institutionId String
  createdAt     DateTime
  updatedAt     DateTime
  
  // Relations: profile, accessibility, courses, sessions, etc.
}

model UserProfile {
  // Avatar, bio, year of study, department
}

model AccessibilitySettings {
  // ADHD mode, dyslexia font, high contrast, speech, focus mode
}

model Institution {
  // Multi-tenant support: schools/universities
}
```

#### 2. **Courses & Curriculum**
```prisma
model Course {
  id            String
  name          String
  institutionId String
  createdBy     String  // Teacher
  subjects      Subject[]
}

model Subject {
  courseId    String
  name        String
  topics      Topic[]
}

model Topic {
  subjectId       String
  name            String
  description     String
  difficultyLevel DifficultyLevel  // beginner | intermediate | advanced
  orderIndex      Int
  prerequisites   TopicPrerequisite[]
  questions       Question[]
}

model CurriculumContent {
  // PDF, video, text content uploaded by teachers
  topicId      String
  contentType  String  // pdf | video | text
  fileUrl      String?
  textContent  String?
}

model TopicPrerequisite {
  // Defines learning path dependencies
  topicId         String
  prerequisiteId  String
}
```

#### 3. **AI Interaction & Sessions**
```prisma
model AISession {
  id         String
  userId     String
  courseId   String
  topicId    String
  mode       AIMode  // learning | assessment | practice
  startedAt  DateTime
  endedAt    DateTime?
  messages   AIMessage[]
}

model AIMessage {
  sessionId     String
  sender        MessageSender  // student | ai
  messageText   String
  responseType  ResponseType?  // explanation | hint | restricted
  timestamp     DateTime
}

model ConceptInteraction {
  // Tracks which concepts student asked about
  userId     String
  topicId    String
  questionAsked String
  wasCorrect    Boolean?
}

model AIPolicySettings {
  // Admin controls for AI behavior
  institutionId        String
  allowDirectAnswers   Boolean
  maxHintsPerTopic     Int
  strictMode           Boolean
  blockedKeywords      String[]
}

model GovernanceLog {
  // Audit trail of AI policy violations
  sessionId       String
  violationType   String
  blockedContent  String
}
```

#### 4. **Mastery Tracking**
```prisma
model MasteryGraph {
  // Student's knowledge graph
  userId       String
  courseId     String
  lastUpdated  DateTime
  nodes        MasteryNode[]
}

model MasteryNode {
  graphId        String
  topicId        String
  masteryLevel   Float    // 0.0 to 1.0
  lastInteraction DateTime
  edges          MasteryEdge[]  // Topic dependencies
}

model MasteryEdge {
  fromNodeId String
  toNodeId   String
  strength   Float  // Dependency strength
}

model WeakTopicFlag {
  // Automatically flagged weak areas
  userId         String
  topicId        String
  flaggedAt      DateTime
  resolved       Boolean
  improvementTip String?
}

model PerformanceLog {
  // Time-series performance tracking
  userId        String
  courseId      String
  overallScore  Float
  weeklyScore   Float
  logDate       DateTime
}
```

#### 5. **Assignments & Assessment**
```prisma
model Assignment {
  id          String
  courseId    String
  title       String
  description String?
  createdBy   String  // Teacher
  dueDate     DateTime
  strictMode  Boolean  // No hints allowed
  questions   Question[]
  attempts    StudentAttempt[]
}

model Question {
  id              String
  assignmentId    String?
  topicId         String
  questionText    String
  optionA         String
  optionB         String
  optionC         String
  optionD         String
  correctOption   String  // A | B | C | D
  difficultyLevel DifficultyLevel
  explanation     String?
}

model StudentAttempt {
  id            String
  userId        String
  assignmentId  String
  score         Float
  totalQuestions Int
  submittedAt   DateTime
  answers       StudentAnswer[]
}

model StudentAnswer {
  attemptId       String
  questionId      String
  selectedOption  String
  isCorrect       Boolean
  timeTaken       Int  // seconds
}
```

#### 6. **Gamification System**
```prisma
model StudentXP {
  userId          String  @unique
  totalXp         Int     @default(0)
  level           Int     @default(1)
  streakDays      Int     @default(0)
  lastActivityDate DateTime
}

model XPLog {
  userId    String
  source    XPSource  // quiz | boss_battle | flashcard | practice | spin_wheel | streak
  xpAmount  Int
  timestamp DateTime
}

model BossBattle {
  // Gamified quiz mode: defeat the "boss" by answering questions
  id          String
  userId      String
  topicId     String
  status      BattleStatus  // active | won | lost
  score       Int
  lives       Int  // Start with 3, lose on wrong answer
  startedAt   DateTime
  completedAt DateTime?
  questions   Question[]
}

model FlashcardProgress {
  userId       String
  topicId      String
  cardsReviewed Int
  correctCount  Int
  lastReviewedAt DateTime
}

model SpinReward {
  userId      String
  rewardType  RewardType  // xp_boost | hint_token | bonus_quiz | streak_bonus
  rewardValue Int
  earnedAt    DateTime
  claimed     Boolean
}

model Leaderboard {
  // Daily/weekly/monthly XP rankings
  userId      String
  totalXp     Int
  rank        Int
  period      String  // daily | weekly | monthly
  periodStart DateTime
}
```

#### 7. **Analytics & Insights**
```prisma
model TeacherInsight {
  id           String
  courseId     String
  teacherId    String
  metricName   String  // avg_score | completion_rate | at_risk_count
  metricValue  Float
  generatedAt  DateTime
}

model SystemUsageLog {
  userId        String
  activityType  ActivityType  // quiz | assignment | boss_battle | ai_learning
  duration      Int  // seconds
  timestamp     DateTime
}
```

#### 8. **Admin & Governance**
```prisma
model AIPolicySettings {
  // Already described above
}

model GovernanceLog {
  // Already described above
}
```

### Key Database Patterns
- **CUID**: Using `cuid()` for all primary keys (collision-resistant)
- **Timestamps**: `createdAt`, `updatedAt`, `timestamp` tracking
- **Soft Deletes**: Using `onDelete: Cascade` for referential integrity
- **Indexes**: On foreign keys and frequently queried fields
- **Enums**: Type-safe constants (UserRole, AIMode, etc.)

---

## 📂 PROJECT STRUCTURE

### Monorepo Layout
```
IntelliCampus/
├── frontend/          ⭐ PRIMARY - Fullstack Next.js app
├── backend/           ⚠️  LEGACY - Being deprecated
├── ai-services/       🤖 Separate AI microservice
├── shared/            📦 Shared types & constants
└── scripts/           🛠️ Utility scripts
```

### Frontend Structure (Detailed)
```
frontend/
├── prisma/
│   ├── schema.prisma           # Complete database schema (580 lines)
│   ├── seed.ts                 # Database seeding script
│   └── migrations/             # All database migrations
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (pages)
│   │   │   ├── layout.tsx      # Root layout with providers
│   │   │   ├── page.tsx        # Home/landing page
│   │   │   ├── auth/           # Login, register pages
│   │   │   ├── student/        # Student role pages
│   │   │   ├── teacher/        # Teacher role pages
│   │   │   └── admin/          # Admin role pages
│   │   │
│   │   └── api/                # Backend API Routes ⭐
│   │       ├── auth/
│   │       │   ├── login/route.ts       # POST /api/auth/login
│   │       │   ├── register/route.ts    # POST /api/auth/register
│   │       │   ├── me/route.ts          # GET /api/auth/me
│   │       │   └── profile/route.ts     # GET/PUT /api/auth/profile
│   │       ├── student/
│   │       │   ├── dashboard/route.ts
│   │       │   └── performance/trend/route.ts
│   │       ├── teacher/
│   │       │   └── dashboard/route.ts
│   │       ├── admin/
│   │       │   ├── dashboard/stats/route.ts
│   │       │   ├── users/route.ts
│   │       │   └── ai-policy/route.ts
│   │       └── gamification/
│   │           └── xp/route.ts
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components (18+ files)
│   │   ├── ai/                 # ChatWindow, MessageBubble, VoiceInput
│   │   ├── charts/             # Performance charts
│   │   └── layout/             # DashboardLayout, Sidebar
│   │
│   ├── features/               # Feature-based modules (if any)
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useMastery.ts       # Mastery tracking hook
│   │   ├── useVoice.ts         # Speech recognition hook
│   │   └── useAccessibility.ts # Accessibility settings hook
│   │
│   ├── lib/                    # Core utilities ⭐
│   │   ├── prisma.ts           # Prisma singleton (serverless-safe)
│   │   ├── env.ts              # Environment validation
│   │   ├── jwt.ts              # JWT sign/verify
│   │   ├── auth.ts             # getAuthUser(), requireRole()
│   │   └── utils.ts            # General utilities (cn, etc.)
│   │
│   ├── services/               # Business logic layer ⭐
│   │   ├── user.service.ts            # User CRUD, auth logic
│   │   ├── mastery.service.ts         # Mastery graph operations
│   │   ├── gamification.service.ts    # XP, badges, battles
│   │   ├── curriculum.service.ts      # Courses, subjects, topics
│   │   ├── assessment.service.ts      # Assignments, grading
│   │   ├── analytics.service.ts       # Performance analytics
│   │   ├── ai.service.ts              # AI session management
│   │   ├── accessibility.service.ts   # Accessibility CRUD
│   │   │
│   │   └── (client-side helpers)
│   │       ├── aiService.ts
│   │       ├── authService.ts
│   │       ├── apiClient.ts    # Axios instance (uses /api)
│   │       └── ...Service.ts
│   │
│   ├── store/                  # Zustand state management
│   │   ├── authStore.ts        # User, token, role, login/logout
│   │   ├── masteryStore.ts     # Mastery graph state
│   │   └── uiStore.ts          # UI state (sidebar, theme, etc.)
│   │
│   ├── styles/
│   │   └── globals.css         # Tailwind imports + custom CSS
│   │
│   └── utils/                  # Helper utilities
│       ├── helpers.ts          # API response helpers (Next.js compatible)
│       ├── logger.ts           # Console logging utility
│       └── validators.ts       # Zod schemas for validation
│
├── .env                        # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies & scripts
```

### Shared Package Structure
```
shared/
├── types/                      # Shared TypeScript types
│   ├── user.ts                 # User, AuthTokenPayload
│   ├── course.ts               # Course, Subject, Topic
│   ├── mastery.ts              # MasteryGraph, MasteryNode
│   ├── gamification.ts         # XP, Badge, BossBattle
│   └── api.ts                  # ApiResponse, PaginatedResponse
│
├── constants/                  # Shared constants
│   ├── roles.ts                # USER_ROLES enum
│   ├── modes.ts                # AI_MODES enum
│   └── config.ts               # PAGINATION, GAMIFICATION constants
│
└── index.ts                    # Barrel export
```

### AI Services Structure
```
ai-services/
├── src/
│   ├── config/                 # API configurations
│   │   ├── openai.ts
│   │   ├── pinecone.ts
│   │   └── speech.ts
│   │
│   ├── llm/                    # Language model interaction
│   │   ├── generateResponse.ts
│   │   ├── moderation.ts
│   │   └── responseParser.ts
│   │
│   ├── rag/                    # Retrieval Augmented Generation
│   │   ├── chunker.ts          # Split content into chunks
│   │   ├── embedder.ts         # Generate embeddings
│   │   ├── retriever.ts        # Semantic search
│   │   └── vectorStore.ts      # Pinecone interface
│   │
│   ├── prompt-engine/          # Prompt templates
│   │   ├── assessmentMode.ts
│   │   ├── governedPrompt.ts   # Policy enforcement prompts
│   │   └── hintModePrompt.ts
│   │
│   ├── mastery/                # Mastery analysis
│   │   ├── masteryUpdate.ts
│   │   ├── performanceAnalyzer.ts
│   │   └── weaknessDetector.ts
│   │
│   ├── pipelines/              # AI workflows
│   │   ├── learningPipeline.ts
│   │   ├── assessmentPipeline.ts
│   │   └── gamificationPipeline.ts
│   │
│   └── voice/                  # Speech features
│       ├── speechToText.ts
│       └── textToSpeech.ts
│
└── index.ts                    # Main AI service entry
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Authentication Flow
1. **Registration** (`POST /api/auth/register`)
   - Input: name, email, password, role, institutionId
   - Process: Hash password with bcrypt, create user
   - Output: JWT token with 7-day expiry

2. **Login** (`POST /api/auth/login`)
   - Input: email, password
   - Process: Verify password, check user exists
   - Output: JWT token

3. **Token Structure**
```typescript
interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  institutionId: string;
}
```

4. **Token Verification** (in API routes)
```typescript
import { getAuthUser, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);  // Throws if no valid token
  requireRole(user, ['student', 'teacher']);  // Throws if wrong role
  
  // Protected logic here
}
```

### Authorization Patterns

#### Role-Based Access Control (RBAC)
```
student   → Can access: own dashboard, AI chat, assignments, gamification
teacher   → Can access: course management, analytics, assignment creation
admin     → Can access: user management, AI policy, system settings, all data
```

#### Route Protection
- All `/api/*` routes use `getAuthUser()` to verify JWT
- Role-specific routes use `requireRole(user, ['role1', 'role2'])`
- Frontend uses middleware.ts to redirect unauthorized users

### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiry**: 7 days (configurable via JWT_EXPIRES_IN)
- **Token Storage**: Client-side in localStorage (Zustand authStore)
- **HTTPS Only**: In production (Vercel enforces)
- **CORS**: Not needed (same-origin API routes)

---

## 📡 API ROUTES REFERENCE

### Authentication Routes

#### POST `/api/auth/register`
```typescript
// Request
{
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  institutionId: string;
}

// Response
{
  success: true,
  data: {
    token: string;
    user: { id, name, email, role }
  }
}
```

#### POST `/api/auth/login`
```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  success: true,
  data: {
    token: string;
    user: { id, name, email, role }
  }
}
```

#### GET `/api/auth/me`
🔒 Protected (any authenticated user)
```typescript
// Response
{
  success: true,
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    profile: { ... };
  }
}
```

#### PUT `/api/auth/profile`
🔒 Protected (any authenticated user)
```typescript
// Request
{
  name?: string;
  bio?: string;
  avatarUrl?: string;
  yearOfStudy?: number;
  department?: string;
}

// Response
{
  success: true,
  data: { /* updated user */ }
}
```

### Student Routes

#### GET `/api/student/dashboard`
🔒 Protected (student role)
```typescript
// Response
{
  success: true,
  data: {
    xp: { totalXp, level, streakDays };
    recentCourses: Course[];
    upcomingAssignments: Assignment[];
    performanceTrend: { date, score }[];
  }
}
```

#### GET `/api/student/performance/trend`
🔒 Protected (student role)
```typescript
// Query params: ?days=30
// Response
{
  success: true,
  data: [
    { date: '2026-02-01', overallScore: 85.5, weeklyScore: 90 },
    ...
  ]
}
```

### Teacher Routes

#### GET `/api/teacher/dashboard`
🔒 Protected (teacher role)
```typescript
// Response
{
  success: true,
  data: {
    courses: Course[];
    studentCount: number;
    avgClassPerformance: number;
    recentActivity: Activity[];
  }
}
```

### Admin Routes

#### GET `/api/admin/dashboard/stats`
🔒 Protected (admin role)
```typescript
// Response
{
  success: true,
  data: {
    totalUsers: number;
    totalCourses: number;
    activeAISessions: number;
    systemUsageToday: number;
  }
}
```

#### GET `/api/admin/users`
🔒 Protected (admin role)
```typescript
// Query params: ?page=1&limit=20&role=student
// Response
{
  success: true,
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

#### GET/PUT `/api/admin/ai-policy`
🔒 Protected (admin role)
```typescript
// GET Response
{
  success: true,
  data: {
    allowDirectAnswers: boolean;
    maxHintsPerTopic: number;
    strictMode: boolean;
    blockedKeywords: string[];
  }
}

// PUT Request
{
  allowDirectAnswers?: boolean;
  maxHintsPerTopic?: number;
  strictMode?: boolean;
  blockedKeywords?: string[];
}
```

### Gamification Routes

#### GET `/api/gamification/xp`
🔒 Protected (student role)
```typescript
// Response
{
  success: true,
  data: {
    totalXp: number;
    level: number;
    streakDays: number;
    xpForNextLevel: number;
    xpProgress: number;
  }
}
```

### API Route Conventions
1. **Runtime**: All routes use `export const runtime = 'nodejs'`
2. **Dynamic**: All routes use `export const dynamic = 'force-dynamic'`
3. **Error Handling**: Try-catch blocks return `{ success: false, error: string }`
4. **Status Codes**:
   - 200: Success
   - 400: Bad request / validation error
   - 401: Authentication required / invalid token
   - 403: Insufficient permissions
   - 500: Internal server error

---

## 🎮 KEY FEATURES

### 1. AI-Powered Tutoring
- **Modes**:
  - 🎓 **Learning Mode**: Student asks questions, AI explains concepts
  - 📝 **Assessment Mode**: AI asks questions, student answers (no direct answers)
  - 🎯 **Practice Mode**: Balanced hints and guidance
  
- **Governance**:
  - Admins control AI behavior via AIPolicySettings
  - Blocked keywords prevent cheating
  - Hint limits per topic
  - Strict mode disables all hints

- **RAG (Retrieval Augmented Generation)**:
  - Teachers upload PDFs/videos to topics
  - Content is chunked and embedded
  - AI retrieves relevant context before answering
  - Ensures answers are grounded in course material

### 2. Mastery-Based Learning
- **Knowledge Graph**:
  - Each student has a MasteryGraph per course
  - Nodes represent topics with mastery levels (0.0 to 1.0)
  - Edges represent topic dependencies

- **Adaptive Learning Path**:
  - System suggests next topics based on mastery
  - Prerequisites must reach threshold before advanced topics
  - Weak topics are automatically flagged

- **Performance Analytics**:
  - Time-series tracking of overall/weekly scores
  - Teacher dashboard shows class-wide insights
  - At-risk students are identified automatically

### 3. Gamification System

#### XP & Leveling
- **XP Sources**:
  - Complete quiz: 50 XP
  - Win boss battle: 100 XP
  - Complete flashcard set: 30 XP
  - Daily practice: 20 XP
  - Maintain streak: 10 XP/day
  - Spin wheel bonus: 5-50 XP

- **Level Calculation**:
  ```javascript
  level = floor(totalXp / 500) + 1
  ```

- **Streak System**:
  - Login daily to maintain streak
  - Streak bonuses increase with consecutive days
  - Missing a day resets streak to 1

#### Boss Battles
- **Concept**: Gamified quiz where student "fights" a boss
- **Mechanics**:
  - Start with 3 lives
  - Answer questions correctly to deal damage
  - Wrong answer = lose 1 life
  - Defeat boss = 100 XP + badge
  - Difficulty scales with topic level

#### Flashcards
- **Spaced Repetition**: Cards shown based on previous performance
- **Progress Tracking**: Cards reviewed, correct count, last review date
- **XP Rewards**: Complete set = 30 XP

#### Spin Wheel
- **Rewards**:
  - XP Boost (2x XP for next activity)
  - Hint Tokens (extra hints in assessment mode)
  - Bonus Quiz (extra XP opportunity)
  - Streak Bonus (+5 to current streak)

#### Leaderboards
- **Periods**: Daily, weekly, monthly
- **Ranking**: Based on total XP earned in period
- **Privacy**: Optional (students can opt out)

### 4. Accessibility Features

#### ADHD Mode
- Reduces visual clutter
- Larger clickable areas
- Simplified navigation
- Progress indicators

#### Dyslexia Font
- OpenDyslexic font family
- Increased letter spacing
- Higher line height

#### High Contrast
- WCAG AAA compliant colors
- Bold text
- Enhanced borders

#### Speech Features
- **Text-to-Speech**: Read content aloud
- **Speech-to-Text**: Voice input for questions
- **Custom Voices**: Multiple voice options

#### Focus Mode
- Hides distractions (leaderboard, XP, notifications)
- Timer with breaks (Pomodoro-style)
- Zen interface

### 5. Assignment System

#### Assignment Creation (Teachers)
- Create assignment with title, description, due date
- Add questions from question bank or create new
- Set difficulty level per question
- Enable/disable strict mode (no AI help)

#### Student Submission
- View assigned questions
- Submit answers (multiple choice)
- Track time spent per question
- Instant feedback (if enabled)

#### Grading
- Automatic grading for multiple choice
- Score calculation: (correct / total) * 100
- Detailed analytics per student
- Export results to CSV

---

## 🧩 BUSINESS LOGIC (Services Layer)

### user.service.ts
**Purpose**: User authentication, registration, profile management

**Key Methods**:
- `registerUser(data)`: Hash password, create user, return JWT
- `loginUser(email, password)`: Verify credentials, return JWT
- `getUserById(userId)`: Fetch user with relations
- `updateUserProfile(userId, data)`: Update name, bio, avatar, etc.
- `getAllUsers(filters, pagination)`: Admin user list with filtering

**Business Rules**:
- Passwords must be >= 8 characters
- Email must be unique
- Role is immutable after registration
- JWT expires in 7 days

---

### mastery.service.ts
**Purpose**: Manage mastery graphs, track concept understanding

**Key Methods**:
- `getOrCreateMasteryGraph(userId, courseId)`: Initialize graph
- `updateMasteryLevel(userId, topicId, score)`: Update mastery after activity
- `calculateNextTopics(userId, courseId)`: Recommend topics based on prerequisites
- `flagWeakTopics(userId)`: Auto-detect topics below threshold
- `getMasteryOverview(userId, courseId)`: Dashboard summary

**Business Rules**:
- Mastery level: 0.0 (no knowledge) to 1.0 (full mastery)
- Mastery updates use weighted average: `newLevel = 0.7 * oldLevel + 0.3 * score`
- Topic unlocked when all prerequisites >= 0.6
- Weak topic flagged when level < 0.4 after 3+ attempts

---

### gamification.service.ts
**Purpose**: XP, levels, badges, boss battles, flashcards

**Key Methods**:
- `awardXP(userId, source, amount)`: Log XP, update level
- `updateStreak(userId)`: Check daily activity, maintain/reset streak
- `getStudentXP(userId)`: Return XP, level, streak, progress to next level
- `startBossBattle(userId, topicId)`: Create battle, fetch questions
- `submitBattleAnswer(battleId, questionId, answer)`: Check answer, update lives
- `updateFlashcardProgress(userId, topicId, correct)`: Track flashcard reviews
- `spinWheel(userId)`: Random reward generation

**Business Rules**:
- Level calculation: `level = floor(totalXp / 500) + 1`
- Streak resets if no activity > 24 hours
- Boss battles start with 3 lives, lose 1 per wrong answer
- Flashcard sets require 80% correct for completion bonus

---

### curriculum.service.ts
**Purpose**: Courses, subjects, topics, content management

**Key Methods**:
- `createCourse(teacherId, name, description)`: Create course
- `addSubjectToCourse(courseId, name)`: Add subject
- `createTopic(subjectId, name, difficulty, prerequisites)`: Define topic
- `uploadContent(topicId, file, type)`: Upload PDF/video/text
- `getTopicContent(topicId)`: Retrieve content for RAG
- `listCourses(filters)`: Browse courses

**Business Rules**:
- Topics have orderIndex for sequential learning
- Prerequisites enforce learning path (can't skip ahead)
- Content types: pdf, video, text, link
- Teachers can only edit own courses (unless admin)

---

### assessment.service.ts
**Purpose**: Assignments, questions, grading, submissions

**Key Methods**:
- `createAssignment(teacherId, courseId, data)`: Create assignment
- `addQuestionToAssignment(assignmentId, questionData)`: Add question
- `submitAssignment(userId, assignmentId, answers)`: Student submission
- `gradeSubmission(attemptId)`: Calculate score, update mastery
- `getStudentAttempts(userId, assignmentId)`: View past attempts
- `getAssignmentAnalytics(assignmentId)`: Teacher analytics

**Business Rules**:
- Questions are multiple choice (A, B, C, D)
- Each question has difficulty level (affects mastery calculation)
- Strict mode prevents AI hints during attempt
- Students can retake assignments (configurable)
- Grading is instant for multiple choice

---

### analytics.service.ts
**Purpose**: Performance tracking, insights, reporting

**Key Methods**:
- `getStudentDashboard(userId)`: XP, courses, assignments, performance
- `getPerformanceTrend(userId, days)`: Time-series scores
- `getTeacherInsights(teacherId)`: Class analytics, at-risk students
- `getAdminStats()`: System-wide metrics
- `logActivity(userId, activityType, duration)`: Track usage
- `identifyAtRiskStudents(courseId)`: Low performance alerts

**Business Rules**:
- Performance scores logged daily
- At-risk threshold: < 60% average over 2 weeks
- Teacher insights generated weekly
- Usage logs retained for 90 days

---

### ai.service.ts
**Purpose**: AI session management, chat history, policy enforcement

**Key Methods**:
- `createAISession(userId, courseId, topicId, mode)`: Start chat session
- `addMessage(sessionId, sender, messageText)`: Log message
- `getSessionHistory(sessionId)`: Retrieve chat history
- `checkGovernance(sessionId, messageText)`: Enforce AI policy
- `endSession(sessionId)`: Close session, analyze for mastery updates

**Business Rules**:
- Sessions tied to specific topic (focused learning)
- Mode determines AI behavior (learning/assessment/practice)
- Governance checks for blocked keywords, hint limits
- Sessions auto-close after 1 hour of inactivity

---

### accessibility.service.ts
**Purpose**: Accessibility settings CRUD

**Key Methods**:
- `getAccessibilitySettings(userId)`: Fetch settings
- `updateAccessibilitySettings(userId, settings)`: Save preferences
- `getDefaultSettings()`: Default values for new users

**Business Rules**:
- Settings are per-user, not per-course
- Defaults: all features off, fontScale = 1.0
- Settings apply globally across all pages

---

## 🌐 FRONTEND ARCHITECTURE

### State Management (Zustand)

#### authStore.ts
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  login: (email, password) => Promise<void>;
  logout: () => void;
  setUser: (user) => void;
  updateProfile: (data) => Promise<void>;
}
```

#### masteryStore.ts
```typescript
interface MasteryStore {
  masteryGraph: MasteryGraph | null;
  weakTopics: Topic[];
  
  fetchMastery: (courseId) => Promise<void>;
  refreshMastery: () => Promise<void>;
}
```

#### uiStore.ts
```typescript
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  toggleSidebar: () => void;
  setTheme: (theme) => void;
}
```

### Custom Hooks

#### useAuth.ts
- Wraps authStore
- Provides `login`, `logout`, `isAuthenticated`, `user`
- Handles token refresh (if implemented)

#### useMastery.ts
- Fetches mastery graph
- Provides `masteryLevel(topicId)` helper
- Tracks weak topics

#### useVoice.ts
- Speech recognition (browser API)
- Text-to-speech (Web Speech API or ElevenLabs)
- Microphone permissions

#### useAccessibility.ts
- Fetches accessibility settings
- Applies CSS classes based on settings
- Provides update function

### Component Patterns

#### Page Components
- Located in `src/app/(role)/page.tsx`
- Use `use client` for interactivity
- Fetch data via API calls (client-side) or Server Components
- Show loading skeletons while fetching

#### Layout Components
- `DashboardLayout`: Main wrapper with sidebar, header
- Role-specific layouts: student, teacher, admin

#### UI Components (shadcn/ui)
- Radix UI primitives with Tailwind styling
- Accessible by default (ARIA labels, keyboard nav)
- Examples: Button, Card, Dialog, Select, Tabs

---

## 🚀 DEPLOYMENT

### Vercel Deployment

#### Prerequisites
- GitHub repository connected to Vercel
- Environment variables configured in Vercel dashboard
- Database (Supabase) reachable from Vercel

#### Build Configuration
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

#### Environment Variables (Vercel)
```
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...supabase.co:5432/postgres
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=intellicampus
PINECONE_ENVIRONMENT=us-east-1
```

#### Deployment Steps
1. Push to GitHub main branch
2. Vercel auto-deploys
3. Run migrations: `pnpm prisma migrate deploy`
4. Seed database (if needed): `pnpm prisma:seed`

#### Important Notes
- **Node.js Runtime Required**: All API routes use `runtime = 'nodejs'`
- **Prisma Generate**: Runs automatically in build via `postinstall` script
- **Serverless Functions**: Each API route is a separate serverless function
- **Cold Starts**: First request may be slow (~1-2s), then fast

---

## 🛠️ DEVELOPMENT WORKFLOW

### Getting Started
```bash
# Clone repository
git clone <repo-url>
cd IntelliCampus

# Install dependencies
pnpm install

# Set up environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your database credentials

# Generate Prisma client
cd frontend
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database (optional)
pnpm prisma:seed

# Start development server
pnpm dev
# → http://localhost:3000
```

### Database Management
```bash
# Create migration
pnpm prisma migrate dev --name migration_name

# Reset database (⚠️ destructive)
pnpm prisma migrate reset

# Open Prisma Studio (GUI)
pnpm prisma:studio
# → http://localhost:5555
```

### Common Tasks

#### Add New API Route
1. Create `frontend/src/app/api/[route]/route.ts`
2. Add `export const runtime = 'nodejs'`
3. Add `export const dynamic = 'force-dynamic'`
4. Implement `GET`, `POST`, `PUT`, `DELETE` functions
5. Use `getAuthUser()` for authentication
6. Use `requireRole()` for authorization

#### Add New Database Model
1. Edit `frontend/prisma/schema.prisma`
2. Add model definition
3. Run `pnpm prisma migrate dev --name add_model_name`
4. Update services to use new model

#### Add New Page
1. Create `frontend/src/app/[role]/[page]/page.tsx`
2. Add to navigation (Sidebar.tsx)
3. Protect with middleware if needed

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Prisma Client Not Generated
**Symptom**: `@prisma/client` import errors
**Solution**:
```bash
cd frontend
pnpm prisma:generate
```

### Issue: JWT Token Expired
**Symptom**: 401 errors on all API calls
**Solution**: Re-login to get fresh token

### Issue: Database Connection Pool Exhausted
**Symptom**: `PrismaClientKnownRequestError: P1001`
**Solution**: Use connection pooling URL (PgBouncer) in production

### Issue: Port 3000 Already in Use
**Solution**:
```bash
# Kill process on port 3000
Get-Process -Name node | Stop-Process -Force
```

### Issue: Build Fails on Vercel
**Check**:
- All environment variables set
- Prisma generate runs in build script
- No TypeScript errors (`pnpm build` locally)
- All API routes have `runtime = 'nodejs'`

---

## 📚 CODING CONVENTIONS

### TypeScript
- **Strict Mode**: Enabled
- **Naming**:
  - PascalCase: Interfaces, types, enums, React components
  - camelCase: Variables, functions, methods
  - SCREAMING_SNAKE_CASE: Constants

### File Naming
- **Routes**: `route.ts` (lowercase)
- **Components**: `ComponentName.tsx` (PascalCase)
- **Services**: `feature.service.ts` (lowercase)
- **Hooks**: `useFeature.ts` (camelCase)

### Imports
- **Absolute Imports**: Use `@/` alias for `src/`
- **Order**: React → Next.js → External → Internal → Relative

### API Routes
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { someService } from '@/services/some.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    requireRole(user, ['student']);
    
    const data = await someService.getData(user.userId);
    
    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : 400 }
    );
  }
}
```

---

## 🔮 FUTURE ENHANCEMENTS

### Planned Features
- [ ] Real-time collaboration (teachers + students)
- [ ] Video conferencing integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (ML-powered predictions)
- [ ] Social features (study groups, peer tutoring)
- [ ] Parent dashboard
- [ ] Certificate generation
- [ ] Third-party integrations (Google Classroom, Canvas)

### Technical Improvements
- [ ] WebSockets for real-time updates
- [ ] Redis caching layer
- [ ] Background job queue (for heavy processing)
- [ ] GraphQL API (alongside REST)
- [ ] E2E testing (Playwright)
- [ ] Performance monitoring (Sentry)
- [ ] CDN for static assets

---

## 📖 LEARNING RESOURCES

### For New Developers
- **Next.js 15**: https://nextjs.org/docs
- **Prisma ORM**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://zustand.docs.pmnd.rs
- **shadcn/ui**: https://ui.shadcn.com

### Project-Specific Docs
- `PROJECT_STRUCTURE.md`: Complete file tree
- `MIGRATION_COMPLETE.md`: Migration from Express to Next.js
- `frontend/prisma/schema.prisma`: Database schema with comments

---

## 💡 TIPS FOR AI ASSISTANTS

### When Editing Code
1. **Always check current file contents** before editing (user may have changed things)
2. **Use multi_replace_string_in_file** for multiple independent edits (more efficient)
3. **Include 3-5 lines of context** in oldString/newString for unambiguous matching
4. **Never break authentication logic** - test after changes
5. **Maintain TypeScript strict typing** - no `any` types unless necessary

### When Creating New Features
1. **Database First**: Add models to schema.prisma
2. **Migration**: Run `prisma migrate dev`
3. **Service Layer**: Add business logic to appropriate service
4. **API Route**: Create Next.js route handler
5. **Frontend**: Update UI and connect to API
6. **Testing**: Manually test the flow end-to-end

### When Debugging
1. **Check Errors**: Use `get_errors` tool
2. **Read Logs**: Check terminal output
3. **Verify Environment**: Ensure `.env` has all required vars
4. **Database State**: Use Prisma Studio to inspect data
5. **Network Tab**: Check browser DevTools for API errors

### Key Rules
- ✅ All API routes MUST have `export const runtime = 'nodejs'`
- ✅ Never import from 'express' (we use Next.js)
- ✅ Use `getAuthUser()` for authentication in API routes
- ✅ Use `NextResponse.json()` for API responses
- ✅ Keep business logic in services, not routes
- ✅ Validate input with Zod schemas
- ✅ Handle errors gracefully with try-catch

---

## 📞 PROJECT CONTACTS

- **Project Lead**: [Your Name]
- **GitHub**: [Repository URL]
- **Documentation**: This file
- **Deployment**: Vercel (production URL)
- **Database**: Supabase (dashboard URL)

---

**Last Updated**: February 18, 2026  
**Architecture**: Fullstack Next.js 15 with API Routes  
**Status**: ✅ Production-Ready (Express fully removed, build passing)
