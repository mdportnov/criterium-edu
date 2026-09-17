# Criterium EDU — design system

A dense, calm, information-first admin interface. Reference points: Linear, the Stripe
dashboard, GitHub settings. This is a tool people work in all day, not a page they visit
once — every decision below trades expression for scanability.

---

## 1. The load-bearing rule about Tailwind v4

The theme is CSS-first. There is **no `tailwind.config.js` and you must not create one.**
Tokens are declared under `@layer base` in `src/index.css` and then **registered in
`@theme inline`**:

```css
@layer base { :root { --card: 0 0% 100%; } }

@theme inline {
  --color-card: hsl(var(--card));   /* without this line `bg-card` generates NOTHING */
}
```

A `--foo` that is not registered in `@theme` is invisible to the utility generator. This
is not a warning in the console and not a build error — the class simply produces no CSS
and the element renders unstyled. The entire semantic layer of this app was dead for this
reason, which is what made the old UI look garish: only the hardcoded `bg-blue-600` and
`text-green-900` classes actually painted. **If you add a token, register it.**

Dark mode is class-only:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

It deliberately does not follow `prefers-color-scheme` on its own — `ThemeProvider`
resolves "System" in JS and writes `light` / `dark` onto `<html>`, and `index.html` paints
that class before first render so the page cannot flash. A media-query-based variant
would override an explicit Light choice on a dark OS, which is the bug this replaced.

Animation utilities come from `tw-animate-css` (`animate-in`, `fade-in-0`, `zoom-in-95`,
`slide-in-from-*`). `tailwindcss-animate` is a v3 plugin and does nothing here.

---

## 2. Colour

### One accent

The single accent is the existing primary blue. It is allowed on exactly four things:

- focus rings (`--ring`)
- links and link-like text
- the active tab underline
- **the one most important action per screen** — the filled `<Button>` default variant

Nothing else is coloured for decoration. If a screen has two filled accent buttons, one of
them is wrong. Where an empty state echoes an action the page header already offers, the
echo is `variant="outline"`.

### Everything else is neutral

Numbers, labels, headings and body text are `foreground` or `muted-foreground`. **A KPI
number is not blue, green or purple.** Icons are monochrome `text-muted-foreground` at a
consistent `size-4` (`size-3.5` inside small controls). No coloured icon chips, no icon in
a tinted rounded square.

### Colour means status, and only status

Four tones, each a readable text colour plus the quietest tint that still separates from a
card — never a saturated fill:

| Tone | Means | Token pair |
|---|---|---|
| `success` | done, passed, approved | `--success` / `--success-soft` |
| `warning` | waiting on someone, partial | `--warning` / `--warning-soft` |
| `danger` | failed, rejected, destructive | `--danger` / `--danger-soft` |
| `info` | in flight, in review | `--info` / `--info-soft` |

Reach them through `<Badge variant="…">`, `<StatusBadge status={…} />` or
`<Alert variant="…">` — never by writing the classes inline. The mapping from a domain
status to a tone lives once, in `src/lib/status.ts`, so a status cannot be two colours on
two screens. `statusLabel()` owns the spelling for the same reason.

`--accent-strong` exists for one job: accent-coloured text sitting on an accent tint
(`bg-primary/10`). The raw accent does not clear 4.5:1 there at badge size.

### Never

Raw Tailwind palette classes — `text-blue-600`, `bg-green-100`, `bg-gray-50`, `bg-white`,
`text-black` — anywhere. Gradients, `bg-clip-text`. A score or a KPI coloured by how good
the value is.

---

## 3. Hierarchy, type and density

Hierarchy comes from **type scale, weight, spacing and hairline borders** — not colour and
not shadow.

| Role | Spec |
|---|---|
| Page title | `text-lg font-semibold tracking-tight` — via `<PageHeader>` |
| Card / section title | `text-[13px] font-semibold tracking-tight` — via `<CardTitle>` |
| Body, table cells, controls | `text-[13px]` |
| Meta, descriptions, hints | `text-xs` (12px) — never smaller |
| Column headers | `text-[11px] font-medium uppercase tracking-wide muted` |
| KPI number | `text-2xl font-semibold tabular-nums` — via `<Stat>` |

Density targets: header 48px, controls 32px (`h-8`), small controls 28px (`h-7`), table
rows 36px, card padding `p-4`, gap between sections `space-y-4`. Not `space-y-8`, not `p-6`
on a card body.

**Every number is `tabular-nums`** — figures must not reflow between renders. `<Td numeric>`,
`<Stat>` and `<StatInline>` already do it; `table`, `input[type=number]` and `<time>` get it
from `@layer base`.

### Shadows

Cards have a border and **no shadow, no hover lift, no `transition-all duration-300`, no
`hover:scale` / `active:scale`.** The page surface is a shade cooler than a card so the
border alone does the separating. Shadow is reserved for things that genuinely float:
popover, dropdown, select content, dialog, sheet.

### Width

Tables and lists use the full `max-w-[1400px]`. **Forms cap at `max-w-3xl`** (two-pane forms
at `max-w-5xl`) — a text input stretched to 1300px is unreadable and looks unfinished.

---

## 4. Anatomy

Every screen is built from the same few shapes. Do not invent a new one.

**Page** — always opens with `<PageHeader title description actions backTo>`. Never a
bespoke `<h1>`, never an icon beside the title, never a `container mx-auto p-6` wrapper
(the layout owns the gutter).

**List of records** — a `<Table>` inside a `<Card>`: filter rail in a
`border-b border-border p-3` strip on top, table in the middle, `<Pagination>` at the
bottom. Not a card grid. A card grid spends four screens of scroll on what a table shows in
one, and repeats the same truncated description in every tile.

**Detail** — `<PageHeader backTo>` then one or two `<Card>` sections. Actions live in the
header, not in a trailing "Actions" card.

**Form** — `<Card>` + `<CardContent className="space-y-4">` of `<Field>`s, submit in
`<CardFooter>` with the primary right and Cancel as `ghost` to its left.

**Card** — fixed anatomy so every section shares a rhythm:

```tsx
<Card>
  <CardHeader>
    <CardHeaderText><CardTitle/><CardDescription/></CardHeaderText>
    <CardAction>…</CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

A table or list goes *directly* inside `<Card>` with no `<CardContent>`, so rows reach the
card edge.

---

## 5. States

Every data surface renders all four, from `components/ui/states.tsx`.

- **Empty** — `<EmptyState title description action />`. One line saying what would live
  here and why it is empty, plus the action that puts something here. **Never a bare "0",
  never "No data available", never a big decorative illustration.** If there is genuinely
  no action (a cost report with no spend), the description still explains what would appear.
- **Loading** — `<TableSkeleton>` shaped like the table that is coming, so the page does
  not jump. `<LoadingState>` elsewhere. Never a spinner centred in an `h-64` box.
- **Error** — `<ErrorState title message onRetry>`. The retry re-runs the fetch it belongs
  to; `window.location.reload()` is not an error recovery.
- **Default** — the happy path.

Error text comes from `getErrorMessage(err, fallback)` in `src/lib/errors.ts`. Do not write
`catch (err: any)` and reach into `err.response.data.message` — that crashes on any error
without a response, which includes every network failure.

---

## 6. Responsive and accessible

- Works at 320–390px: no horizontal page scroll. Tables go in `<TableWrap>`; secondary
  columns drop with `hidden sm:table-cell` / `hidden md:table-cell` rather than shrinking.
- Mobile-only navigation targets are ≥44px. Inside dense tables, row links are text-sized —
  a deliberate trade, because 44px rows would destroy the density that is the point.
- Both themes must clear **WCAG AA** (4.5:1 body, 3:1 large). Verified across every screen
  in both themes; if you add a colour, re-check it composited over its real background.
- Icons that are decorative carry `aria-hidden`; icon-only buttons carry an `sr-only` label.
- `prefers-reduced-motion` is honoured globally in `@layer base`.

---

## 7. Where things live

```
src/index.css                  tokens, @theme registration, the 3 surviving CSS helpers
src/lib/status.ts              domain status -> tone + label (single source of truth)
src/lib/errors.ts              getErrorMessage
src/components/Logo.tsx        the mark and the wordmark lockup
src/components/ui/             the primitives below — fix these, not the pages
```

`button · card · badge (+ StatusBadge) · input · textarea · label (+ Field) · select ·
tabs · alert · dialog · sheet · dropdown-menu · tooltip · separator · pagination ·
table · page-header · states · stat`

Surviving bespoke CSS, and nothing else: `.container-responsive` (layout gutter only),
`.prose-body` (long user-authored text), `.code-block`, `.line-clamp-2/3`. Everything in
the old `@layer components` block — `.nav-*`, `.mobile-nav-*`, `.dashboard-card*`,
`.status-badge`, `.btn-primary`, `.form-input`, `.card-hover`, `.loading-spinner`,
`.gradient-text` — is deleted. Nothing left in CSS hardcodes a colour a token should own.

**Fix the primitive, not the page.** If a page needs something the system does not have,
add it to `components/ui/` so the change propagates.
