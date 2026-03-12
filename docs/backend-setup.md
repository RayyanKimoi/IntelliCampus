# Backend Setup

The backend package in `backend/` is an Express server. In the current monorepo, it is no longer the default local runtime because the frontend already contains many active Next.js API route handlers. Run the backend when you specifically need the legacy Express API surface or want the frontend to proxy `/api/*` requests through `BACKEND_URL`.

## Prerequisites

1. Install Node.js 18 or newer.
2. Install pnpm 8 or newer.
3. Provision a PostgreSQL database.
4. Start the AI microservice as well if you want backend flows that depend on `AI_SERVICE_URL`.

## Install dependencies

From the repository root:

```bash
pnpm install
```

## Configure environment variables

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in required values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
3. Adjust service URLs if needed:
   - `PORT` defaults to `4000`
   - `AI_SERVICE_URL` defaults to `http://localhost:5000`
4. Add optional integrations only if the backend features you are testing use them:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`
   - `PINECONE_ENVIRONMENT`
   - `GOOGLE_SPEECH_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`

The backend env loader reads `backend/.env` from `backend/src/config/env.ts`.

## Prisma setup

The backend has its own Prisma commands and schema path.

From the repository root:

```bash
pnpm --filter @intellicampus/backend prisma:generate
pnpm --filter @intellicampus/backend prisma:migrate
```

Or from inside `backend/`:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

Use the backend Prisma workflow only if you are actively working on the backend package and its schema path.

## Run the backend locally

From the repository root:

```bash
pnpm dev:backend
```

Or from `backend/`:

```bash
pnpm dev
```

Default URL:

```text
http://localhost:4000/api/health
```

## Build and start

Build:

```bash
pnpm build:backend
```

Or from `backend/`:

```bash
pnpm build
```

Start the compiled server:

```bash
pnpm --filter @intellicampus/backend start
```

## Connect the frontend to the backend

If you want the Next.js frontend to proxy API requests to this backend, set the following value in `frontend/.env`:

```text
BACKEND_URL=http://localhost:4000
```

`frontend/next.config.js` only adds the rewrite when `BACKEND_URL` is defined.

## Required services

### PostgreSQL

Required. The backend reads `DATABASE_URL` and will not work without a reachable PostgreSQL instance.

### Redis

Not required by the backend package itself.

### AI microservice

Optional for backend boot, but required for any backend flow that calls `AI_SERVICE_URL`.

## Troubleshooting

### CORS or auth problems from the frontend

Check that `FRONTEND_URL` matches the frontend origin and that both frontend and backend use the same `JWT_SECRET`.

### Backend starts but Prisma queries fail

Check `DATABASE_URL` and rerun:

```bash
pnpm --filter @intellicampus/backend prisma:generate
```

### Frontend still hits Next.js route handlers instead of Express

Make sure `BACKEND_URL` is set in `frontend/.env`, then restart the frontend dev server.
