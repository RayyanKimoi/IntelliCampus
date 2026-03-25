# Frontend Setup

This repository is frontend-first. The Next.js app in `frontend/` is the main local runtime and already contains most active API routes, Prisma access, and student/teacher/admin flows.

## Prerequisites

1. Install Node.js 18 or newer.
2. Install pnpm 8 or newer.
3. Provision a PostgreSQL database.
4. Provision Supabase if you need uploads and storage-backed files.
5. Start the AI microservice separately only if you want AI tutor, adaptive quiz, ingestion, or voice flows.

## Install dependencies

From the repository root:

```bash
pnpm install
```

This installs dependencies for the workspace packages defined in `pnpm-workspace.yaml`.

## Configure environment variables

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Fill in the database variables first:
   - `DATABASE_URL`
   - `DIRECT_URL`
3. Set authentication values:
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
4. Configure Supabase if you use uploads:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Configure optional integrations only when you need them:
   - `AI_SERVICE_URL`
   - `RESEND_API_KEY`
   - `JDOODLE_CLIENT_ID`
   - `JDOODLE_CLIENT_SECRET`
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`
   - `PINECONE_ENVIRONMENT`
   - `GOOGLE_SPEECH_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

## Prepare the database

The active Prisma schema is in `frontend/prisma/schema.prisma`.

Run these commands from the repository root:

```bash
pnpm db:migrate:deploy
pnpm db:generate
```

If you want seed data as well:

```bash
pnpm db:seed
```

Notes:

- `pnpm db:migrate:deploy` is the safest command when you already have a database and want to apply checked-in migrations.
- `pnpm db:migrate` runs `prisma migrate dev` and is intended for schema development, not first-time teammate onboarding against a shared database.
- There is also `seed_students_and_enrollments.sql` in the repository root if you need SQL-based demo data.

## Run the frontend locally

From the repository root:

```bash
pnpm dev:frontend
```

Or from the frontend package:

```bash
pnpm dev
```

Default URL:

```text
http://localhost:3000
```

## Build commands

From the repository root:

```bash
pnpm build:frontend
```

From the frontend package:

```bash
pnpm build
```

The frontend build runs `prisma generate` before `next build`.

## Useful Prisma commands

From the repository root:

```bash
pnpm db:generate
pnpm db:studio
pnpm db:seed
```

## Optional supporting services

### AI microservice

The frontend calls `AI_SERVICE_URL` for tutor, practice, ingestion, and voice flows. If you are testing those features, start the AI service separately:

```bash
pnpm dev:ai
```

### Legacy Express backend

The frontend normally handles `/api/*` with App Router route handlers. Only set `BACKEND_URL` and run the backend if you explicitly want `/api/*` proxied to the Express server.

## Troubleshooting

### Frontend starts but database calls fail

Check these values in `frontend/.env`:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`

Then rerun:

```bash
pnpm db:generate
```

### File uploads fail

Check these values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The upload layer in `frontend/src/lib/supabase-storage.ts` requires both the public URL and the service-role key.

### AI features return unavailable or fallback responses

Make sure `AI_SERVICE_URL` points to a running ai-services instance and that the ai-services env values are configured.

### Compiler endpoint returns 503

Set both:

- `JDOODLE_CLIENT_ID`
- `JDOODLE_CLIENT_SECRET`
