# Frontend — Patient Registry Dashboard

A read-only Next.js dashboard that lists the patients registered by the voice
agent, served from the backend REST API. Styled with the **Modernist** design
system (monochrome ink on warm off-white, hairline rules, Archivo + JetBrains
Mono) ported from the cover repo's `.ff-app` palette.

## Features

- Live patient list from `GET /patients` (soft-deleted patients excluded by the API)
- Debounced filters: last name, date of birth, phone number
- Row → slide-over with the full demographic record
- Loading / empty / error states

## Setup

```bash
cp .env.example .env.local        # set NEXT_PUBLIC_API_URL
npm install
npm run dev                       # http://localhost:3001
```

## Environment

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL. Local: `http://localhost:3000`. Production (Vercel): your public backend URL (the ngrok domain). |

## Deploy (Vercel)

Import the `frontend/` directory as the project root and set
`NEXT_PUBLIC_API_URL` to your public backend URL. `npm run build` is the build
command; no other configuration is required.

## Design system

Tokens live in `app/globals.css` (`--ff-*`) and are surfaced to Tailwind in
`tailwind.config.ts` (`bg`, `ink`, `soft`, `line`, `rule`, …). The look is
deliberately monochrome; status color is reserved for badges.
