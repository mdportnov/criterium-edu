# Consuming Academy from Criterium

Status: design note, nothing built yet. Written after the foundation work of
September 2026 so the decisions are recorded while the reasons are fresh.

## The shape of it

Criterium pulls from Academy over HTTP. It does not read Academy's database,
and Academy does not call into Criterium.

```
Academy  ──(its own REST API, bearer token)──>  Criterium
 owns: courses, cohorts, lessons, tasks,        owns: criteria, LLM
 people, enrolments, homework replies                assessments, reviews
```

Criterium keeps its own identity and its own accounts. It is not an Academy
front end, and a person may exist in Criterium who is not in Academy.

## What Academy already offers

Academy's API is at `/api/v1/...` on its own host, behind `Authorization:
Bearer acmcp_<token>` — a personal API token that is hashed at rest, scoped,
and can be given an expiry. Scopes are fine-grained; the ones a pull would
need are all reads:

| Scope             | What it buys                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `course:read`     | the course catalogue                                                   |
| `enrollment:read` | cohorts and their schedule                                             |
| `member:read`     | who is in a given cohort                                               |
| `user:read`       | the account directory, if names and emails are needed outside a cohort |
| `task:read`       | a lesson's homework, and the replies students sent                     |
| `progress:read`   | per-student progress                                                   |

Nothing above needs a write scope. That is the point: **Criterium's token
should hold read scopes only.** A token that can also write is a token that
can delete a course by accident.

## Where it plugs in

One module, `apps/api/src/modules/academy/`, and nothing outside it knows
Academy exists:

- `AcademyClient` — a thin HTTP client. Base URL and token from the
  environment (`ACADEMY_API_URL`, `ACADEMY_API_TOKEN`), validated at boot like
  every other setting. Timeout, a small retry budget on 429/5xx mirroring the
  OpenAI client, and no retry on a 4xx.
- `AcademyImportService` — translates Academy's shapes into Criterium's. This
  is the only place that knows both vocabularies.
- Everything else takes Criterium types.

That boundary is what makes the integration reversible. If Academy's API
changes, or the two products are merged into one deployment later, exactly one
directory moves.

## Identity

Criterium keeps its own users (decided September 2026). An imported Academy
student becomes a Criterium account with:

- `externalSource = 'academy'` and `externalId = <academy user id>`, unique
  together, so a second import updates rather than duplicates;
- no usable password. They get in through the one-time link an administrator
  issues (`POST /api/v1/admin/users/:id/password-reset-link`), which is
  already built.

A shared login is a separate, larger decision. It is not needed to pull data.

## What to decide before building

1. **Pull or push.** A scheduled pull is simpler and needs nothing from
   Academy. If Criterium has to react to a submission within seconds, Academy
   would need to call a webhook, which means Academy holding a Criterium
   credential — the opposite direction from everything above. Start with a
   pull.
2. **How much is copied.** Copying a homework reply into Criterium makes
   assessment self-contained and makes Criterium the second home of student
   work, with the retention question that implies. Referencing it by id keeps
   Criterium thin but makes it useless when Academy is down.
3. **Reconciliation.** What happens when a task is edited in Academy after
   Criterium has assessed solutions against it. Whatever the answer, the
   imported copy needs the source id and the time it was pulled.
4. **Rate limits.** Academy publishes `X-RateLimit-*` and `Retry-After`; the
   client should honour them rather than discover them.

## What is already in place for this

The foundation work landed the parts an integration would otherwise have had
to add first:

- the API has a declared contract — `/api/v1`, URI versioning, one error shape
- configuration is validated at boot and fails closed, so a missing
  `ACADEMY_API_TOKEN` would abort rather than 500 at the first call
- provider credentials are encrypted at rest, so an Academy token stored in
  settings gets the same treatment as the OpenAI key
- the OpenAI client is the working example of the retry and cost-tracking
  shape an outbound client should copy
