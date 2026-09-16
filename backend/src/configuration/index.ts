import * as Joi from 'joi';

/**
 * Environment validation schema. The app refuses to boot if required
 * variables are missing/invalid, so misconfiguration fails fast and loudly
 * rather than at the first DB query or Vapi webhook.
 */
export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  APP_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Postgres
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  // synchronize is convenient for local dev; keep it off in production and
  // use migrations (see src/database/data-source.ts).
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  // Shared secret Vapi must send (as the `x-vapi-secret` header) on every
  // tool call / webhook so the public /vapi/* endpoints can't be spoofed.
  VAPI_SECRET: Joi.string().required(),

  // Public URL the backend is reachable at (ngrok domain). Informational —
  // used in logs and the README, not required for the server to run.
  PUBLIC_URL: Joi.string().uri().optional().allow(''),
});

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  appEnv: process.env.APP_ENV || 'development',
  publicUrl: process.env.PUBLIC_URL || '',
  vapiSecret: process.env.VAPI_SECRET,
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'false').toLowerCase() === 'true',
  },
});
