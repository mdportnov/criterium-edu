# Deploying Criterium

Where this runs is not decided. So this describes what the application needs
from any host, and keeps the host-specific part to the end.

## What ships

Two images, built from this repository and pushed to GHCR:

| Image                | Contains                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| `criterium-backend`  | the NestJS API. Runs as a non-root user, has a `HEALTHCHECK`, carries no secrets |
| `criterium-frontend` | nginx serving the built SPA, and proxying `/api` to the backend                  |

Both are stamped with OCI labels, so `docker image inspect` tells you which
commit produced a running container.

Plus PostgreSQL 16, which this repository does not build.

## What the backend needs

**Environment.** Every variable is validated at boot and the process exits if
one is missing or malformed — a misconfigured deployment fails visibly instead
of running wrong. `.env.example` is the full list; these have no safe default:

| Variable                                                  | Why it cannot default                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` | no sensible guess                                                        |
| `JWT_SECRET`                                              | ≥32 chars, unique per environment. Changing it signs every session out   |
| `SETTINGS_ENCRYPTION_KEY`                                 | 64 hex chars. **Changing it makes every stored provider key unreadable** |
| `APP_BASE_URL`                                            | where the browser reaches the app; one-time links are built from it      |
| `CORS_ORIGINS`                                            | required in production, unused when the app and API share an origin      |

And the ones a host usually has an opinion about:

| Variable           | Default           | When to change it                                                                                                                                                                                                        |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TRUST_PROXY_HOPS` | `0`               | **Set it to the number of proxies in front of the API.** Rate limiting and the audit log read the client address through it: too low and every client shares one bucket, too high and a client can forge its own address |
| `DB_POOL_SIZE`     | `10`              | replicas × pool size must stay under the server's `max_connections`                                                                                                                                                      |
| `BODY_LIMIT`       | `10mb`            | bulk imports post large JSON                                                                                                                                                                                             |
| `SWAGGER_ENABLED`  | off in production |                                                                                                                                                                                                                          |
| `LOG_LEVEL`        | `info`            |                                                                                                                                                                                                                          |

The language model provider, its key and its model are **not** environment
variables. They are administrator settings, encrypted at rest — see the
README.

**Storage.** One volume, for PostgreSQL. The API itself is stateless: it
writes nothing to disk, so it can be replaced, scaled or moved freely.

**Ports.** The backend listens on `BACKEND_PORT` (3000). It does not need to
be reachable from outside; the frontend proxies `/api` to it.

**Health.** `GET /health` is liveness — the process is up, no database access,
safe to poll often. `GET /health/ready` is readiness — it runs `SELECT 1`.
Both sit outside the `/api/v1` prefix and outside versioning, so an
orchestrator never has to track the API version. Use readiness to gate traffic
and liveness to decide on a restart; wiring a restart to readiness will
restart-loop the whole fleet during a database blip.

**Migrations** run at container start, under a Postgres advisory lock, so two
containers starting together do not race. A failed migration aborts the start
rather than serving against a schema that is not there.

## Constraints worth knowing before choosing a host

- **Rolling deploys are safe; blue/green needs thought.** Migrations run
  before the new container serves, so during a rollout the old code briefly
  runs against the new schema. Additive migrations are fine. A destructive one
  — dropping or renaming a column still read by the previous release — needs
  two deploys: ship the code that stops using it, then the migration.
- **Sessions are stateless JWTs in cookies**, so any replica can serve any
  request and no sticky sessions or shared session store are needed.
- **Rate limiting is in-process.** With N replicas the effective limit is N
  times the configured one. If that matters, the throttler needs a shared
  store, which is the one thing that would add Redis to this stack.
- **Long-running LLM assessments are in-process too**, started by a request
  and continuing after the response. A container killed mid-run leaves the
  operation marked in progress. A real job queue is the fix; until then, drain
  before stopping a container.
- **`SETTINGS_ENCRYPTION_KEY` is not rotatable in place.** Rotating it means
  re-entering the provider key afterwards.

## Backups

Nothing here backs up the database. Whatever the host, `pg_dump` of the
`criterium` database on a schedule, kept somewhere that is not the same disk,
and — the part that gets skipped — a restore actually tried once. The
encryption key must be backed up separately from the dump, or the provider
credentials in it are unreadable.

## Today's deployment

`.github/workflows/` builds both images, pushes them to GHCR and restarts the
stack over SSH with `docker compose`, on a single host. The runtime `.env`
lives on that server at `/var/www/criterium/.env` and is never shipped from
this repository; the deploy fails if it is missing.

`docker-compose.yml` is the stack: PostgreSQL, the backend on the internal
network only, and the frontend publishing `WEB_PORT`. It is what CI deploys,
and it is also the quickest way to run the whole thing anywhere Docker runs.

**TLS is not handled here.** The frontend serves plain HTTP on port 80 and
expects something in front to terminate TLS. That something is the proxy
`TRUST_PROXY_HOPS` has to account for.

### If it moves somewhere else

What changes is the last step of the workflows and nothing else — the images,
the environment contract, the health endpoints and the migration behaviour are
the same everywhere.

- **Kubernetes**: the env goes in a Secret and a ConfigMap; `/health` and
  `/health/ready` map onto the liveness and readiness probes; run migrations
  in an init container (the advisory lock makes that safe with multiple
  replicas); `TRUST_PROXY_HOPS` counts the ingress.
- **A PaaS** (Fly, Render, Railway): one service per image, managed
  PostgreSQL, env in the platform's secret store, health check on `/health`.
  `TRUST_PROXY_HOPS=1` for the platform's router, and the frontend must be
  able to reach the backend by an internal hostname for its `/api` proxy.
- **Anywhere with a managed database**: `DB_POOL_SIZE` matters more, since
  managed instances cap connections tightly. Multiply by the replica count
  before setting it.
