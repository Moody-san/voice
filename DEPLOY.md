# Deployment (remote server)

Target setup: **pm2** runs the backend, **nginx** reverse-proxies it, and
**ngrok** exposes it on the static domain that Vapi points at.

```
Vapi ──▶ ngrok (static domain) ──▶ nginx :80 ──▶ pm2 / Node :3000 ──▶ Postgres
```

## 1. Database

Bring up Postgres on the remote (Docker is simplest and matches local):

```bash
cd backend
docker compose up -d          # Postgres on host port 5434, persistent volume
```

Or point `backend/.env` `DB_*` at an existing Postgres.

## 2. Backend with pm2

```bash
cd backend
cp .env.example .env          # set VAPI_SECRET, PUBLIC_URL, DB_* for the server
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup        # auto-start on reboot
```

`@nestjs/config` reads `backend/.env` automatically — no secrets in pm2 config.
Verify: `curl http://localhost:3000/health`.

## 3. nginx reverse proxy

Proxy a server block to the API (adjust as needed):

```nginx
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

`sudo nginx -t && sudo systemctl reload nginx`.

## 4. ngrok on the static domain

Run ngrok on the remote, pointing at nginx (port 80) or directly at the API
(3000):

```bash
ngrok http --url=ivonne-noninterchangeable-vagariously.ngrok-free.dev 80
```

> **One agent per domain.** The free static domain can only be bound by one
> ngrok agent at a time. Stop any local ngrok before starting it on the remote.
> Consider running ngrok under systemd or pm2 so it survives reboots too.

Verify publicly: `curl https://ivonne-noninterchangeable-vagariously.ngrok-free.dev/health`.

## 5. Point Vapi + Vercel at it

- Vapi tool/assistant server URL is already the static domain → no change needed.
- Set the Vercel frontend's `NEXT_PUBLIC_API_URL` to the same domain.

## Notes

- CORS is open (`app.enableCors()`), so the Vercel dashboard can call the API.
- For production you'd flip `DB_SYNCHRONIZE=false` and run
  `npm run migration:generate && npm run migration:run` instead of relying on
  schema sync.
