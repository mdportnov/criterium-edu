# Criterium EDU

An educational platform for submitting solutions to tasks and grading them
against explicit criteria, manually or with an LLM.

## Layout

Nx monorepo:

- `apps/api` — NestJS + TypeORM + PostgreSQL backend
- `apps/web` — React + Vite + Tailwind + shadcn/Radix frontend
- `libs/shared` — Zod schemas and TypeScript types shared by both
- `apps/nginx` — nginx config used by the frontend image

## Features

- JWT authentication with admin / reviewer / student roles
- Tasks with weighted grading criteria
- Solution submission, manual review, and LLM-assisted assessment
- Bulk import of tasks and solutions
- Admin panel: users, settings, prompts, audit log, API cost tracking

## Requirements

- Node.js 22
- npm 10
- Docker (for PostgreSQL, or for the whole stack)

## Configuration

All configuration is environment variables. Nothing is committed: copy the
template and fill it in.

```bash
cp .env.example .env
# JWT_SECRET and SETTINGS_ENCRYPTION_KEY each need their own value
openssl rand -hex 32
```

The API validates its environment at boot and refuses to start on anything
missing, malformed, or left at a known default value. That is deliberate — a
misconfigured deployment should fail visibly rather than quietly sign tokens
with an empty secret.

| Variable                                                  | Required          | Notes                                                               |
| --------------------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `NODE_ENV`                                                | no                | `development` (default), `production`, `test`                       |
| `BACKEND_PORT`                                            | no                | default `3000`                                                      |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` | yes               |                                                                     |
| `DB_LOGGING`                                              | no                | logs every SQL statement; default `false`                           |
| `JWT_SECRET`                                              | yes               | ≥ 32 characters                                                     |
| `JWT_EXPIRATION_TIME`                                     | no                | `ms` duration, default `1d`                                         |
| `BCRYPT_ROUNDS`                                           | no                | 10–15, default `12`                                                 |
| `APP_BASE_URL`                                            | yes               | where the browser reaches the app; one-time links are built from it |
| `CORS_ORIGINS`                                            | yes in production | comma-separated origins; unused when app and API share an origin    |
| `SWAGGER_ENABLED`                                         | no                | defaults to off in production                                       |
| `LOG_LEVEL`                                               | no                | default `info`                                                      |
| `VITE_API_URL`                                            | build time        | baked into the frontend bundle                                      |

## Local development

```bash
npm ci
docker compose -f docker-compose.local.yml up -d   # PostgreSQL on :5432
npm run typeorm:migrate                            # apply migrations
npm run api:serve                                  # http://localhost:3000
npm run web:serve                                  # http://localhost:5173
```

## The whole stack in Docker

```bash
cp .env.example .env    # fill in the required values listed above
docker compose up --build -d
```

The backend container waits for PostgreSQL, applies migrations, then starts.
`docker compose ps` reports it healthy once `/health` answers.

## Scripts

| Command                    | What it does                             |
| -------------------------- | ---------------------------------------- |
| `npm run verify`           | lint, test and build — what CI runs      |
| `npm run lint:all`         | ESLint across all three projects         |
| `npm test`                 | Vitest across all three projects         |
| `npm run build:all`        | production build of all three projects   |
| `npm run typecheck`        | `tsc -b` over the project references     |
| `npm run typeorm:migrate`  | build and run pending migrations         |
| `npm run typeorm:generate` | generate a migration from entity changes |
| `npm run typeorm:revert`   | roll the last migration back             |

Migrations are the only way the schema changes; `synchronize` is off in every
environment.

## Language model

Assessment and review call a language model through one service. It is not
tied to OpenAI: OpenAI, DeepSeek and OpenRouter all speak the same
chat-completions protocol, so the provider is a setting rather than a
dependency. Adding another OpenAI-compatible endpoint is an entry in
`apps/api/src/modules/llm/providers.ts`.

Configured in the admin settings screen, not in the environment, because it
changes at run time and the key belongs with the other encrypted secrets:

| Setting        | Meaning                                                    |
| -------------- | ---------------------------------------------------------- |
| `llm_provider` | `openai`, `deepseek`, `openrouter` or `custom`             |
| `llm_api_key`  | the provider key; encrypted at rest, masked on read        |
| `llm_model`    | default model; blank uses the provider's default           |
| `llm_base_url` | overrides the provider default, required for `custom`      |
| `llm_pricing`  | optional per-model prices, USD per million tokens, as JSON |

Every call is recorded against the cost ledger with its provider, model and
token counts. Prices for OpenAI and DeepSeek ship with the application;
OpenRouter fronts hundreds of models at prices that move, so its costs need
`llm_pricing`. **A model with no known price records its tokens at zero cost
and logs a warning** — the alternative, inventing a rate, puts made-up numbers
in the report that read exactly like real ones.

## Sessions and passwords

Signing in sets an httpOnly `criterium_session` cookie; the token is never in
a response body and never in `localStorage`. A second, readable
`criterium_csrf` cookie is echoed back in an `X-CSRF-Token` header on every
write — a double-submit check, because a cookie is authority the browser
attaches on its own. Requests authenticated by an `Authorization: Bearer`
header are not subject to it.

Bulk import creates accounts with a random password nobody holds. To make one
usable, an administrator issues a one-time link:

```
POST /api/v1/admin/users/:id/password-reset-link  ->  { url, expiresAt }
```

The link is valid for 24 hours, works once, and issuing a new one retires the
previous one. Only its SHA-256 is stored. The holder sets a password at
`POST /api/v1/auth/set-password`.

There is no self-service "email me a reset link" flow, because this
application has no mail transport configured. Adding one is a matter of an
SMTP client plus this same token service.

## Health

| Endpoint            | Meaning                                          |
| ------------------- | ------------------------------------------------ |
| `GET /health`       | liveness — the process is up, no database access |
| `GET /health/ready` | readiness — the database answers `SELECT 1`      |

## API documentation

Swagger UI is at `/api/docs` when `SWAGGER_ENABLED=true`. It is off by default
in production.

## Deployment

`.github/workflows/ci.yml` runs lint, tests, build and a production-dependency
audit on every pull request and push to `master`. The two deploy workflows call
it and will not deploy unless it passes; they then build images, push them to
GHCR, and restart the stack over SSH.

Images carry no secrets. The server keeps its own `/var/www/criterium/.env`,
and a deploy aborts if that file is missing.

## Documentation

| File                          | What it is                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `docs/PRD.md`                 | what the product is meant to do                                                  |
| `docs/AUDIT-2026-09.md`       | the September 2026 technical audit: what was wrong, what was fixed, what remains |
| `docs/ACADEMY-INTEGRATION.md` | design note for pulling data from Academy                                        |
| `apps/web/DESIGN.md`          | the frontend design rules                                                        |

## Licence

MIT
