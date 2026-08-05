# SMIT Teacher Agent

AI-powered teaching assistant for SMIT: upload course materials, then chat with the
AI about them with cited sources. Includes student/teacher/admin roles, course
management, document ingestion, and vector-based retrieval.

## Architecture

```
apps/
  web/          Next.js 15 (App Router) frontend   → deploy on Vercel
  api/          Express + Prisma + Qdrant backend  → deploy on Render / Railway
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
cp .env.example apps/api/.env   # fill in DATABASE_URL, QDRANT_URL, QDRANT_API_KEY, JWT secrets
npm run db:generate             # prisma generate
npm run db:deploy               # apply migrations to your Neon database
npm run db:seed                 # creates admin@smit.edu.pk (password = ADMIN_SEED_SECRET)
npm run dev                     # API on :5000, web on :3000
```

Point `NEXT_PUBLIC_API_URL` (in `apps/web/.env.local` if not using the default)
at `http://localhost:5000` for local frontend → API calls.

## Project scripts

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Run API + web together (concurrently)          |
| `npm run build`    | Build shared, api, and web                     |
| `npm run build:api`| Build shared + api (used by Render/Railway)    |
| `npm run build:web`| Build web (used by Vercel)                     |
| `npm run typecheck`| Type-check all workspaces                      |
| `npm test`         | Run API tests (Vitest)                         |
| `npm run db:*`     | `generate` / `deploy` / `migrate` / `seed`     |

## Deploying the frontend → Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Project settings:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `next build` (already set in `apps/web/vercel.json`)
3. Add the environment variable (Vercel → Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` — e.g. `https://<your-api>.onrender.com`
4. Deploy.

> `NEXT_PUBLIC_*` variables are inlined at build time — if you change it, redeploy.

## Deploying the API → Render or Railway

The repo includes `render.yaml` (Render Blueprint) and `apps/api/Procfile`
(used by both Render and Railway).

### Render

1. New → Blueprint → select the repo. Root directory is `apps/api`.
2. Build: `npm run build && npx prisma generate`
3. Start: `npm run start:prod` (runs `prisma migrate deploy`, then starts the server)
4. Health check: `/health` (already configured).
5. Set the secret env vars marked `sync: false` in `render.yaml`:
   `DATABASE_URL`, `QDRANT_URL`, `QDRANT_API_KEY`, `GEMINI_API_KEY`,
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_SEED_SECRET`.
6. Set `CORS_ORIGIN` to include your Vercel app URL (comma-separated).

### Railway

1. Import the repo, set **Root Directory** to `apps/api`.
2. The `Procfile` (`web: npm run start:prod`) is auto-detected.
3. Add the same environment variables listed above (Railway injects `PORT`).

> The API runs `prisma migrate deploy` on every boot, so the Neon database is
> migrated automatically on first deploy. Run `npm run db:seed` locally (or via
> the seed endpoint) once to create the admin user.

## Admin access

After seeding, sign in as `admin@smit.edu.pk` with password = `ADMIN_SEED_SECRET`.
Alternatively, call `POST /api/v1/auth/admin/seed` with `{ adminSeedSecret }` to
promote yourself. Admins can create courses, manage documents, and review users
in the `/admin` and `/settings` pages.

## Environment variables

See [`.env.example`](.env.example) for the full annotated list. Required in all
environments: `DATABASE_URL`, `QDRANT_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `ADMIN_SEED_SECRET`, plus `QDRANT_API_KEY` for the cloud
vector DB. Set `LLM_PROVIDER=sodeom` for zero-key chat (add `SODEOM_BASE_URL` /
`SODEOM_MODEL` as needed), or `LLM_PROVIDER=gemini` with `GEMINI_API_KEY` to
enable embeddings, ingestion, and cited answers.

## Notes

- Uploaded files are stored on the API server's local disk, which is ephemeral
  on Render/Railway — files must be re-uploaded after a redeploy. Object storage
  (S3/R2) is a planned enhancement.
- `QDRANT_COLLECTION` defaults to `smit_course_docs` and is created on boot with
  the embedding dimension matching `GEMINI_EMBED_MODEL` (`EMBEDDING_DIM`).
