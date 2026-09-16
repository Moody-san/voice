# Voice AI Patient Registration

A voice AI agent, reachable at a real U.S. phone number, that collects standard
U.S. patient demographics through natural conversation, persists them to
Postgres, and exposes them through a REST API. Call the number to register;
call back and your data is still there.

```
   Phone call
      │
      ▼
┌──────────────┐   tool calls (sync)      ┌─────────────────┐      ┌────────────┐
│     Vapi     │ ───────────────────────▶ │  NestJS REST    │ ───▶ │ PostgreSQL │
│ telephony +  │   end-of-call webhook    │  API + validation│      │ (Docker)   │
│ STT+gpt-4o+TTS│ ◀─────────────────────── │  (business logic)│ ◀─── │            │
└──────────────┘                          └─────────────────┘      └────────────┘
      ▲                                            ▲
      │ public HTTPS (ngrok static domain)         │ REST
      │                                     ┌───────────────┐
      └─────────────────────────────────── │ Next.js        │
                                            │ dashboard (FE) │
                                            └───────────────┘
```

## How it works

1. A caller dials the Vapi number. The **assistant** (gpt-4o + a carefully
   engineered system prompt) greets them and collects demographics
   conversationally — one field at a time, handling corrections, spelling, and
   out-of-order answers.
2. As soon as the phone number is captured, the agent calls the
   **`lookupPatientByPhone`** tool → the backend checks for an existing record
   (duplicate detection) and the agent offers to *update* instead of create.
3. The agent reads everything back, gets explicit confirmation, then calls
   **`savePatient`** → the backend **validates server-side** and persists.
4. The agent relays success (or reads back the specific field to fix) and ends
   the call gracefully.
5. When the call ends, Vapi posts an **end-of-call-report** → the backend stores
   the transcript/summary in a `calls` table.
6. The **REST API** and the **Next.js dashboard** expose the stored records.

## Repository layout

```
backend/    NestJS + TypeORM REST API and Vapi webhook (the core system)
frontend/   Next.js patient dashboard (reads the REST API)
vapi/        Assistant system prompt, tool schemas, and dashboard wiring guide
```

Each has its own README with detail. Start with [`vapi/README.md`](./vapi/README.md)
to wire the phone number, and [`backend/README.md`](./backend/README.md) for the API.

## Tech stack & why

| Layer | Choice | Why |
|-------|--------|-----|
| Telephony + Voice AI | **Vapi** | Handles the phone number, streaming STT/TTS, barge-in, and LLM turn-taking so we focus on the conversation + data. Free number, tool/function calling into our API. |
| LLM | **OpenAI gpt-4o** (via Vapi) | Low latency for real-time voice and strong at messy corrections and structured extraction. |
| Backend | **NestJS (TypeScript)** | Clear module boundaries (telephony webhook vs. patients vs. data layer), first-class DI, validation pipes, and interceptors/filters for a consistent response envelope. |
| ORM / DB | **TypeORM + PostgreSQL** | Relational schema with real constraints; TypeORM's `@DeleteDateColumn` gives correct soft-delete (deleted rows auto-excluded everywhere). |
| Frontend | **Next.js** | Fast dashboard, deploys cleanly to Vercel. |
| Exposure | **ngrok static domain** | Stable public HTTPS to the locally/edge-hosted backend so Vapi's tool URL never changes between calls. |

## Quick start (local)

```bash
# 1. Backend + database
cd backend
cp .env.example .env          # then set VAPI_SECRET (any long random string)
docker compose up -d          # Postgres on host port 5434
npm install
npm run start:dev             # API on http://localhost:3000  (Swagger at /docs)

# 2. Expose it publicly for Vapi
ngrok http --domain=<your-static-domain> 3000

# 3. Wire Vapi  → see vapi/README.md
# 4. Dashboard (optional)
cd ../frontend && npm install && npm run dev   # http://localhost:3001 (set NEXT_PUBLIC_API_URL)
```

For the durable review setup (pm2 + nginx + ngrok on a server), see
[`DEPLOY.md`](./DEPLOY.md).

## API summary

Base: `/patients` — full detail in [`backend/README.md`](./backend/README.md).
All responses use the envelope `{ "data": ..., "error": null }` (and
`{ "data": null, "error": {...} }` on failure).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patients` | List; filters `?last_name=&date_of_birth=&phone_number=` |
| GET | `/patients/:id` | One patient by UUID |
| POST | `/patients` | Create (201) |
| PUT | `/patients/:id` | Partial update |
| DELETE | `/patients/:id` | **Soft** delete (sets `deleted_at`) |

Internal (secured with `x-vapi-secret`): `POST /vapi/webhook` handles Vapi
tool-calls and the end-of-call report.

## Observability

- The final persisted patient payload is logged to stdout on every create/update.
- Every tool call and its arguments are logged.
- Errors are logged with method, path, status, and stack via a global filter.

## Known limitations & trade-offs

- **`synchronize` in dev.** The backend uses TypeORM `synchronize` (config-driven,
  on for local dev) so the schema tracks the entities. A `data-source.ts` +
  migration workflow is included for production (`npm run migration:*`); flip
  `DB_SYNCHRONIZE=false` there.
- **No hard uniqueness on phone.** Duplicate detection is agent-driven (the
  agent offers to update); the DB doesn't forbid two records with the same
  phone, which keeps edge cases (shared household lines) flexible.
- **Partial calls aren't persisted.** A record is only written after the caller
  confirms, so a mid-call hangup leaves no patient row — but the transcript is
  still captured via the end-of-call report.
- **No automated tests.** Descoped for the time budget; the API was verified
  manually (create/list/get/validation/update/soft-delete/duplicate/persistence).
  Trade-off: tests would strengthen the "Edge Cases" and "Code Quality"
  dimensions, but the dashboard + transcript bonuses were prioritized instead.
- **Auth is a shared secret.** The `/vapi/*` endpoints check a static
  `x-vapi-secret` header. Vapi also supports HMAC/Bearer credentials for
  stronger verification.
