# PRODUCT.md

## Register

**product** — this is a running Next.js application, not a document. Almas
Equities staff click through it: a sidebar, a chat surface, a dashboards
surface, a desk switcher. The design serves the work rather than being the
work. (The parent folder's PRODUCT.md covers the HTML *brief* deliverables
and is a **brand** register; that file governs `Almas Equities - Executive
Summary.html`, not this app.)

## What this is

A demonstration environment for **Graffs**, the industry-native agentic
intelligence platform built by Kainovation Technologies (Pvt) Ltd, dressed
for one prospective client: **Almas Equities**, a Colombo Stock Exchange
broking house.

Two surfaces sit inside the platform's real workspace chrome, ported from
`gf-app-dashboard`:

- **Chat**, where a question in plain language is planned, queried and
  answered with a figure and a visible agent trail.
- **Dashboards**, a library of pre-built dashboards plus dashboards built
  on demand from a described request.

**Desk scoping** (Management, Dealing, Research) is the thing a BI stack
cannot do: the same dashboard narrows, redacts or locks depending on who
is looking. It is fully live in the data layer (`lib/desks.ts` holds the
access matrix; every panel derives from it), and every surface must keep
those states legible and honestly labelled.

Note the header's desk switcher was deliberately removed, so there is
currently **no UI path** to a desk other than Management: the scoping is
proven from the outside through `DemoProvider`'s `initialDesk` seam and
the component tests. Do not build a screen that assumes the switcher is
there, and do not quietly reintroduce it without asking.

Every number is computed from `src/lib/dataset.ts`, a small fixed set of
CSE tickers, two client accounts and twelve months of brokerage revenue.
Nothing is a hardcoded string pretending to be a query result.

## Users

- **Almas executives and directors** watching a demo over someone's
  shoulder, or clicking through a link themselves for five minutes. They
  have seen Power BI. They are looking for what is different.
- **Almas dealers and research staff** who recognise CSE tickers on sight
  and will notice immediately if COMB's price or a P/E is implausible.
- **Graffs staff** driving the demo live, who need each surface to reach
  its point in one click, with no dead controls to apologise for.

## Voice

Plain, specific, confident without overclaiming. **Grounded, precise,
unhurried.**

- Labels are what a broker calls the thing: Turnover, Foreign net, ASPI,
  Unrealised gain, Concentration. Never "Metrics", "Insights", "Analytics".
- Every figure carries its own source line and an "illustrative values"
  caption. The demo never implies live CSE data.
- Never state a count that the dataset cannot prove.

## Anti-references

- **The Bloomberg-terminal reflex.** Finance does not mean a dark screen,
  neon green ticks, dense monospace walls, or navy and gold. This runs in
  a bright office in daylight.
- **The BI-tool wall.** Twelve unlabelled tiles in a uniform grid, every
  one the same size, with no order and no argument.
- **The dead control.** A filter, tab or button that renders live and does
  nothing when clicked. Already removed once from this codebase; do not
  reintroduce it.
- **The vanity KPI.** A number with no delta, no denominator and no source.

## Strategic principles

1. **Same component, both surfaces.** A figure in a chat answer and a tile
   on a dashboard are literally the same React component. The demo only
   earns "one product" if that stays true.
2. **The dashboard must argue, not just display.** Tiles are ordered and
   grouped so the surface reads top to bottom: where the market stands,
   what moved, what it means for the book. A flat grid of equal tiles
   makes no argument.
3. **Access is visible, never silent.** Locked, redacted and rescoped
   states keep their titles and say which desk can see the thing. A grey
   wall teaches nothing.
4. **Fidelity to the real product.** Chrome, tokens, spacing and card
   shapes are ported from `gf-app-dashboard` on `development`. When in
   doubt, go and read that repo rather than invent.
5. **Honest emptiness.** Where the dataset carries no evidence (new
   accounts this month, per-desk revenue), the surface says so or derives
   it transparently. It does not fabricate.
