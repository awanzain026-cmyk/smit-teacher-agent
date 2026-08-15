# SMIT Teacher Agent

A RAG-powered AI teaching assistant for SMIT. Teachers upload course materials
(PDF, DOCX, PPTX, TXT) and the system extracts the text, splits it into chunks,
embeds it with **Gemini embeddings**, stores the vectors in **Qdrant**, and
answers students' questions in chat with **citations back to the source
documents**.

Role-based access (admin / teacher / student) with course management, document
ingestion, conversation history, and streaming chat — all in one monorepo.

## Live deployment

| Part | URL |
| ---- | --- |
| App (frontend + API, same deployment) | https://smit-teacher-agent-api-dhzq.vercel.app |

> The API health check is `GET /api/health` → `{"status":"ok",...}` (the API
> runs as a serverless function inside the same Vercel project).

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Express 4 (ESM), TypeScript, Zod validation, JWT auth (access + refresh), pino logging, Helmet, rate limiting, multer uploads |
| Database | PostgreSQL (Neon) via Prisma ORM with committed migrations |
| Vector DB | Qdrant (best-effort — the app runs without it) |
| Embeddings | Google Gemini (`text-embedding-004`) |
| LLM | Sodeom (default, free OpenAI-compatible proxy, **no API key**) or Gemini / OpenRouter |
| Tests | Vitest + Supertest |
| Builds | tsup (API), Next.js (web) |

## Monorepo structure

```
./ (repo root)      Next.js 15 frontend (app/, components/, lib/)
apps/
  api/              Express + Prisma + Qdrant backend
    src/
      config/       zod-validated environment configuration
      middleware/   auth, rate limiting, file upload validation
      routes/       auth, documents, courses, chat, conversations, admin
      services/     parsing, chunking, embeddings, Qdrant, chat streaming
      lib/          prisma client, logger, error helpers
    prisma/         schema + committed migrations + admin seed
    tests/          Vitest suites (chunker, RAG)
packages/
  shared/           Shared TypeScript types (imported as `@smit/shared`)
api/index.mjs       Vercel serverless entry — mounts the Express app at /api
```

## RAG pipeline

1. **Upload** — teacher uploads a file (PDF / DOCX / PPTX / TXT, ≤ 15 MB);
   magic-byte signature is validated server-side.
2. **Parsing** — `officeparser` extracts text (PDF included).
3. **Chunking** — text is split into overlapping chunks (see
   `apps/api/src/services/chunker.ts`).
4. **Embedding** — chunks are embedded with Gemini `text-embedding-004`.
5. **Retrieval** — at chat time the question is embedded and Qdrant returns the
   most relevant chunks.
6. **Cited answer** — the LLM answers using only the retrieved chunks and
   cites the source documents.

Without a Gemini key (default setup) the app runs in **zero-key mode**: chat
works via Sodeom as a plain conversation, and document ingestion is disabled.

## Local setup

### Prerequisites

- Node.js 20+ (`.nvmrc` pinned to 20)
- A PostgreSQL database — [Neon](https://neon.tech) (free tier) is recommended
- Optional: [Qdrant Cloud](https://cloud.qdrant.io) for vector search, and a
  free [Google AI Studio](https://aistudio.google.com/apikey) key for
  embeddings + cited answers

### Install and run

```bash
npm install
cp .env.example apps/api/.env   # only DATABASE_URL is truly required; everything else has defaults
npm run db:generate             # prisma generate
npm run db:deploy               # apply migrations to your Neon database
npm run db:seed                 # creates admin@smit.edu.pk (password = ADMIN_SEED_SECRET)
npm run dev                     # API on :5000, web on :3000
```

For local frontend → API calls, optionally set `NEXT_PUBLIC_API_URL=http://localhost:5000`
in a root `.env.local` (not needed — the dev default already points there).

### Environment variables

Only **`DATABASE_URL`** is required; every other variable has a safe default.

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string (Neon) |
| `JWT_ACCESS_SECRET` | — | dev default | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | dev default | Signs refresh tokens (min 32 chars) |
| `ADMIN_SEED_SECRET` | — | `dev_admin_seed_12345678` | Admin password + seed salt |
| `LLM_PROVIDER` | — | `sodeom` | `sodeom` (zero-key) / `gemini` / `openrouter` |
| `GEMINI_API_KEY` | — | — | Enables embeddings, ingestion, cited answers |
| `QDRANT_URL` / `QDRANT_API_KEY` | — | localhost | Vector search (best-effort) |
| `CORS_ORIGIN` | — | `http://localhost:3000` | Comma-separated allowed origins |
| `API_PORT` | — | `5000` | API port (Railway injects `PORT`) |
| `MAX_FILE_MB` | — | `15` | Upload size limit |
| `NEXT_PUBLIC_API_URL` | — | `http://localhost:5000` | Frontend → API base URL (build-time, frontend only) |

## Project scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Run API + web together (concurrently) |
| `npm run build` | Build the Next.js web app (used by Vercel) |
| `npm run build:api` | Build shared + api (bundled into the Vercel function) |
| `npm run typecheck` | Type-check web, api, and shared |
| `npm test` | Run API tests (Vitest) |
| `npm run db:*` | `generate` / `deploy` / `migrate` / `seed` |

## Deployment

The whole app — frontend **and** API — deploys as one project on Vercel.

1. Import the repo on Vercel. The Next.js app lives at the repo root, so
   **Root Directory stays empty** — Vercel auto-detects it.
2. Add the env var `DATABASE_URL` (Neon connection string). Everything else
   has defaults.
3. Deploy. The build runs `prisma migrate deploy` + the admin seed, and the
   `api/index.mjs` function serves the Express API at `/api` — the frontend
   calls it same-origin, so no `NEXT_PUBLIC_API_URL` is needed.
4. Health check: `GET /api/health`.

## Admin access

Sign in as `admin@smit.edu.pk` with password = `ADMIN_SEED_SECRET` (default
`dev_admin_seed_12345678`). Admins create courses, manage documents, and review
users in the `/admin` and `/settings` pages. Students register from the
`/register` page.

## Notes & limitations

- Uploaded files are stored on the API server's local disk, which is ephemeral
  on Vercel serverless functions — files must be re-uploaded after a redeploy.
  Object storage (S3/R2) is a planned enhancement.
- Without Qdrant + Gemini the ingestion pipeline is disabled and chat falls
  back to plain (non-cited) answers.
- The API sleeps after ~15 min of inactivity on free Railway plans; the first
  request after idle takes ~30–60 s to wake the service.