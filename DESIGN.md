# DESIGN.md

Documented from this app's own code: `src/app/globals.css` (ported verbatim
from `gf-app-dashboard` on `development`), `tailwind.config.ts`, and the
components under `src/components/`. The reference implementation for
anything not covered here is `gf-app-dashboard` itself.

## Theme

**Light, single theme.** The scene: an Almas director at a laptop in a
bright, glass-walled Colombo office at 9:15am, ten minutes before the CSE
opens, sunlight across the screen, with a dealer reading over the shoulder.
That forces paper, not a terminal. `darkMode: "class"` exists in the
Tailwind config but nothing sets the class and there is no theme store; do
not build dark-only chrome.

## Color

Tokens are HSL triplets consumed as `hsl(var(--token))`. Defined in
`globals.css` `@layer base :root`, mapped to Tailwind in
`tailwind.config.ts`. **Always use the token, never a raw hex or hsl().**

### Paper and ink

| Token | Value | Use |
|---|---|---|
| `--background` | `0 0% 98%` | app background |
| `--card` | `0 0% 100%` | every tile, card, popover |
| `--foreground` | `0 0% 4%` | body ink, and `--primary` |
| `--muted-foreground` | `220 7% 57%` | captions, axis ticks, source lines |
| `--muted` | `225 11% 95%` | inset pills, tracks |
| `--border` | `220 13% 91%` | every hairline |
| `--radius` | `0.75rem` | base radius token |

`--primary` is near-black (`0 0% 4%`), not a brand hue. The platform is
tenant-neutral and the client's own mark is deliberately not spent on
chrome. Treat primary as ink: it carries emphasis, focus rings and the
outlined action button, never large fills.

### Strategy

**Restrained.** Tinted neutrals plus ink, with colour reserved for meaning:

- `--success 158 94% 24%` — up, gain, net buying, a settled dashboard.
- `--danger 0 73% 41%` — down, loss, net selling.
- `--warning 27 89% 37%` — flagged, concentrated, above threshold.

Colour is never decorative on this surface. A tile that is not saying
"up", "down" or "flagged" is drawn in `--chart-6` (`217 91% 60%`) or plain
ink.

### Chart inks

`src/components/dash/chart-frame.tsx` names four and only four:

```
INK_PRIMARY   hsl(var(--chart-6))   default series
INK_SECONDARY hsl(var(--chart-4))   second series
INK_UP        hsl(var(--success))
INK_DOWN      hsl(var(--danger))
```

The full `CHART_COLORS[10]` rotation exists in
`src/components/charts/chart-theme.ts` for parity with the product, but
this demo has a fixed, known set of figures: name the ink you mean rather
than rotating a palette. Grid is `hsl(var(--border))` at `3 3` dash, axis
ticks are `axisTick(size)` (muted, weight 600).

### Categorical inks

`--cat-1` … `--cat-6` (blue, violet, teal, amber, slate navy, rose), read
through `categoryInk(i)` in `chart-frame.tsx`. Added for this demo; they
are not in the ported product stylesheet.

Use them wherever hue is the category label and nothing more: donut
segments, scatter groups. **Never** use `CHART_COLORS` for that. Its
third, fourth and fifth entries are success green, warning orange and
danger red, so one sector in a six-way legend lands on danger and reads
as the sector in trouble on a surface where red genuinely means "down".

The exception is a figure whose parts really are up, down and neither:
market breadth carries a `tone` per row and takes the signal inks
instead. Colour still follows meaning; these six exist for where there
is no meaning to follow.

## Typography

One face: the Apple system sans, via `--font-sans`. `--font-serif` is
aliased to `--font-sans` on purpose, so `font-serif` in markup means "the
display voice", not a different family. Mono (`--font-mono`) is for
tickers, account numbers and generated SQL only.

Body is 15px / 1.55. Inside `.dashboard-theme`,
`font-feature-settings: "tnum" 1` gives tabular figures, so columns of
numbers align across tiles.

Scale in use, and the ratios that matter:

| Role | Size / weight | Where |
|---|---|---|
| KPI value | 40px, medium, `-0.03em`, tabular | `KpiTile` |
| Card title (landing) | 19px, semibold, `-0.01em` | dashboard cards |
| Page title | 15px, semibold, `-0.012em` | `.page-header h1` |
| Tile title | 15px, 700, `-0.018em` | forced by `globals.css` |
| Caption / description | 12–12.5px, muted | tile header `p` |
| Eyebrow / section label | 10–11px, 600, uppercase, `0.08–0.12em` | KPI labels, "SYSTEM" |
| Source line | 10px, 600, uppercase, `0.08em`, muted/60 | tile footer |

**Never combine `uppercase` with negative tracking.** Uppercase runs need
positive tracking (`0.08em` and up). `globals.css` forces `-0.018em` on
`.dashboard-theme article h3.font-semibold`, so a tile title must not be
uppercase; set the tracked uppercase treatment on a separate eyebrow
element instead.

## Structure

### The workspace frame

`DemoShell`: full-width 64px `Topbar`, then `DemoBand`, then a row of
`AppSidebar` plus the content column. Content is `h-screen`,
`overflow-hidden`, and every pane owns its own scroll
(`min-h-0 flex-1 overflow-auto`). Never let the body scroll.

### `.page-header`

The 64px frosted bar every workspace page opens with: back affordance (when
nested), `.page-header-icon` tinted glyph, title over a one-line
description, page controls pushed right. Defined in `globals.css`; use the
class, do not re-implement it.

### `.dashboard-theme`

Wraps both dashboard levels and carries chrome overrides that win on
specificity over Tailwind utilities. Consequences to design around:

- `article.rounded-2xl` is forced to `border-radius: 20px`, a full 1px
  `--border`, `position: static`, and a two-layer shadow
  (`0 1px 1px /0.03`, `0 4px 12px -6px /0.10`), lifting on hover to
  `border-color: primary/0.25`. **Any `::before` / `::after` on that
  article is killed** (`content: none !important`) — lit top edges and
  gradient hairlines drawn that way will not render.
- Because `position` is forced static, an `<article>` inside
  `.dashboard-theme` cannot host absolutely-positioned children. Put the
  positioning context on an inner wrapper.
- Page and section backgrounds stay white (`--dashboard-canvas` is
  `hsl(var(--card))`); separation comes from the hairline plus shadow, not
  a tint.

### Grid

Detail dashboards use a 4-column grid, `gap-4`, `auto-rows-min`, inside
`mx-auto w-full max-w-[1500px] px-6 py-6`. Panels declare `span: 1 | 2 | 4`.
The landing grid is `1 / md:2 / xl:3`, `gap-5`.

### Sections

A dashboard arrives grouped. `Dashboard.sections(desk, filters)` is the
single source; `panels()` is derived from it (`defineDashboard`), never
maintained alongside. Each section states the question its tiles answer.

`DashboardSection` draws the group with a header on a rule, not as a box:
a collapse chevron, a mono ordinal (`01`), the title, a one-line subtitle
and a widget count, then the grid. The real product uses a bordered,
tinted box with the tiles inside, which on this white-on-white theme is a
card holding cards for no separation gained. The hairline header is the
same grouping without the nesting.

Sections open by default. A demo that opens folded shows nothing.

### Figure sizing

`ChartFrame(height)` treats its height as a **floor**, with `1.6 ×` as the
ceiling, and centres whatever slack is left. Tiles in a grid row stretch
to the tallest of them: at a fixed height the shorter figures leave the
difference as dead white space above their source line, and with
unbounded growth five bars spread over four hundred pixels with more gap
than bar. Both failure modes are real; both are bounded here.

For this to resolve, a figure's tile must be a flex column
(`VizBlock` body is `flex min-w-0 flex-1 flex-col`).

### Tables

`DataTable` scrolls inside itself past 10 rows (`max-h-[26rem]`, sticky
header, focusable region with an `aria-label`). Nineteen counters at
roughly 34px a row is six hundred pixels of one widget, which pushes
everything under it out of reach. A long table is also always the LAST
panel in its section and spans the full four columns: the ranked figures
above it are each one of its columns, so it belongs under them as the
place to check a number, not beside them competing for the same glance.

### Value labels on bars

Drawn to the right of the bar's rightmost edge, always. Recharts hands a
negative bar a **signed width**, so `x + w` is its far-left edge, not its
right one: take `Math.max(x, x + w)`, which is the bar's tip when
positive and the zero line when negative. A negative label placed to the
LEFT of its bar will collide with the category names whenever the bar is
short, however much axis is reserved below zero.

## Elevation

Two layers, never more. Cards: `0 1px 1px /0.03` plus
`0 4px 12px -6px /0.10`. Hover: `0 1px 2px /0.05` plus
`0 10px 24px -10px /0.14`. The negative spread is deliberate so the shadow
tucks under the card instead of haloing the rounded corners.

## Motion

Card and tile transitions run 200–300ms on
`cubic-bezier(0.4, 0, 0.2, 1)`; the Tailwind config also exposes
`spring` (`0.22, 1, 0.36, 1`) and `spring-heavy` (`0.16, 1, 0.3, 1`),
which are the ease-out-expo curves to prefer for entrances. Hover on a
landing card lifts it half a pixel and nudges its arrow 2px. Never animate
layout properties; never bounce.

`.fleet-ask-glow` is reserved for "ask the agent" entry points only.

## Accessibility

- Every Recharts figure is accompanied by an off-screen `SrTable` of the
  same numbers (`chart-frame.tsx`). Recharts measures 0x0 under jsdom, so
  this table is also what the component tests read. **A new viz kind must
  ship its `SrTable`.**
- Real `<label>` plus `<select>` for filters, never a div pretending.
- `aria-label` on a card's action button carries the dashboard title, so
  the accessible name does not depend on how the description wraps.
- Locked and redacted states are announced in words, not by a grey box.

## Testing conventions

Dashboard cards render `data-testid={'dash-card-' + id}`; detail panels
render `data-testid={'panel-' + id}`. Keep both when restructuring, and
add ids rather than renaming existing ones.

## Bans specific to this app

- No em dashes in UI copy. Commas, colons, semicolons, parentheses.
- No dead controls: a filter renders only where it genuinely changes what
  is drawn (`Dashboard.usesFilters`).
- No uppercase tile titles (see Typography).
- No side-stripe borders, gradient text, or glassmorphism beyond the one
  `.page-header` / `.ai-topbar` treatment already in the design system.
- No number without a source line and an illustrative-values caption.
- No `CHART_COLORS` for a categorical legend (see Categorical inks).
- No grouped-bar figure with a visible shared axis unless the two series
  share a unit (`PairedBarsViz.sharedAxis`).
