# IntelliCampus - Complete Project Folder Structure

## Root Directory
```
IntelliCampus/
├── 📄 .env                          # Environment variables (not in git)
├── 📄 .env.example                  # Example environment configuration
├── 📄 .gitignore                    # Git ignore rules
├── 📄 docker-compose.yml            # Docker configuration for services
├── 📄 package.json                  # Root workspace package config
├── 📄 package-lock.json             # NPM lock file
├── 📄 pnpm-lock.yaml                # PNPM lock file (monorepo)
├── 📄 pnpm-workspace.yaml           # PNPM workspace configuration
├── 📄 tsconfig.base.json            # Base TypeScript configuration
├── 📄 MIGRATION_COMPLETE.md         # Migration documentation
│
├── 📁 frontend/                     # Next.js 15 App Router (PRIMARY)
├── 📁 backend/                      # Express API (LEGACY - being removed)
├── 📁 ai-services/                  # AI/ML microservice
├── 📁 shared/                       # Shared types & constants
├── 📁 scripts/                      # Utility scripts
└── 📁 docs/                         # Documentation
```

---

## 📁 frontend/ - Next.js 15 Fullstack Application
```
frontend/
├── 📄 package.json                  # Frontend dependencies (now includes backend deps)
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 next.config.js                # Next.js configuration
├── 📄 next-env.d.ts                 # Next.js TypeScript definitions
├── 📄 tailwind.config.js            # Tailwind CSS config
├── 📄 postcss.config.js             # PostCSS config
│
├── 📁 prisma/                       # Database (moved from backend)
│   ├── 📄 schema.prisma             # Complete Prisma schema (578 lines)
│   ├── 📄 seed.ts                   # Database seeding script
│   └── 📁 migrations/               # Database migrations
│       ├── 📄 migration_lock.toml
│       └── 📁 20260217215447_init/
│           └── 📄 migration.sql
│
├── 📁 public/                       # Static assets
│
└── 📁 src/
    ├── 📄 middleware.ts             # Next.js middleware (auth routing)
    │
    ├── 📁 app/                      # Next.js 15 App Router
    │   ├── 📄 layout.tsx            # Root layout
    │   ├── 📄 page.tsx              # Home page
    │   ├── 📄 loading.tsx           # Global loading UI
    │   ├── 📄 error.tsx             # Global error UI
    │   ├── 📄 not-found.tsx         # 404 page
    │   │
    │   ├── 📁 api/                  # Backend API Routes (NEW)
    │   │   ├── 📁 auth/
    │   │   │   ├── 📁 login/
    │   │   │   │   └── 📄 route.ts          # POST /api/auth/login
    │   │   │   ├── 📁 register/
    │   │   │   │   └── 📄 route.ts          # POST /api/auth/register
    │   │   │   ├── 📁 me/
    │   │   │   │   └── 📄 route.ts          # GET /api/auth/me
    │   │   │   └── 📁 profile/
    │   │   │       └── 📄 route.ts          # GET/PUT /api/auth/profile
    │   │   │
    │   │   ├── 📁 student/
    │   │   │   ├── 📁 dashboard/
    │   │   │   │   └── 📄 route.ts          # GET /api/student/dashboard
    │   │   │   └── 📁 performance/
    │   │   │       └── 📁 trend/
    │   │   │           └── 📄 route.ts      # GET /api/student/performance/trend
    │   │   │
    │   │   ├── 📁 teacher/
    │   │   │   └── 📁 dashboard/
    │   │   │       └── 📄 route.ts          # GET /api/teacher/dashboard
    │   │   │
    │   │   ├── 📁 admin/
    │   │   │   ├── 📁 dashboard/
    │   │   │   │   └── 📁 stats/
    │   │   │   │       └── 📄 route.ts      # GET /api/admin/dashboard/stats
    │   │   │   ├── 📁 users/
    │   │   │   │   └── 📄 route.ts          # GET/POST/PUT/DELETE /api/admin/users
    │   │   │   └── 📁 ai-policy/
    │   │   │       └── 📄 route.ts          # GET/PUT /api/admin/ai-policy
    │   │   │
    │   │   └── 📁 gamification/
    │   │       └── 📁 xp/
    │   │           └── 📄 route.ts          # GET /api/gamification/xp
    │   │
    │   ├── 📁 auth/                 # Authentication pages
    │   │   ├── 📄 layout.tsx        # Auth layout (centered)
    │   │   ├── 📁 login/
    │   │   │   └── 📄 page.tsx      # Login page
    │   │   └── 📁 register/
    │   │       └── 📄 page.tsx      # Registration page
    │   │
    │   ├── 📁 student/              # Student role pages
    │   │   ├── 📄 page.tsx          # Student dashboard
    │   │   ├── 📄 layout.tsx        # Student layout
    │   │   ├── 📄 error.tsx         # Student error boundary
    │   │   ├── 📁 courses/
    │   │   │   ├── 📄 page.tsx      # Course list
    │   │   │   └── 📁 [courseId]/
    │   │   │       └── 📄 page.tsx  # Course detail
    │   │   ├── 📁 assignments/
    │   │   │   └── 📄 page.tsx      # Assignments list
    │   │   ├── 📁 ai-chat/
    │   │   │   └── 📄 page.tsx      # AI tutor chat
    │   │   ├── 📁 mastery/
    │   │   │   └── 📄 page.tsx      # Mastery graph view
    │   │   ├── 📁 leaderboard/
    │   │   │   └── 📄 page.tsx      # XP leaderboard
    │   │   ├── 📁 gamification/
    │   │   │   ├── 📁 flashcards/
    │   │   │   │   └── 📄 page.tsx  # Flashcard game
    │   │   │   ├── 📁 sprint/
    │   │   │   │   └── 📄 page.tsx  # Sprint challenge
    │   │   │   ├── 📁 spin/
    │   │   │   │   └── 📄 page.tsx  # Spin wheel game
    │   │   │   └── 📁 boss-battle/
    │   │   │       └── 📄 page.tsx  # Boss battle game
    │   │   └── 📁 settings/
    │   │       └── 📄 page.tsx      # Student settings
    │   │
    │   ├── 📁 teacher/              
    │   │   ├── 📄 page.tsx          # Teacher dashboard
    │   │   ├── 📄 layout.tsx        # Teacher layout
    │   │   ├── 📄 error.tsx         # Teacher error boundary
    │   │   ├── 📁 courses/
    │   │   │   ├── 📄 page.tsx      # Teacher courses
    │   │   │   ├── 📁 create/
    │   │   │   │   └── 📄 page.tsx  # Create course
    │   │   │   └── 📁 [courseId]/
    │   │   │       └── 📄 page.tsx  # Course management
    │   │   ├── 📁 assignments/
    │   │   │   ├── 📄 page.tsx      # Assignment list
    │   │   │   └── 📁 new/
    │   │   │       └── 📄 page.tsx  # Create assignment
    │   │   ├── 📁 content/
    │   │   │   └── 📄 page.tsx      # Content management
    │   │   ├── 📁 analytics/
    │   │   │   └── 📄 page.tsx      # Class analytics
    │   │   └── 📁 settings/
    │   │       └── 📄 page.tsx      # Teacher settings
    │   │
    │   └── 📁 admin/                # Admin role pages
    │       ├── 📄 page.tsx          # Admin dashboard
    │       ├── 📄 layout.tsx        # Admin layout
    │       ├── 📄 error.tsx         # Admin error boundary
    │       ├── 📁 users/
    │       │   └── 📄 page.tsx      # User management
    │       ├── 📁 usage/
    │       │   └── 📄 page.tsx      # Usage analytics
    │       ├── 📁 ai-policy/
    │       │   └── 📄 page.tsx      # AI policy configuration
    │       ├── 📁 accessibility/
    │       │   └── 📄 page.tsx      # Accessibility settings
    │       └── 📁 settings/
    │           └── 📄 page.tsx      # System 
    │
    ├── 📁 components/               # React components
    │   ├── 📁 ui/                   # shadcn/ui components
    │   │   ├── 📄 accordion.tsx
    │   │   ├── 📄 avatar.tsx
    │   │   ├── 📄 badge.tsx
    │   │   ├── 📄 button.tsx
    │   │   ├── 📄 card.tsx
    │   │   ├── 📄 collapsible.tsx
    │   │   ├── 📄 dialog.tsx
    │   │   ├── 📄 dropdown-menu.tsx
    │   │   ├── 📄 input.tsx
    │   │   ├── 📄 label.tsx
    │   │   ├── 📄 progress.tsx
    │   │   ├── 📄 scroll-area.tsx
    │   │   ├── 📄 select.tsx
    │   │   ├── 📄 separator.tsx
    │   │   ├── 📄 skeleton.tsx
    │   │   ├── 📄 switch.tsx
    │   │   ├── 📄 tabs.tsx
    │   │   ├── 📄 textarea.tsx
    │   │   └── 📄 tooltip.tsx
    │   │
    │   ├── 📁 ai/                   # AI-related components
    │   │   ├── 📄 ChatWindow.tsx
    │   │   ├── 📄 MessageBubble.tsx
    │   │   └── 📄 VoiceInput.tsx
    │   │
    │   ├── 📁 charts/               # Data visualization
    │   │   ├── 📄 PerformanceChart.tsx
    │   │   └── 📄 TeacherPerformanceChart.tsx
    │   │
    │   └── 📁 layout/               # Layout components
    │       ├── 📄 DashboardLayout.tsx
    │       └── 📄 Sidebar.tsx
    │
    ├── 📁 features/                 # Feature modules (likely empty or minimal)
    │
    ├── 📁 hooks/                    # Custom React hooks
    │   ├── 📄 useAccessibility.ts   # Accessibility hook
    │   ├── 📄 useAuth.ts            # Authentication hook
    │   ├── 📄 useMastery.ts         # Mastery tracking hook
    │   └── 📄 useVoice.ts           # Voice input/output hook
    │
    ├── 📁 lib/                      # Core utilities (NEW - from backend)
    │   ├── 📄 auth.ts               # Auth helpers (getAuthUser, requireRole)
    │   ├── 📄 env.ts                # Environment config validation
    │   ├── 📄 jwt.ts                # JWT sign/verify utilities
    │   ├── 📄 prisma.ts             # Prisma client singleton
    │   └── 📄 utils.ts              # Utility functions (cn, etc.)
    │
    ├── 📁 services/                 # Business logic layer (MOVED from backend)
    │   ├── 📄 accessibility.service.ts  # Accessibility preferences
    │   ├── 📄 ai.service.ts             # AI session management
    │   ├── 📄 analytics.service.ts      # Analytics & reporting
    │   ├── 📄 assessment.service.ts     # Assignment & grading
    │   ├── 📄 curriculum.service.ts     # Course & content management
    │   ├── 📄 gamification.service.ts   # XP, badges, games
    │   ├── 📄 mastery.service.ts        # Mastery graph tracking
    │   ├── 📄 user.service.ts           # User CRUD operations
    │   │
    │   ├── 📄 aiService.ts              # Client-side AI helpers
    │   ├── 📄 apiClient.ts              # Axios instance (now uses /api)
    │   ├── 📄 assessmentService.ts      # Client assessment helpers
    │   ├── 📄 authService.ts            # Client auth helpers
    │   ├── 📄 curriculumService.ts      # Client curriculum helpers
    │   ├── 📄 gamificationService.ts    # Client gamification helpers
    │   ├── 📄 masteryService.ts         # Client mastery helpers
    │   ├── 📄 teacherService.ts         # Client teacher helpers
    │   └── 📄 analyticsService.ts       # Client analytics helpers
    │
    ├── 📁 store/                    # Zustand state management
    │   ├── 📄 authStore.ts          # Auth state (user, token, role)
    │   ├── 📄 masteryStore.ts       # Mastery graph state
    │   └── 📄 uiStore.ts            # UI state (sidebar, theme, etc.)
    │
    ├── 📁 styles/                   # Global styles
    │   └── 📄 globals.css           # Tailwind imports + custom CSS
    │
    └── 📁 utils/                    # Helper utilities
        ├── 📄 helpers.ts            # General helper functions
        ├── 📄 logger.ts             # Logging utility
        └── 📄 validators.ts         # Validation functions
```

---

## 📁 backend/ - Express.js API (LEGACY - TO BE REMOVED)
```
backend/
├── 📄 package.json                  # Backend dependencies
├── 📄 tsconfig.json                 # TypeScript config
│
└── 📁 src/
    ├── 📄 app.ts                    # Express app setup
    ├── 📄 server.ts                 # Server entry point
    │
    ├── 📁 config/                   # Configuration
    │   ├── 📄 cors.ts               # CORS settings
    │   ├── 📄 db.ts                 # Database connection (Prisma)
    │   ├── 📄 env.ts                # Environment variables
    │   └── 📄 jwt.ts                # JWT configuration
    │
    ├── 📁 controllers/              # Express controllers
    │   ├── 📄 admin.controller.ts
    │   ├── 📄 ai.controller.ts
    │   ├── 📄 analytics.controller.ts
    │   ├── 📄 auth.controller.ts
    │   ├── 📄 gamification.controller.ts
    │   ├── 📄 student.controller.ts
    │   └── 📄 teacher.controller.ts
    │
    ├── 📁 middleware/               # Express middleware
    │   ├── 📄 auth.middleware.ts    # JWT verification
    │   ├── 📄 error.middleware.ts   # Error handling
    │   ├── 📄 rateLimit.middleware.ts # Rate limiting
    │   └── 📄 role.middleware.ts    # Role-based access
    │
    ├── 📁 prisma/                   # Database (MOVED to frontend)
    │   ├── 📄 schema.prisma         # ⚠️ NOW IN frontend/prisma/
    │   └── 📄 seed.ts               # ⚠️ NOW IN frontend/prisma/
    │
    ├── 📁 routes/                   # Express routes
    │   ├── 📄 admin.routes.ts
    │   ├── 📄 ai.routes.ts
    │   ├── 📄 analytics.routes.ts
    │   ├── 📄 auth.routes.ts
    │   ├── 📄 gamification.routes.ts
    │   ├── 📄 student.routes.ts
    │   └── 📄 teacher.routes.ts
    │
    ├── 📁 services/                 # Business logic (MOVED to frontend)
    │   ├── 📄 accessibility.service.ts  # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 ai.service.ts             # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 analytics.service.ts      # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 assessment.service.ts     # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 curriculum.service.ts     # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 gamification.service.ts   # ⚠️ NOW IN frontend/src/services/
    │   ├── 📄 mastery.service.ts        # ⚠️ NOW IN frontend/src/services/
    │   └── 📄 user.service.ts           # ⚠️ NOW IN frontend/src/services/
    │
    ├── 📁 types/                    # TypeScript types
    │
    └── 📁 utils/                    # Utilities
        ├── 📄 helpers.ts
        ├── 📄 logger.ts
        └── 📄 validators.ts
```

---

## 📁 ai-services/ - AI/ML Microservice
```
ai-services/
├── 📄 package.json                  # AI service dependencies
├── 📄 tsconfig.json                 # TypeScript config
│
└── 📁 src/
    ├── 📄 index.ts                  # AI service entry point
    │
    ├── 📁 config/                   # AI configuration
    │   ├── 📄 openai.ts             # OpenAI client setup
    │   ├── 📄 pinecone.ts           # Pinecone vector DB setup
    │   └── 📄 speech.ts             # Speech API configuration
    │
    ├── 📁 llm/                      # LLM interaction
    │   ├── 📄 generateResponse.ts   # Generate AI responses
    │   ├── 📄 moderation.ts         # Content moderation
    │   └── 📄 responseParser.ts     # Parse AI responses
    │
    ├── 📁 mastery/                  # Mastery analysis
    │   ├── 📄 masteryUpdate.ts      # Update mastery graph
    │   ├── 📄 performanceAnalyzer.ts # Analyze student performance
    │   └── 📄 weaknessDetector.ts   # Detect knowledge gaps
    │
    ├── 📁 pipelines/                # AI pipelines
    │   ├── 📄 assessmentPipeline.ts # Assessment generation
    │   ├── 📄 gamificationPipeline.ts # Gamification logic
    │   └── 📄 learningPipeline.ts   # Learning path generation
    │
    ├── 📁 prompt-engine/            # Prompt management
    │   ├── 📄 assessmentMode.ts     # Assessment prompts
    │   ├── 📄 governedPrompt.ts     # Guardrail prompts
    │   └── 📄 hintModePrompt.ts     # Hint generation prompts
    │
    ├── 📁 rag/                      # RAG (Retrieval Augmented Generation)
    │   ├── 📄 chunker.ts            # Text chunking
    │   ├── 📄 embedder.ts           # Generate embeddings
    │   ├── 📄 retriever.ts          # Semantic search
    │   └── 📄 vectorStore.ts        # Vector database interface
    │
    └── 📁 voice/                    # Voice features
        ├── 📄 speechToText.ts       # STT (speech recognition)
        └── 📄 textToSpeech.ts       # TTS (speech synthesis)
```

---

## 📁 shared/ - Shared Types & Constants
```
shared/
├── 📄 package.json                  # Shared package config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 index.ts                      # Main export
├── 📄 index.js                      # Compiled JS
├── 📄 index.d.ts                    # Type definitions
│
├── 📁 constants/                    # Shared constants
│   ├── 📄 config.ts                 # App configuration constants
│   ├── 📄 config.js                 # Compiled JS
│   ├── 📄 config.d.ts               # Type definitions
│   │
│   ├── 📄 modes.ts                  # AI modes (learning, assessment, hint)
│   ├── 📄 modes.js                  # Compiled JS
│   ├── 📄 modes.d.ts                # Type definitions
│   │
│   ├── 📄 roles.ts                  # User roles (student, teacher, admin)
│   ├── 📄 roles.js                  # Compiled JS
│   └── 📄 roles.d.ts                # Type definitions
│
├── 📁 types/                        # Shared TypeScript types
│   ├── 📄 api.ts                    # API request/response types
│   ├── 📄 api.js                    # Compiled JS
│   ├── 📄 api.d.ts                  # Type definitions
│   │
│   ├── 📄 course.ts                 # Course & content types
│   ├── 📄 course.js                 # Compiled JS
│   ├── 📄 course.d.ts               # Type definitions
│   │
│   ├── 📄 gamification.ts           # XP, badges, games types
│   ├── 📄 gamification.js           # Compiled JS
│   ├── 📄 gamification.d.ts         # Type definitions
│   │
│   ├── 📄 mastery.ts                # Mastery graph types
│   ├── 📄 mastery.js                # Compiled JS
│   ├── 📄 mastery.d.ts              # Type definitions
│   │
│   ├── 📄 user.ts                   # User & auth types
│   ├── 📄 user.js                   # Compiled JS
│   └── 📄 user.d.ts                 # Type definitions
│
└── 📁 utils/                        # Shared utility functions
```

---

## 📁 scripts/ - Utility Scripts
```
scripts/
└── (deployment, database, migration scripts)
```

---

## 📁 docs/ - Documentation
```
docs/
└── (architecture diagrams, API docs, guides)
```

---

## Root Configuration Files

### 📄 pnpm-workspace.yaml
```yaml
packages:
  - 'frontend'
  - 'backend'      # ⚠️ TO BE REMOVED
  - 'ai-services'
  - 'shared'
```

### 📄 tsconfig.base.json
Base TypeScript configuration shared across all packages

### 📄 docker-compose.yml
Container orchestration for:
- PostgreSQL database
- Redis cache (optional)
- AI services

### 📄 .env (not in git)
```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="..."

# OpenAI
OPENAI_API_KEY="..."

# Pinecone
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."
PINECONE_INDEX_NAME="..."
```

---

## Architecture Summary

### Current State (Fullstack Next.js)
```
┌─────────────────────────────────────────────┐
│          Frontend (Next.js 15)              │
│  ┌─────────────────────────────────────┐   │
│  │      App Router Pages (UI)          │   │
│  └──────────────┬──────────────────────┘   │
│                 │ calls                     │
│  ┌──────────────▼──────────────────────┐   │
│  │    API Routes (/api/*)              │   │
│  └──────────────┬──────────────────────┘   │
│                 │ uses                      │
│  ┌──────────────▼──────────────────────┐   │
│  │    Services Layer (business logic)  │   │
│  └──────────────┬──────────────────────┘   │
│                 │ uses                      │
│  ┌──────────────▼──────────────────────┐   │
│  │    Prisma Client (ORM)              │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
         ┌────────▼─────────┐
         │   PostgreSQL     │
         │   (Supabase)     │
         └──────────────────┘
```

### Legacy Architecture (Being Removed)
```
Frontend (Next.js) → Express Backend → Prisma → PostgreSQL
         ↓
   AI Services (separate)
```

---

## Database Schema Categories (578 lines in schema.prisma)

### 1. **Users & Authentication**
- User
- UserRole (enum: student | teacher | admin)
- Profile settings

### 2. **Courses & Curriculum**
- Course
- Module
- Lesson
- Content
- Enrollment

### 3. **AI Interaction**
- AISession
- AIMessage
- AIMode (enum: learning | assessment | hint)
- AIPolicy
- GovernanceLog

### 4. **Mastery Tracking**
- MasteryGraph
- MasteryNode
- MasteryEdge
- ConceptProgress
- WeaknessDetection

### 5. **Assignments & Assessment**
- Assignment
- StudentSubmission
- Grade
- Question
- Answer
- AssessmentResult

### 6. **Gamification**
- StudentXP
- XPLog
- XPSource (enum)
- Badge
- StudentBadge
- LeaderboardEntry

### 7. **Analytics**
- PerformanceMetric
- EngagementLog
- AtRiskAlert
- UsageAnalytics

### 8. **Admin & Governance**
- SystemConfig
- AIUsageLimit
- AuditLog
- AccessibilityPreference

---

## Key Technologies

- **Frontend:** Next.js 15, React 19, TypeScript 5.7
- **Backend:** Next.js API Routes (previously Express)
- **Database:** PostgreSQL (Supabase), Prisma ORM 6.2
- **Auth:** JWT (jsonwebtoken)
- **State:** Zustand 5.0
- **Styling:** Tailwind CSS, shadcn/ui
- **AI:** OpenAI GPT, Pinecone (vector DB)
- **Monorepo:** PNPM workspace
- **Deployment:** Vercel (target)

---

## Migration Status

✅ **COMPLETED:**
- Moved Prisma schema to frontend
- Moved all services to frontend
- Created 11 API routes in Next.js
- Updated frontend to use /api/* endpoints
- Fixed all TypeScript errors

⚠️ **IN PROGRESS:**
- Testing new fullstack architecture
- Creating remaining API routes

🔜 **TODO:**
- Complete all API routes (see MIGRATION_COMPLETE.md)
- Deploy to Vercel
- Remove backend folder

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
cd frontend && pnpm prisma:generate

# Run database migrations
cd frontend && pnpm prisma:migrate

# Seed database
cd frontend && pnpm prisma:seed

# Start development server (fullstack)
cd frontend && pnpm dev
# → http://localhost:3000

# Start AI services (if needed)
cd ai-services && pnpm dev
# → http://localhost:5000
```

---

## Environment Variables

Required in `frontend/.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="/api"
OPENAI_API_KEY="sk-..."
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."
PINECONE_INDEX_NAME="intellicampus"
```

---

**Last Updated:** February 18, 2026  
**Architecture:** Fullstack Next.js 15 with API Routes  
**Status:** Active Development - Migrating from Express to fullstack Next.js
