# IntelliCampus - Master Project Context

This document is intended to give another AI system, developer, or reviewer enough context to understand how IntelliCampus is structured, what each major area does, how the UI is organized, how the APIs are grouped, and how the AI pipeline fits into the product.

## 1. Executive Summary

IntelliCampus is a multi-role academic platform for students, teachers, and admins. The product combines:

- governed AI tutoring tied to curriculum content
- mastery tracking per topic and course
- assessment authoring, submission, grading, and review workflows
- gamification systems such as XP, leaderboards, flashcards, sprint, spin, and boss battle
- institutional analytics, reporting, governance, and accessibility controls

The current production-oriented app surface is primarily the Next.js app in `frontend/`. There is also:

- a retained legacy Express backend in `backend/`
- a separate AI microservice in `ai-services/`
- a shared package in `shared/`

This means the repo is best understood as a hybrid monorepo in transition:

- `frontend/` is the main user-facing application and owns the current App Router pages, most current API routes, Prisma schema, and much of the active business logic.
- `backend/` still exists and contains earlier Express services, routes, and patterns that are either legacy, reference implementations, or still used when proxied externally.
- `ai-services/` is the dedicated LLM, RAG, ingestion, speech, and semantic-cache microservice.

## 2. Monorepo Structure

Root workspace packages:

- `frontend/`: Next.js 15 app, App Router, current API routes, Prisma schema, UI, client services
- `backend/`: Express backend, legacy or optional external API layer
- `ai-services/`: Express AI microservice for tutoring, ingestion, speech, and generation pipelines
- `shared/`: shared constants and types used across packages

Top-level docs show a long implementation history. The most relevant current files are:

- `COMPREHENSIVE_PROJECT_CONTEXT.md`: this document
- `PROJECT_STRUCTURE.md`: prior structural notes
- `FRONTEND_ARCHITECTURE_REDESIGN.md`: earlier frontend architecture redesign notes
- `ADMIN_*`, `SECURITY_*`, `STT_IMPLEMENTATION_COMPLETE.md`, `TESTING_GUIDE.md`: focused implementation docs

PNPM workspace packages are declared in `pnpm-workspace.yaml`.

## 3. Runtime Architecture

### 3.1 Current runtime model

Primary application flow:

1. User loads the Next.js app from `frontend/`
2. App Router pages render role-specific interfaces
3. Client code calls either:
   - Next.js route handlers under `frontend/src/app/api/**`
   - or, in some deployments, proxied backend endpoints if `BACKEND_URL` is configured
4. Server-side route handlers use Prisma and service modules for data and business logic
5. AI-related routes proxy to `ai-services/` via `AI_SERVICE_URL`

### 3.2 Important architectural nuance

This repo contains overlapping layers because the system evolved from a split frontend/backend architecture to a more unified Next.js fullstack pattern.

The most accurate framing is:

- main product shell: Next.js fullstack app in `frontend/`
- optional proxy target: Express backend in `backend/`
- dedicated AI engine: Express service in `ai-services/`

### 3.3 Deployment behavior

`frontend/next.config.js` supports two modes:

- default mode: Next.js handles `/api/*` internally with route handlers under `frontend/src/app/api/`
- proxy mode: if `BACKEND_URL` is set, `/api/*` can be rewritten to an external Express backend

Vercel config points at the frontend build:

- build command: `pnpm --filter @intellicampus/frontend... build`
- framework: `nextjs`

## 4. Technology Stack

### 4.1 Frontend and application layer

- Next.js 15
- React 19
- TypeScript 5.7
- App Router
- Tailwind CSS
- Radix UI / shadcn-style component primitives
- Zustand for client state
- Recharts for analytics charts
- motion for animations
- lucide-react and react-icons for iconography

### 4.2 Server and API layer

- Next.js route handlers in `frontend/src/app/api/`
- optional Express backend in `backend/`
- JWT auth
- bcryptjs for password hashing
- Zod in multiple validation flows

### 4.3 Data layer

- PostgreSQL
- Prisma ORM
- Supabase appears to be the intended database/storage platform
- Supabase storage is used for uploaded files

### 4.4 AI and retrieval layer

- OpenAI for embeddings and model responses in several pipelines
- Groq for fast tutor inference in the AI service
- Pinecone for vector storage and retrieval
- Redis semantic cache
- Google speech APIs and browser speech APIs for STT-related flows
- ElevenLabs and browser speech synthesis for TTS-related flows

### 4.5 Developer workflow

- PNPM workspace monorepo
- Prisma generate/migrate/seed workflows
- TypeScript builds per package

## 5. Design System and UI Language

### 5.1 Global visual identity

The visual language is institutional and blue-led rather than consumer-social or generic SaaS. Core styling comes from `frontend/src/styles/globals.css`.

Primary traits:

- light mode body background: pale cyan `#E9FCFC`
- dark mode body background: dark navy family
- sidebar and top bar: deep blue gradient from `#002F4C` to `#006EB2`
- cards: clean white or dark-surface panels with restrained borders
- heavy use of rounded cards, metric panels, progress visuals, and analytics widgets

### 5.2 Typography

Loaded in `frontend/src/app/layout.tsx`:

- DM Sans: default application font
- Lexend Peta: dyslexia/accessibility font mode
- Instrument Serif: accent display serif used especially in landing/marketing contexts

### 5.3 Accessibility features built into the UI

Global CSS and controls support:

- dyslexia mode
- high contrast mode
- focus mode that suppresses distractions and sidebar elements
- ADHD mode that simplifies decoration and reduces visual noise
- speech-related features via hooks, panels, and AI prompt input

### 5.4 Shared shell components

Core shell components:

- `frontend/src/components/shells/AppShell.tsx`: authenticated app container, mobile detection, role guard, theme application
- `frontend/src/components/chrome/AppSidebar.tsx`: role-aware nav sidebar with collapse and mobile overlay behavior
- `frontend/src/components/chrome/TopBar.tsx`: theme toggle, accessibility panel, user menu, student learning/assessment mode switcher
- `frontend/src/components/layout/DashboardLayout.tsx`: wrapper around the main app shell

### 5.5 Shared panel and widget components

Common UI building blocks:

- `Panel`
- `MetricCard`
- `ActionCard`
- `StatRing`
- chart components for student and teacher analytics
- `GlowingEffect` for select visual emphasis
- `ChatWindow` and `ai-prompt-box` for conversational experiences

## 6. Authentication, Authorization, and App State

### 6.1 Auth model

The app uses JWT bearer tokens. Route handlers typically call:

- `getAuthUser(req)` from `frontend/src/lib/auth.ts`
- `requireRole(user, allowedRoles)`

Token payload conceptually includes:

- `userId`
- `email`
- `role`
- `institutionId`

There is also a development shortcut token path in `getAuthUser` for mock/demo access.

### 6.2 Client auth and guards

`AppShell` pulls auth state from Zustand and redirects:

- unauthenticated users to `/auth/login`
- users with mismatched roles to their own role root

### 6.3 Middleware

`frontend/src/middleware.ts` is intentionally light. It allows public paths and static assets, but it does not enforce the full auth policy. Real route/page protection is handled deeper in the app shell and API auth utilities.

### 6.4 State management

The frontend uses Zustand stores for concerns such as:

- auth state
- UI state such as theme, mobile/sidebar state, and active tab
- course/mastery-related cached data

## 7. Frontend Route Map

The Next.js application is organized primarily by role.

### 7.1 Public and auth routes

- `/`: marketing/landing page with animated hero, feature sections, benefit sections, and CTAs to sign in or register
- `/auth/login`: standard login page
- `/auth/register`: registration page
- `/login-admin`: admin-specific login flow with OTP

### 7.2 Student routes

Students have two navigation modes controlled from the top bar and sidebar:

- `learning`
- `assessment`

The navigation config lives in `frontend/src/lib/navigation.ts`.

#### Student learning-mode routes

- `/student`: main dashboard overview
- `/student/courses`: enrolled or available course list
- `/student/courses/[courseId]`: specific course view
- `/student/courses/[courseId]/assignments/[assignmentId]`: assignment detail inside a course
- `/student/ai-tutor`: primary governed AI tutoring interface
- `/student/ai-chat`: alternate or older AI chat page retained in the app surface
- `/student/practice`: practice-oriented student work area
- `/student/gamification`: gamification hub
- `/student/gamification/flashcards`: flashcard experience
- `/student/gamification/sprint`: sprint challenge mode
- `/student/gamification/spin`: spin wheel style reward/game mode
- `/student/gamification/boss-battle`: boss battle mode
- `/student/mastery`: mastery map and weak-area visibility
- `/student/insights`: analytics and progress insights
- `/student/leaderboard`: ranking/XP leaderboard
- `/student/settings`: profile and settings surface
- `/student/assignments`: assignment list outside the assessment hub
- `/student/assignments/[assignmentId]/workspace`: assignment workspace page

#### Student assessment-mode routes

- `/student/assessment`: assessment dashboard/hub
- `/student/assessment/assignments`: assignment list for the assessment workflow
- `/student/assessment/assignments/[subjectId]`: subject-filtered assignment view
- `/student/assessment/quizzes`: quiz list
- `/student/assessment/quizzes/[subjectId]`: quizzes for a subject
- `/student/assessment/quizzes/[subjectId]/attempt/[attemptId]`: active quiz attempt page
- `/student/assessment/results`: results page

#### Student page behavior and UI style

Common student UI patterns:

- dashboard cards for XP, streak, mastery, recent activity
- progress bars and stat rings
- charts loaded dynamically to avoid SSR issues
- fallback mock data used when APIs are unavailable in some screens
- strong visual distinction between learning mode and assessment mode navigation, even though both live under `/student`

The student dashboard in `frontend/src/app/student/page.tsx` is highly visual and uses:

- animated counters
- custom pixel-art icon blocks
- performance charts
- weak-topic surfaces
- action cards for AI tutor, practice, and challenge flows

#### Student AI tutor page

`/student/ai-tutor` is one of the most important pages in the system.

It combines:

- a topic or chapter selector
- current-topic session info
- mastery indicator for the selected topic
- governance explanation panel
- the `ChatWindow` component

The page explicitly frames the AI as governed by curriculum-only retrieval. It is not presented as open-ended generic chat.

### 7.3 Teacher routes

Primary teacher routes:

- `/teacher`: teacher dashboard
- `/teacher/courses`: teacher courses list
- `/teacher/courses/create`: create course page
- `/teacher/courses/[courseId]`: course detail/management
- `/teacher/curriculum`: curriculum overview
- `/teacher/curriculum/[courseId]`: course curriculum detail
- `/teacher/curriculum/[courseId]/[chapterId]`: chapter-level curriculum view
- `/teacher/content`: content management surface
- `/teacher/assessment-studio`: assessment builder hub
- `/teacher/assessment-studio/create`: create assessment chooser or entry point
- `/teacher/assessment-studio/create/assignment`: assignment creation flow
- `/teacher/assessment-studio/create/quiz`: quiz creation flow
- `/teacher/assessment-studio/[assignmentId]`: assignment editor
- `/teacher/assignments`: assignments list
- `/teacher/assignments/new`: alternate new assignment path
- `/teacher/results`: results hub
- `/teacher/results/[subjectId]`: subject results overview
- `/teacher/results/[subjectId]/assignment/[assignmentId]`: assignment result detail
- `/teacher/results/[subjectId]/quiz/[quizId]`: quiz result detail
- `/teacher/evaluation/[courseId]`: evaluation by course
- `/teacher/cohort`: cohort intelligence
- `/teacher/analytics`: analytics page
- `/teacher/integrity`: integrity and monitoring page
- `/teacher/reports`: report/export page
- `/teacher/settings`: settings page

#### Teacher page behavior and UI style

Teacher pages emphasize:

- cohort-level analytics
- at-risk student surfacing
- class averages and trends
- authoring and managing assessments
- grading and results review
- course/chapter/content management

The teacher dashboard uses:

- animated metric cards
- performance chart panels
- course summary cards
- at-risk student views
- loading skeletons during fetches

### 7.4 Admin routes

Primary admin routes:

- `/admin`: admin dashboard
- `/admin/users`: user and role management
- `/admin/ai-policy`: AI governance controls
- `/admin/knowledge-base`: knowledge base administration
- `/admin/assessment-governance`: assessment governance page
- `/admin/analytics`: institutional analytics
- `/admin/integrity`: integrity/security monitoring
- `/admin/accessibility`: accessibility oversight
- `/admin/reports`: report and accreditation surface
- `/admin/usage`: usage analytics
- `/admin/settings`: admin/system settings

#### Admin page behavior and UI style

Admin pages emphasize:

- institution-wide health and counts
- policy switches and governance controls
- user lifecycle management
- analytics and operational oversight
- reporting and accreditation readiness

The admin dashboard combines:

- KPI metric cards
- recent users table
- AI policy toggle panel
- quick action cards
- database and AI-service health indicators

### 7.5 Role navigation model

#### Student learning navigation

- Overview
- My Courses
- AI Tutor
- Practice
- Gamification
- Mastery
- Insights

#### Student assessment navigation

- Dashboard
- Assignments
- Quizzes
- Results

#### Teacher navigation

- Overview
- Curriculum
- Assessment Studio
- Evaluation and Results
- Cohort Intelligence
- Integrity and Monitoring
- Reports and Export

#### Admin navigation

- Overview
- Policy Control
- Knowledge Base
- User and Role
- Assessment Governance
- Institutional Analytics
- Integrity and Security
- Inclusion Oversight
- Reports and Accreditation

## 8. UI Page Notes by Experience Area

### 8.1 Landing page

The landing page is not a generic placeholder. It has a deliberate marketing experience with:

- fixed translucent navbar
- dark premium-style background
- glowing radial accent shapes
- animated reveal sections using motion
- feature cards, steps, benefit blocks, and strong CTA buttons

The message is centered on governed AI, mastery tracking, gamification, analytics, and accessibility.

### 8.2 Dashboards

All three role dashboards are card-driven and analytics-oriented, but the emphasis differs:

- student: motivation, mastery, streaks, actions, recent progress
- teacher: class oversight, at-risk students, course activity, performance
- admin: platform health, usage, user counts, policy settings

### 8.3 AI surfaces

AI is exposed through:

- governed student tutoring pages
- chat window/message components
- voice-related input/output hooks and prompt box UI

There are two important AI interaction patterns:

- curriculum-bound tutor experience
- broader conversational page remnants or secondary routes retained during iteration

### 8.4 Assessment surfaces

Assessment UX spans:

- teacher authoring studio
- student assessment dashboards and quiz attempt pages
- teacher grading/result review pages
- report/export and governance pages

### 8.5 Curriculum/content surfaces

Teachers manage learning material through pages and APIs that work at the course, chapter, and content-item levels. Content can be re-ingested into the AI knowledge base after updates.

## 9. API Surface in `frontend/src/app/api`

The Next.js app currently contains a large route-handler surface. The routes below are the current inventory grouped by domain.

### 9.1 Auth routes

- `POST /api/auth/login`: standard login
- `POST /api/auth/register`: registration
- `GET /api/auth/me`: current authenticated user
- `PUT /api/auth/profile`: update current profile

### 9.2 Admin auth and admin control routes

- `POST /api/admin/login`: begin admin login, generate/send OTP
- `POST /api/admin/verify-otp`: verify OTP and issue admin token
- `GET /api/admin/dashboard/stats`: admin dashboard metrics
- `GET /api/admin/users`: list users
- `POST /api/admin/users`: create user
- `PATCH /api/admin/users/[id]`: update user
- `DELETE /api/admin/users/[id]`: delete or remove user
- `GET /api/admin/ai-policy`: read AI governance policy
- `PUT /api/admin/ai-policy`: update AI governance policy
- `GET /api/admin/integrity-policy`: read integrity policy
- `PATCH /api/admin/integrity-policy`: update integrity policy

Admin reporting routes:

- `GET /api/admin/reports/list`
- `POST /api/admin/reports/generate`
- `GET /api/admin/reports/accreditation`
- `POST /api/admin/reports/download`

### 9.3 Student routes

Student dashboard and analytics:

- `GET /api/student/dashboard`
- `GET /api/student/performance/trend`
- `GET /api/student/mastery`
- `GET /api/student/mastery/weak-topics`
- `GET /api/student/mastery/course/[courseId]`

Student accessibility:

- `GET /api/student/accessibility`
- `PUT /api/student/accessibility`

Student course and curriculum access:

- `GET /api/student/courses`
- `GET /api/student/courses/[courseId]`
- `GET /api/student/courses/[courseId]/subjects`
- `GET /api/student/courses/[courseId]/chapters`
- `GET /api/student/courses/[courseId]/assignments`
- `GET /api/student/subjects/[subjectId]/topics`
- `GET /api/student/subjects/[subjectId]/quizzes`

Student assignments, submissions, and attempts:

- `GET /api/student/assignments`
- `GET /api/student/assignments/[assignmentId]`
- `GET /api/student/assignments/[assignmentId]/comments`
- `POST /api/student/assignments/[assignmentId]/comments`
- `POST /api/student/assignments/[assignmentId]/attempt`
- `GET /api/student/submissions`
- `GET /api/student/attempts/[attemptId]`
- `PATCH /api/student/attempts/[attemptId]/draft`
- `POST /api/student/attempts/[attemptId]/answer`
- `POST /api/student/attempts/[attemptId]/submit`

Student quizzes and uploads:

- `GET /api/student/quizzes`
- `POST /api/student/upload`

### 9.4 Teacher routes

Teacher dashboard and overview:

- `GET /api/teacher/dashboard`
- `GET /api/teacher/cohort`

Teacher courses and enrollments:

- `GET /api/teacher/courses`
- `GET /api/teacher/courses/[courseId]/students`
- `GET /api/teacher/courses/[courseId]/assignments`

Teacher curriculum:

- `GET /api/teacher/curriculum/courses`
- `POST /api/teacher/curriculum/courses`
- `GET /api/teacher/curriculum/courses/[courseId]/chapters`
- `POST /api/teacher/curriculum/courses/[courseId]/chapters`
- `GET /api/teacher/curriculum/chapters/[chapterId]`
- `PUT /api/teacher/curriculum/chapters/[chapterId]`
- `DELETE /api/teacher/curriculum/chapters/[chapterId]`
- `GET /api/teacher/curriculum/chapters/[chapterId]/content`
- `POST /api/teacher/curriculum/chapters/[chapterId]/content`
- `PUT /api/teacher/curriculum/chapters/[chapterId]/content/[contentId]`
- `DELETE /api/teacher/curriculum/chapters/[chapterId]/content/[contentId]`
- `POST /api/teacher/curriculum/chapters/[chapterId]/content/youtube`
- `POST /api/teacher/curriculum/chapters/[chapterId]/content/teacher-notes`
- `POST /api/teacher/curriculum/chapters/[chapterId]/reingest`

Teacher assignments, questions, and grading:

- `GET /api/teacher/assignments`
- `POST /api/teacher/assignments`
- `GET /api/teacher/assignments/[assignmentId]`
- `PUT /api/teacher/assignments/[assignmentId]`
- `DELETE /api/teacher/assignments/[assignmentId]`
- `GET /api/teacher/assignments/[assignmentId]/results`
- `POST /api/teacher/assignments/[assignmentId]/questions`
- `POST /api/teacher/assignments/[assignmentId]/publish`
- `PUT /api/teacher/questions/[questionId]`
- `DELETE /api/teacher/questions/[questionId]`
- `POST /api/teacher/attempts/[attemptId]/grade`
- `POST /api/teacher/evaluation`

### 9.5 AI, compiler, uploads, gamification, and generic report routes

AI routes:

- `POST /api/ai/chat`
- `POST /api/ai/tutor`

Compiler route:

- `POST /api/compiler`

Uploads:

- `POST /api/upload`
- `POST /api/upload/file`

Gamification:

- `GET /api/gamification/xp`

General assignments and reports:

- `GET /api/assignments`
- `POST /api/assignments`
- `GET /api/reports/filters`
- `POST /api/reports/data`
- `POST /api/reports/export-csv`
- `POST /api/reports/export-zip`

### 9.6 API design characteristics

Common patterns across route handlers:

- `runtime = 'nodejs'`
- dynamic behavior rather than static caching for user-specific responses
- institution-scoped access based on token payload
- role checks at route entry
- Prisma data access combined with service-layer logic
- graceful fallback to demo/mock data in some user-facing flows

## 10. Frontend Service Layer

The `frontend/src/services` directory contains both server-oriented and client-oriented service modules.

Important modules include:

- `authService.ts`: client auth helpers
- `apiClient.ts`: HTTP client wrapper
- `curriculumService.ts`: client course/chapter/content access
- `assessmentStudioService.ts`: assessment authoring helpers
- `analyticsService.ts`: student/teacher analytics access
- `teacherService.ts`: teacher-facing data helpers
- `adminService.ts`: admin-facing API integration
- `aiService.ts`: client bridge for AI chat/tutor interactions
- `accessibility.service.ts`: accessibility domain logic
- `assessment.service.ts`: assessment domain logic
- `curriculum.service.ts`: curriculum domain logic
- `gamification.service.ts`: server/business logic for XP and game systems
- `mastery.service.ts`: mastery calculations and retrieval
- `user.service.ts`: user operations
- `admin-otp.service.ts`: admin OTP flow support

This split reflects the hybrid nature of the codebase: some services are called by React pages, while others are used by route handlers as business-logic modules.

## 11. AI Service Architecture in `ai-services/`

The AI service is a separate Express application. It is the core engine for LLM calls, retrieval, ingestion, semantic caching, and voice services.

### 11.1 AI service endpoints

Core endpoints exposed by `ai-services/src/index.ts`:

- `GET /health`
- `POST /embed`
- `POST /query`
- `POST /assessment-query`
- `POST /ingest`
- `POST /ingest-file`
- `POST /tutor`
- `POST /voice/stt`
- `POST /voice/tts`

### 11.2 AI pipeline responsibilities

#### Learning pipeline

`ai-services/src/pipelines/learningPipeline.ts` handles governed tutoring flows:

- retrieve relevant curriculum chunks
- build governed prompts
- generate explanation or hint responses
- parse or structure outputs
- attach sources/concepts where applicable

#### Assessment pipeline

`ai-services/src/pipelines/assessmentPipeline.ts` is stricter and intentionally limits help. It supports hint-only or stricter anti-answer modes.

#### AI tutor pipeline

`ai-services/src/pipelines/aiTutor.ts` appears to back the faster tutor path, including semantic cache usage and Groq-backed response generation.

#### Gamification pipeline

`ai-services/src/pipelines/gamificationPipeline.ts` generates game and challenge content such as question sets and flashcards.

#### Ingestion pipeline

`ai-services/src/pipelines/ingestCurriculum.ts` handles text or PDF-derived content ingestion into the retrieval index.

### 11.3 Retrieval-augmented generation stack

RAG-related modules:

- `rag/chunker.ts`: split content into chunks with overlap
- `rag/embedder.ts` and `rag/embeddings.ts`: generate embeddings
- `rag/vectorStore.ts`: Pinecone interaction
- `rag/retriever.ts`: query-time retrieval

General model:

1. content is chunked
2. chunks are embedded
3. vectors are stored in Pinecone with metadata
4. user query is embedded
5. top relevant chunks are retrieved
6. governed prompt is built from those chunks
7. model response is generated and returned with sources

### 11.4 Prompt-engine modules

Prompt construction is deliberately separated:

- `prompt-engine/governedPrompt.ts`
- `prompt-engine/hintModePrompt.ts`
- `prompt-engine/assessmentMode.ts`

This is a strong signal that the product philosophy is not generic chat. The system explicitly distinguishes between normal teaching, hint-only help, and stricter exam/assessment behavior.

### 11.5 Speech features

Voice modules:

- `voice/speechToText.ts`
- `voice/textToSpeech.ts`

There are two speech patterns in the overall system:

- service-side STT/TTS endpoints in `ai-services/`
- browser-native speech recognition and synthesis hooks/components in the frontend

The current frontend prompt box work also indicates browser-native speech recognition support in the UI layer.

### 11.6 Semantic cache

`cache/semanticCache.ts` implements embedding-based cache reuse for semantically similar questions. That reduces cost and latency for repeated tutor queries.

### 11.7 LLM and provider configuration

Config modules:

- `config/openai.ts`
- `config/groq.ts`
- `config/pinecone.ts`
- `config/speech.ts`

In practice:

- OpenAI is used for embeddings and some response generation
- Groq is used for fast tutor inference
- Pinecone stores curriculum vectors

## 12. Database Model and Core Domain Concepts

The Prisma schema lives in `frontend/prisma/schema.prisma` and models a fairly broad academic platform.

### 12.1 Core enums

Important enums include:

- `UserRole`: student, teacher, admin
- `AIMode`: learning, assessment, practice
- `ResponseType`: explanation, hint, restricted
- `InteractionType`: doubt, quiz, flashcard, boss_battle
- `ActivityType`: quiz, assignment, boss_battle, flashcard, practice, ai_learning
- `BattleStatus`
- `XPSource`
- `RewardType`
- `DifficultyLevel`

### 12.2 Major model groups

#### Institution and users

- `Institution`
- `User`
- `UserProfile`
- `AccessibilitySettings`

These support multi-tenant institutional scoping, role-based users, profile data, and accessibility preferences.

#### Courses and curriculum

- `Course`
- `TeacherCourseAssignment`
- `Chapter`
- `ChapterContent`
- `Subject`
- `Topic`
- `CurriculumContent`
- `PrerequisiteRelation`

This supports both chapter-oriented and subject/topic-oriented academic structures. That duality is one reason the codebase may appear to have overlapping curriculum patterns.

#### AI sessions and interactions

- `AISession`
- `AIMessage`
- `ConceptInteraction`
- `AIPolicySettings`
- `IntegrityPolicy`
- governance-related logging models

These models support governed AI chat, message history, concept-level tracking, and institution-specific AI rules.

#### Assessment domain

The schema includes models for assignments, questions, attempts, grading, and evaluation-related workflows. In the UI and APIs, this domain spans authoring, submission, draft saving, grading, rubric/comment support, and results review.

#### Mastery and performance

Key concepts include:

- `MasteryGraph`
- per-topic or per-course mastery tracking
- performance logs
- weak-topic flags
- teacher insights

#### Gamification

The schema includes XP and game-related concepts such as:

- student XP
- XP logs
- boss battles
- flashcard progress
- spin rewards

### 12.3 Product-level data model summary

Conceptually, the platform connects these layers:

1. institution
2. users and role permissions
3. courses and curriculum structure
4. learning/AI interaction and mastery updates
5. assessment attempts and grading
6. gamified engagement and rewards
7. analytics, governance, and reporting

## 13. Key Product Workflows

### 13.1 Student learning workflow

1. student logs in
2. student views dashboard and enrolled courses
3. student enters AI tutor, practice, or gamified learning flows
4. student asks curriculum-bound questions
5. relevant content is retrieved via RAG
6. answer is returned with governed framing and sources
7. interactions can feed mastery/performance data

### 13.2 Teacher curriculum workflow

1. teacher creates or manages course structures
2. teacher creates chapters and uploads content
3. teacher adds curriculum items, YouTube links, or notes
4. teacher triggers chapter re-ingestion
5. updated content becomes available to AI retrieval flows

### 13.3 Assessment workflow

1. teacher creates assignment or quiz in assessment studio
2. teacher adds questions and publishes the assessment
3. student starts assignment/quiz attempt
4. student saves drafts or answers incrementally
5. student submits
6. teacher grades attempt and leaves feedback
7. student reviews result and explanation data

### 13.4 Admin governance workflow

1. admin logs in through OTP flow
2. admin reviews health, users, analytics, and reports
3. admin updates AI policy or integrity policy
4. changes affect how student and teacher AI/help flows behave at the institution level

### 13.5 Reporting workflow

Teacher/admin reporting features support:

- filter selection
- report data generation
- CSV export
- ZIP export bundles
- accreditation-oriented reporting

## 14. Legacy Backend in `backend/`

The `backend/` package is important context even if the frontend now owns much of the active fullstack surface.

What it represents:

- the earlier Express backend architecture
- legacy route/service implementations
- a reference for older integrations
- possible external API target when proxy rewrites are enabled

A good mental model is:

- if a concept exists in both `frontend/src/app/api` and `backend/src`, the frontend route-handler version is usually the more current app-integrated layer, but the backend may still contain useful logic, old flow assumptions, or active deployment options.

## 15. Shared Package

The `shared/` package exports:

- user types
- course types
- mastery types
- gamification types
- API types
- evaluation types
- role constants
- mode constants
- config constants

This is the common contract layer across frontend, backend, and AI-related code.

## 16. Environment and Configuration

Sensitive values should come from `.env`, but the project expects variables in these categories:

### 16.1 Database

- `DATABASE_URL`
- `DIRECT_URL`

### 16.2 Auth

- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### 16.3 AI and vector infrastructure

- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `PINECONE_ENVIRONMENT`
- `AI_SERVICE_URL`

### 16.4 Speech and voice

- `GOOGLE_SPEECH_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

### 16.5 Email/admin/upload support

- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- upload-related size/path config

## 17. Important Project Characteristics and Caveats

### 17.1 Hybrid/iterative codebase

This repo is not a small greenfield app. It shows multiple generations of architecture. Any AI assistant working on it should expect:

- some duplicate domain surfaces
- both old and new implementations of similar features
- route/page pairs that are still present but not part of the primary nav
- docs that may lag behind live code

### 17.2 Mock and fallback behavior

Several user-facing pages contain mock fallback data to keep the UI usable even when backend pieces are incomplete or unavailable. That is deliberate and should not automatically be interpreted as a bug.

### 17.3 Governance is central, not optional

This is not merely an LMS with a chatbot attached. AI governance is a first-class design concern. Chat, hinting, assessment help, policy control, integrity checks, and curriculum-bound retrieval are core product identity.

### 17.4 Accessibility is built-in at the design level

Accessibility is not isolated to a settings screen. It affects typography, layout behavior, distraction levels, contrast, and voice interactions across the shell.

### 17.5 Current live code matters more than historical docs

If another AI or developer needs to choose between a doc and the current contents of `frontend/src/app`, `frontend/src/app/api`, `frontend/src/components`, and `ai-services/src`, the code should be treated as the source of truth.

## 18. Best Mental Model for Another AI Assistant

If another LLM needs a compact but accurate way to think about IntelliCampus, use this:

IntelliCampus is a role-based academic platform where a Next.js app provides dashboards, assessments, curriculum management, gamification, reporting, and governed AI tutoring. Students use curriculum-bound AI, course pages, assessment flows, and game-like learning loops. Teachers manage curriculum, author quizzes and assignments, grade attempts, review cohort insights, and trigger AI re-ingestion of materials. Admins manage users, AI/integrity policy, analytics, reporting, and accessibility oversight. Prisma/PostgreSQL models institutions, users, courses, chapters, subjects, topics, assignments, attempts, mastery, XP, and governance data. AI capabilities live in a separate microservice that handles ingestion, embeddings, Pinecone retrieval, prompt governance, tutoring, assessment hinting, speech services, and semantic caching. The repo is hybrid: the Next.js frontend is the main current app surface, the Express backend is legacy/optional, and the AI service remains a dedicated subsystem.

## 19. Recommended Source-of-Truth Files

For future code understanding, these files are the most important starting points:

- `frontend/src/app/`: real page surface
- `frontend/src/app/api/`: current API surface
- `frontend/src/components/chrome/`: shell/navigation UI
- `frontend/src/components/ai/`: chat UI
- `frontend/src/lib/navigation.ts`: role navigation map
- `frontend/src/lib/auth.ts`: auth enforcement pattern
- `frontend/prisma/schema.prisma`: domain schema
- `frontend/src/services/`: service layer
- `ai-services/src/index.ts`: AI service entrypoint
- `ai-services/src/pipelines/`: AI behavior orchestration
- `ai-services/src/rag/`: retrieval and vector logic
- `shared/index.ts`: shared contracts
