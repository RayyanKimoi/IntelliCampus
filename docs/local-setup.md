# Local Setup

This guide sets up the whole IntelliCampus workspace from scratch on a new machine.

## What you are setting up

The monorepo has four workspace packages:

- `frontend/`: primary runtime, Next.js 15 App Router, Prisma, active API routes
- `backend/`: legacy or optional Express backend
- `ai-services/`: separate AI microservice for tutoring, adaptive content, ingestion, voice, and semantic cache
- `shared/`: shared types and constants

For most feature work you only need:

- PostgreSQL
- the frontend package

You only need Redis and extra AI credentials when testing AI features.

## Prerequisites

Install the following before touching the repo:

1. Node.js 18 or newer
2. pnpm 8 or newer
3. PostgreSQL
4. Redis if you plan to run cache-backed AI flows
5. A Supabase project if you need storage-backed file uploads

## Step 1: Clone and install

From your working directory:

```bash
git clone <your-repo-url>
cd IntelliCampus
pnpm install
```

## Step 2: Create environment files

Create these files from the included examples:

```bash
copy .env.example .env
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
copy ai-services\.env.example ai-services\.env
```

What to fill in first:

- In `frontend/.env`: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`
- In `backend/.env`: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- In `ai-services/.env`: `REDIS_URL`, `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`

Important runtime note:

- The current ai-services boot file loads `frontend/.env` by default.
- Keep the values in `frontend/.env` and `ai-services/.env` aligned if you run the AI service without changing that loader.

## Step 3: Provision PostgreSQL

Create a database for IntelliCampus, then place its connection string into:

- `frontend/.env` as `DATABASE_URL`
- `frontend/.env` as `DIRECT_URL`
- `backend/.env` as `DATABASE_URL` if you also run the Express backend

If you are using a pooler such as Supabase PgBouncer:

- use the pooled string for `DATABASE_URL`
- use the direct connection for `DIRECT_URL`

## Step 4: Apply schema and generate Prisma client

From the repository root:

```bash
pnpm db:migrate:deploy
pnpm db:generate
```

Optional seed:

```bash
pnpm db:seed
```

Optional SQL seed path:

- `seed_students_and_enrollments.sql`

Known practical guidance:

- use `pnpm db:migrate:deploy` for teammate onboarding and shared databases
- avoid `pnpm db:migrate` unless you are actively creating new migrations

## Step 5: Configure optional integrations

### Supabase storage

Set these in `frontend/.env` if you need uploads or storage-backed content:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Email / OTP

Set this in `frontend/.env` if you need email delivery:

- `RESEND_API_KEY`

### Compiler integration

Set these in `frontend/.env` if you need code execution through JDoodle:

- `JDOODLE_CLIENT_ID`
- `JDOODLE_CLIENT_SECRET`

### AI services

Set these for AI tutor, embeddings, RAG, and cache-backed flows:

- `AI_SERVICE_URL`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `HUGGINGFACE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME` or `PINECONE_INDEX`
- `REDIS_URL`
- `GOOGLE_SPEECH_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

## Step 6: Start the services

### Recommended minimal local stack

Start only the frontend first:

```bash
pnpm dev:frontend
```

Open:

```text
http://localhost:3000
```

### Full local stack

Frontend:

```bash
pnpm dev:frontend
```

AI microservice:

```bash
pnpm dev:ai
```

Optional backend:

```bash
pnpm dev:backend
```

You can also start everything with:

```bash
pnpm dev
```

Use the all-in-one command only after the env files are in place. It runs the workspace packages in parallel, so missing optional services can make the output noisy.

## Step 7: Verify the setup

### Frontend check

- open `http://localhost:3000`
- confirm the app renders without a startup error
- confirm database-backed pages do not fail immediately

### Prisma check

Run:

```bash
pnpm db:generate
```

### AI service check

If ai-services is running, check:

```text
http://localhost:5000/health
```

### Backend check

If backend is running, check:

```text
http://localhost:4000/api/health
```

## Common issues

### 1. Prisma generate or migration problems

Run:

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

If you are using Windows and Prisma engine files are locked, stop running Node processes first, then rerun the command.

### 2. Uploads fail

Check the Supabase variables in `frontend/.env` and restart the frontend server.

### 3. AI endpoints fail even though the frontend works

The frontend can run without the AI microservice. For AI features, confirm all of these are true:

- `pnpm dev:ai` is running
- `AI_SERVICE_URL` points to that service
- `REDIS_URL` is reachable
- AI provider keys are present
- Pinecone variables are present

### 4. Backend proxying does not happen

Set `BACKEND_URL` in `frontend/.env` and restart the frontend. Without it, Next.js handles `/api/*` locally.

## Recommended day-one workflow for a new developer

1. Install dependencies with `pnpm install`.
2. Configure `frontend/.env`.
3. Set up PostgreSQL and run `pnpm db:migrate:deploy` plus `pnpm db:generate`.
4. Start `pnpm dev:frontend`.
5. Add Supabase only when testing uploads.
6. Add ai-services plus Redis only when testing AI features.
7. Add the backend only when you specifically need the Express API path.
