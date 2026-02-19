# IntelliCampus - AI Assistant Context Prompt

**Copy and paste this entire prompt when asking ChatGPT/Claude for help with IntelliCampus**

---

## Project: IntelliCampus - AI-Powered Adaptive Learning Platform

### Quick Overview
IntelliCampus is a fullstack Next.js 15 educational platform that provides:
- 🤖 AI-powered personalized tutoring with governance controls
- 📊 Mastery-based learning with knowledge graph tracking
- 🎮 Gamification (XP, levels, boss battles, flashcards, spin wheel)
- 👥 Multi-role support (Students, Teachers, Admins)
- ♿ Accessibility features (ADHD mode, dyslexia font, speech, high contrast)
- 📈 Analytics and performance tracking

---

## Current Architecture (Feb 2026)

**Stack:**
- **Frontend & Backend**: Next.js 15.5 (App Router) - Fullstack application
- **Database**: PostgreSQL (Supabase) with Prisma ORM 6.19.2
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: Zustand 5.0.2
- **UI**: Tailwind CSS + shadcn/ui (Radix UI)
- **AI**: OpenAI GPT + Pinecone vector DB
- **Speech**: Google Speech (STT) + ElevenLabs (TTS)
- **Monorepo**: PNPM workspace
- **Deployment**: Vercel (serverless)

**Important Notes:**
- ⚠️ We MIGRATED from Express backend to fullstack Next.js
- ✅ All Express code has been REMOVED
- ✅ API routes are in `frontend/src/app/api/**/route.ts`
- ✅ All routes use `export const runtime = 'nodejs'` (Prisma requires Node, not Edge)
- ✅ Build is passing, production-ready

---

## Project Structure

```
IntelliCampus/
├── frontend/                    ⭐ PRIMARY FULLSTACK APP
│   ├── prisma/
│   │   ├── schema.prisma        # 580 lines, 30+ models
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # Next.js API routes (backend)
│   │   │   │   ├── auth/        # login, register, me, profile
│   │   │   │   ├── student/     # dashboard, performance
│   │   │   │   ├── teacher/     # dashboard
│   │   │   │   ├── admin/       # stats, users, ai-policy
│   │   │   │   └── gamification/ # xp
│   │   │   ├── student/         # Student pages
│   │   │   ├── teacher/         # Teacher pages
│   │   │   └── admin/           # Admin pages
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── ai/              # ChatWindow, MessageBubble
│   │   │   └── layout/          # DashboardLayout, Sidebar
│   │   ├── hooks/               # useAuth, useMastery, useVoice
│   │   ├── lib/                 # Core utilities ⭐
│   │   │   ├── prisma.ts        # Prisma singleton
│   │   │   ├── jwt.ts           # JWT sign/verify
│   │   │   ├── auth.ts          # getAuthUser(), requireRole()
│   │   │   └── env.ts           # Environment validation
│   │   ├── services/            # Business logic ⭐
│   │   │   ├── user.service.ts
│   │   │   ├── mastery.service.ts
│   │   │   ├── gamification.service.ts
│   │   │   ├── curriculum.service.ts
│   │   │   ├── assessment.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── ai.service.ts
│   │   │   └── accessibility.service.ts
│   │   ├── store/               # Zustand state
│   │   │   ├── authStore.ts
│   │   │   ├── masteryStore.ts
│   │   │   └── uiStore.ts
│   │   └── utils/
│   │       ├── helpers.ts       # API response helpers
│   │       ├── validators.ts    # Zod schemas
│   │       └── logger.ts
│   ├── .env                     # Environment variables
│   └── package.json
│
├── shared/                      # Shared types & constants
│   ├── types/                   # User, Course, Mastery, Gamification, API
│   └── constants/               # Roles, Modes, Config
│
├── ai-services/                 # Separate AI microservice
│   └── src/
│       ├── llm/                 # OpenAI interaction
│       ├── rag/                 # Vector DB, embeddings
│       ├── prompt-engine/       # AI prompts
│       ├── mastery/             # Performance analysis
│       └── voice/               # Speech features
│
└── backend/                     ⚠️ LEGACY (being removed)
```

---

## Database Schema (8 Categories)

### 1. Users & Authentication
```prisma
model User {
  id, name, email, passwordHash, role (student|teacher|admin), institutionId
  Relations: profile, accessibility, courses, sessions, xp, battles
}
model UserProfile { avatarUrl, yearOfStudy, department, bio }
model AccessibilitySettings { adhdMode, dyslexiaFont, highContrast, speechEnabled, focusMode, fontScale }
model Institution { Multi-tenant support }
```

### 2. Courses & Curriculum
```prisma
model Course { name, description, institutionId, createdBy }
model Subject { courseId, name }
model Topic { subjectId, name, difficultyLevel, orderIndex, prerequisites }
model CurriculumContent { topicId, contentType (pdf|video|text), fileUrl, textContent }
model TopicPrerequisite { Learning path dependencies }
```

### 3. AI Interaction
```prisma
model AISession { userId, courseId, topicId, mode (learning|assessment|practice), messages }
model AIMessage { sessionId, sender (student|ai), messageText, responseType }
model ConceptInteraction { Tracks concept questions }
model AIPolicySettings { allowDirectAnswers, maxHintsPerTopic, strictMode, blockedKeywords }
model GovernanceLog { AI policy violations }
```

### 4. Mastery Tracking
```prisma
model MasteryGraph { userId, courseId, nodes }
model MasteryNode { topicId, masteryLevel (0.0-1.0), lastInteraction, edges }
model MasteryEdge { Topic dependencies }
model WeakTopicFlag { Auto-flagged weak areas }
model PerformanceLog { Time-series performance }
```

### 5. Assignments & Assessment
```prisma
model Assignment { courseId, title, dueDate, strictMode, questions }
model Question { topicId, questionText, options A-D, correctOption, difficultyLevel, explanation }
model StudentAttempt { userId, assignmentId, score, submittedAt, answers }
model StudentAnswer { questionId, selectedOption, isCorrect, timeTaken }
```

### 6. Gamification
```prisma
model StudentXP { totalXp, level, streakDays, lastActivityDate }
model XPLog { source (quiz|boss_battle|flashcard|practice|spin_wheel|streak), xpAmount }
model BossBattle { topicId, status (active|won|lost), score, lives }
model FlashcardProgress { cardsReviewed, correctCount }
model SpinReward { rewardType (xp_boost|hint_token|bonus_quiz|streak_bonus), claimed }
model Leaderboard { period (daily|weekly|monthly), rank }
```

### 7. Analytics
```prisma
model TeacherInsight { courseId, metricName, metricValue, generatedAt }
model SystemUsageLog { activityType, duration, timestamp }
```

### 8. Admin & Governance
```prisma
model AIPolicySettings { Already described above }
model GovernanceLog { Already described above }
```

---

## Authentication & Authorization

### JWT Token Structure
```typescript
interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  institutionId: string;
}
```

### API Route Authentication Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';

export const runtime = 'nodejs';  // ⚠️ REQUIRED for Prisma
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);  // Extracts & verifies JWT
    requireRole(user, ['student', 'teacher']);  // Role check
    
    // Protected logic here
    const data = await someService.getData(user.userId);
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('Authentication') ? 401 : 400 }
    );
  }
}
```

### Role-Based Access
- **Student**: Own dashboard, AI chat, assignments, gamification, courses
- **Teacher**: Course management, analytics, assignment creation, student insights
- **Admin**: User management, AI policy, system settings, all data access

---

## Key Business Logic

### 1. Mastery Updates
```javascript
// When student completes activity with score
newMasteryLevel = 0.7 * oldMasteryLevel + 0.3 * activityScore
// Weak topic if level < 0.4 after 3+ attempts
// Topic unlocked when all prerequisites >= 0.6
```

### 2. XP & Leveling
```javascript
// XP Sources
Quiz completion: 50 XP
Boss battle win: 100 XP
Flashcards complete: 30 XP
Daily practice: 20 XP
Daily streak: 10 XP/day
Spin wheel: 5-50 XP (random)

// Level calculation
level = floor(totalXp / 500) + 1

// Streak system
Login daily → maintain streak
Missing day → reset to 1
```

### 3. Boss Battles
```javascript
// Start: 3 lives, fetch 10 questions
// Each correct answer: +10 damage to boss
// Each wrong answer: -1 life
// Victory: Boss HP reaches 0, award 100 XP
// Defeat: Student lives reach 0, award 0 XP
```

### 4. AI Governance
```javascript
// Check message against policy
if (containsBlockedKeyword(message)) {
  return "This topic is restricted. Please ask your teacher."
}

if (mode === 'assessment' && hintsUsed >= maxHintsPerTopic) {
  return "No more hints available."
}

if (strictMode && studentAskingForAnswer) {
  return "Direct answers are disabled. Try solving it yourself."
}
```

---

## API Routes Reference

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login, get JWT
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Student
- `GET /api/student/dashboard` - Dashboard data (protected, student)
- `GET /api/student/performance/trend?days=30` - Performance chart (protected, student)

### Teacher
- `GET /api/teacher/dashboard` - Teacher overview (protected, teacher)

### Admin
- `GET /api/admin/dashboard/stats` - System stats (protected, admin)
- `GET /api/admin/users?page=1&limit=20&role=student` - User list (protected, admin)
- `GET /api/admin/ai-policy` - Get AI policy (protected, admin)
- `PUT /api/admin/ai-policy` - Update AI policy (protected, admin)

### Gamification
- `GET /api/gamification/xp` - Get student XP (protected, student)

**Response Format:**
```typescript
// Success
{ success: true, data: any, message?: string }

// Error
{ success: false, error: string }

// Paginated
{ success: true, data: any[], pagination: { page, limit, total, totalPages } }
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...supabase.co:5432/postgres"

# JWT
JWT_SECRET="OigRBP5v8MFZBoaevcvtMrj+8P1ztnyE5LQZz94TUk4="
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-..."

# Pinecone
PINECONE_API_KEY="..."
PINECONE_INDEX="intellicampus"
PINECONE_ENVIRONMENT="us-east-1"

# Speech
GOOGLE_SPEECH_KEY="..."
ELEVENLABS_API_KEY="..."
ELEVENLABS_VOICE_ID="..."
```

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd frontend && pnpm prisma:generate

# Run migrations
cd frontend && pnpm prisma:migrate

# Seed database
cd frontend && pnpm prisma:seed

# Start dev server
cd frontend && pnpm dev  # → http://localhost:3000

# Build for production
cd frontend && pnpm build

# Open Prisma Studio
cd frontend && pnpm prisma:studio  # → http://localhost:5555
```

---

## Critical Rules for Code Changes

### ✅ DO:
1. **Always use Node.js runtime**: `export const runtime = 'nodejs'` in API routes
2. **Use Next.js patterns**: `NextRequest`, `NextResponse`, not Express
3. **Authenticate API routes**: Use `getAuthUser(req)` to verify JWT
4. **Authorize by role**: Use `requireRole(user, ['role1', 'role2'])`
5. **Keep business logic in services**: Not in route handlers
6. **Validate input with Zod**: Use schemas from `utils/validators.ts`
7. **Handle errors gracefully**: Try-catch with meaningful messages
8. **Include 3-5 lines context**: When using replace_string_in_file

### ❌ DON'T:
1. **Never import from 'express'**: We removed all Express dependencies
2. **Never use Edge runtime**: Prisma only works with Node.js runtime
3. **Never skip authentication**: All API routes must verify JWT (except login/register)
4. **Never put business logic in routes**: Keep routes thin, services fat
5. **Never use `any` type**: Maintain strict TypeScript typing
6. **Never break existing auth**: Test login/logout after changes

---

## Key Features Explained

### 1. AI Tutoring Modes
- **Learning Mode**: Student asks, AI explains (hints allowed)
- **Assessment Mode**: AI asks, student answers (no direct answers, limited hints)
- **Practice Mode**: Balanced guidance

### 2. Mastery-Based Learning
- Knowledge graph tracks topic understanding (0.0 to 1.0)
- Prerequisites enforce learning order
- Weak topics auto-flagged for review
- Adaptive recommendations based on mastery

### 3. Gamification
- XP system with leveling (500 XP per level)
- Boss battles (gamified quizzes with lives)
- Flashcards with spaced repetition
- Spin wheel for random rewards
- Leaderboards (daily/weekly/monthly)
- Streak system (daily login bonus)

### 4. Accessibility
- ADHD mode (reduced clutter, focus)
- Dyslexia font (OpenDyslexic)
- High contrast (WCAG AAA)
- Speech-to-text and text-to-speech
- Focus mode (Pomodoro timer)

---

## File Locations (Quick Reference)

- **Database Schema**: `frontend/prisma/schema.prisma`
- **API Routes**: `frontend/src/app/api/**/route.ts`
- **Services**: `frontend/src/services/*.service.ts`
- **Auth Logic**: `frontend/src/lib/auth.ts`
- **Prisma Client**: `frontend/src/lib/prisma.ts`
- **JWT Utils**: `frontend/src/lib/jwt.ts`
- **Validators**: `frontend/src/utils/validators.ts`
- **Auth Store**: `frontend/src/store/authStore.ts`
- **Shared Types**: `shared/types/*.ts`
- **Shared Constants**: `shared/constants/*.ts`

---

## Migration History

**Before (Jan 2026):**
- Separate Express backend on port 4000
- Next.js frontend on port 3000
- CORS required for communication

**After (Feb 2026):**
- Unified Next.js 15 fullstack app
- API routes in `/api` directory
- No CORS needed (same origin)
- Simpler deployment to Vercel

**Migration Steps Completed:**
1. ✅ Moved Prisma schema to frontend
2. ✅ Moved all services to frontend
3. ✅ Created 11 Next.js API routes
4. ✅ Updated frontend API client to use `/api`
5. ✅ Removed all Express dependencies
6. ✅ Updated package.json with backend deps
7. ✅ Build passing, production-ready

---

## When Asking ChatGPT for Help

**Always provide:**
1. **What you're trying to do**: Feature, bug fix, refactor, etc.
2. **Current file content**: If editing, show the file
3. **Error messages**: Full error stack trace
4. **Expected vs actual**: What should happen, what's happening

**Example prompt structure:**
```
I'm working on IntelliCampus (see context above).

Task: [Add new API route for student assignments]

Current situation:
[Paste relevant code or describe current state]

Expected outcome:
[What you want to achieve]

Error (if any):
[Paste error message]

Please help me implement this following the project conventions.
```

---

## Additional Documentation

- **Full Context**: See `COMPREHENSIVE_PROJECT_CONTEXT.md` (this file's parent)
- **Folder Structure**: See `PROJECT_STRUCTURE.md`
- **Migration Details**: See `MIGRATION_COMPLETE.md`
- **Database Schema**: See `frontend/prisma/schema.prisma`

---

**Last Updated**: February 18, 2026  
**Status**: ✅ Production-Ready  
**Build**: Passing  
**Architecture**: Fullstack Next.js 15 with Node.js API Routes

---

## Quick Tips

- All API routes are serverless functions (cold start ~1-2s)
- Prisma connection pooling via PgBouncer (DATABASE_URL)
- Direct connection for migrations (DIRECT_URL)
- JWT expires in 7 days (refresh not implemented yet)
- Role immutable after registration
- Student can be enrolled in multiple courses
- Teacher can create courses and assignments
- Admin has full system access
- AI policy is per-institution, not per-user
- Mastery graph is per-user, per-course
- XP is global, not per-course

---

**You're now ready to work on IntelliCampus! 🚀**
