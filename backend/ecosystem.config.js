/**
 * PM2 process config for the backend API.
 *
 * On the remote server:
 *   npm ci && npm run build
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup   # survive reboots
 *
 * Env comes from backend/.env (loaded automatically by @nestjs/config), so no
 * secrets live in this file. Ensure Postgres is reachable per .env (e.g.
 * `docker compose up -d` on the remote, or an existing Postgres).
 */
module.exports = {
  apps: [
    {
      name: 'voice-patient-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
