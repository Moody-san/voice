# Backend — Patient Registration API

NestJS + TypeORM + PostgreSQL. Owns all business logic: server-side validation,
persistence, the REST API, and the Vapi webhook.

## Setup

```bash
cp .env.example .env        # set VAPI_SECRET to any long random string
docker compose up -d        # Postgres 16 on host port 5434 (named volume)
npm install
npm run start:dev           # http://localhost:3000, Swagger UI at /docs
```

Requires Node 20+ (developed on Node 22 LTS).

## Environment variables

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `PORT` | no | 3000 | API port |
| `APP_ENV` | no | development | |
| `DB_HOST` | yes | | Postgres host |
| `DB_PORT` | no | 5432 | `docker-compose.yml` maps to 5434 |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | yes | | |
| `DB_SYNCHRONIZE` | no | false | `true` locally so schema tracks entities |
| `VAPI_SECRET` | yes | | shared secret Vapi sends as `x-vapi-secret` |
| `PUBLIC_URL` | no | | your ngrok domain (informational) |

Config is validated at boot with Joi (`src/configuration`) — the app refuses to
start if a required variable is missing.

## Response envelope

Success: `{ "data": <payload>, "error": null }`
Failure: `{ "data": null, "error": { "statusCode", "message", "details?" } }`

Implemented globally by `ResponseInterceptor` (success) and `AllExceptionsFilter`
(errors). The `/vapi/*` endpoints opt out via `@RawResponse()` because they must
return Vapi's `{ results: [...] }` shape.

Status codes: `200` ok, `201` created, `404` not found, `409` conflict,
`422` validation failed, `500` server error.

## Endpoints

### `GET /patients`
List active (non-soft-deleted) patients, newest first. Optional filters:
`?last_name=`, `?date_of_birth=` (MM/DD/YYYY or YYYY-MM-DD), `?phone_number=`.

### `GET /patients/:id`
One patient by UUID. `404` if missing or soft-deleted.

### `POST /patients`
Create. Validated + normalized (phone → 10 digits, state → upper, DOB → ISO).

```bash
curl -X POST http://localhost:3000/patients -H 'Content-Type: application/json' -d '{
  "first_name":"Jane","last_name":"O'\''Brien","date_of_birth":"03/15/1985",
  "sex":"Female","phone_number":"(415) 555-0132","address_line_1":"123 Main St",
  "city":"San Francisco","state":"CA","zip_code":"94103"}'
```

### `PUT /patients/:id`
Partial update; same validation on any provided field.

### `DELETE /patients/:id`
Soft delete — sets `deleted_at`, never removes the row. The record then
disappears from list, `GET /:id`, and duplicate lookup.

### `POST /vapi/webhook` (secured)
Requires header `x-vapi-secret: <VAPI_SECRET>`. Handles Vapi `tool-calls`
(`lookupPatientByPhone`, `savePatient`) and `end-of-call-report`. See
[`../vapi/`](../vapi/).

## Data model

**patients** — `patient_id` (UUID PK), the demographic fields with column-level
types/lengths, `preferred_language` default `English`, `created_at` / `updated_at`
(timestamptz), `deleted_at` (soft delete). `phone_number` is indexed for lookup.

**calls** — `id`, `vapi_call_id` (unique), `patient_id` (nullable soft link),
`transcript`, `summary`, `ended_reason`, `recording_url`, `created_at`.

## Validation rules (server-side, authoritative)

first/last name 1–50 chars (letters, space, hyphen, apostrophe) · DOB real date,
not future · sex ∈ {Male, Female, Other, Decline to Answer} · phone valid US
10-digit (NANP) · email format (optional) · state valid 2-letter US · ZIP 5 or
ZIP+4 · insurance member ID alphanumeric.

## Scripts

```bash
npm run start:dev          # watch mode
npm run build              # compile to dist/
npm run start:prod         # run compiled build
npm run seed               # insert 2 demo patients (idempotent)
npm run migration:generate # generate a migration from entities (prod path)
npm run migration:run
```

## Project structure

```
src/
  configuration/            Joi-validated env config
  database/
    entities/               patient.entity.ts, call.entity.ts
    database.module.ts       TypeORM wiring
    data-source.ts           migration CLI datasource
  common/
    constants/ enums/        US states, Sex
    utils/                   phone + DOB normalization
    validators/              IsUsPhone, IsValidDob
    interceptors/ filters/   { data, error } envelope
    guards/                  VapiSecretGuard
    decorators/              RawResponse
  modules/
    patients/                controller, service, DTOs
    vapi/                    webhook controller, dispatch service, types
```
