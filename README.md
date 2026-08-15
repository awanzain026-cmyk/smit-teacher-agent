# SMIT Teacher Agent

AI-powered teaching assistant for SMIT: upload course materials, then chat with the
AI about them with cited sources. Includes student/teacher/admin roles, course
management, document ingestion, and vector-based retrieval.

## Architecture

```
./ (repo root)  Next.js 15 (App Router) frontend   → deploy on Vercel (auto-detected)
apps/
  api/          Express + Prisma + Qdrant backend  → deploy on Railway (railway.json)
packages/
  shared/       Shared TypeScript types (imported as `@smit/shared`)
```

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Server Components.
- **Backend**: Express 4 (ESM), Prisma ORM, JWT auth (access + refresh tokens),
  Zod validation, pino logging, rate limiting, Helmet, multer uploads.
- **RAG pipeline**: PDF/DOCX/PPTX → text chunks → Gemini embeddings → Qdrant
  vector search → LLM chat with source citations. **LLM providers**: Sodeom
  (free OpenAI-compatible proxy, no API key, chat only), Gemini (chat +
  embeddings), or OpenRouter (chat only). With Sodeom/OpenRouter the app runs
  with **zero keys** but document ingestion and cited answers are unavailable —
  chat falls back to plain conversation.
- **Database**: PostgreSQL (Neon recommended) via Prisma with committed migrations.

## Prerequisites

- Node.js 20+ (`.nvmrc` pinned to 20)
- Accounts: [Neon](https://neon.tech) (Postgres), [Qdrant Cloud](https://cloud.qdrant.io)
  (vectors).
- No AI key is required for the default **Sodeom** provider. Only add a free
  [Google AI Studio](https://aistudio.google.com/apikey) key if you want
  document ingestion + cited answers (`LLM_PROVIDER=gemini`).

## Local development

```bash
npm install
cp .env.example apps/api/.env   # only DATABASE_URL is truly required; everything else has defaults
npm run db:generate             # prisma generate
npm run db:deploy               # apply migrations to your Neon database
npm run db:seed                 # creates admin@smit.edu.pk (password = ADMIN_SEED_SECRET)
npm run dev                     # API on :5000, web on :3000
```

Point `NEXT_PUBLIC_API_URL` (in a root `.env.local` if not using the default)
at `http://localhost:5000` for local frontend → API calls.

## Project scripts

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Run API + web together (concurrently)          |
| `npm run build`    | Build the Next.js web app (used by Vercel)     |
| `npm run build:api`| Build shared + api (used by Railway via `railway.json`) |
| `npm run typecheck`| Type-check web, api, and shared                |
| `npm test`         | Run API tests (Vitest)                         |
| `npm run db:*`     | `generate` / `deploy` / `migrate` / `seed`     |

## Deploying the frontend → Vercel

1. Push this repo to GitHub and import it in Vercel.
2. No project settings needed — the Next.js app lives at the repo root, so Vercel
   auto-detects it. Leave **Root Directory** empty (default `/`).
3. Add the environment variable (Vercel → Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` — e.g. `https://<your-api>.onrender.com`
4. Deploy.

> `NEXT_PUBLIC_*` variables are inlined at build time — if you change it, redeploy.

## Deploying the API → Railway

The repo includes `railway.json`, which tells Railway exactly how to build and
start the API — no per-service settings needed.

1. Import the repo on Railway and **leave the service Root Directory empty**
   (repo root) so `railway.json` is picked up.
2. Railway runs: `npm run build:api && npm run db:generate` (builds shared +
   api, generates the Prisma client) and starts with `npm run start:api`.
3. Add the environment variable `DATABASE_URL` (your Neon connection string).
   Everything else has defaults.
4. Health check `/health` is configured; Railway injects `PORT` automatically.

> The API runs `prisma migrate deploy` and seeds the admin user on every boot,
> so the Neon database is migrated automatically on first deploy (both are
> idempotent).

## Admin access

After seeding, sign in as `admin@smit.edu.pk` with password = `ADMIN_SEED_SECRET`
(defaults to `dev_admin_seed_12345678` when unset). Admins can create courses,
manage documents, and review users in the `/admin` and `/settings` pages.

## Environment variables

See [`.env.example`](.env.example) for the full annotated list. **Only
`DATABASE_URL` is required** — every other variable has a safe default:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `ADMIN_SEED_SECRET` — optional
  (dev defaults are used when unset; set your own in production).
- `LLM_PROVIDER` — defaults to `sodeom` (free OpenAI-compatible proxy, no key
  needed) for zero-key chat. Set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` to
  enable document embeddings, ingestion, and cited answers.
- `QDRANT_URL` / `QDRANT_API_KEY` — optional; vector search is best-effort and
  the app runs fine without it.

## Notes

- Uploaded files are stored on the API server's local disk, which is ephemeral
  on Render/Railway — files must be re-uploaded after a redeploy. Object storage
  (S3/R2) is a planned enhancement.
- `QDRANT_COLLECTION` defaults to `smit_course_docs` and is created on boot with
  the embedding dimension matching `GEMINI_EMBED_MODEL` (`EMBEDDING_DIM`).
