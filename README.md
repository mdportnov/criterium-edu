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
# JWT_SECRET must be at least 32 characters and unique per environment
openssl rand -hex 32
```

The API validates its environment at boot and refuses to start on anything
missing, malformed, or left at a known default value. That is deliberate — a
misconfigured deployment should fail visibly rather than quietly sign tokens
with an empty secret.

| Variable                                                  | Required          | Notes                                         |
| --------------------------------------------------------- | ----------------- | --------------------------------------------- |
| `NODE_ENV`                                                | no                | `development` (default), `production`, `test` |
| `BACKEND_PORT`                                            | no                | default `3000`                                |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` | yes               |                                               |
| `DB_LOGGING`                                              | no                | logs every SQL statement; default `false`     |
| `JWT_SECRET`                                              | yes               | ≥ 32 characters                               |
| `JWT_EXPIRATION_TIME`                                     | no                | `ms` duration, default `1d`                   |
| `BCRYPT_ROUNDS`                                           | no                | 10–15, default `12`                           |
| `CORS_ORIGINS`                                            | yes in production | comma-separated origins                       |
| `SWAGGER_ENABLED`                                         | no                | defaults to off in production                 |
| `LOG_LEVEL`                                               | no                | default `info`                                |
| `VITE_API_URL`                                            | build time        | baked into the frontend bundle                |

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
cp .env.example .env    # fill in DB_PASSWORD, JWT_SECRET, CORS_ORIGINS
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

## Licence

MIT
