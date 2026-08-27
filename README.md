# Almas Equities Intelligence

One deployment carrying two things:

| Route | What it serves |
| --- | --- |
| `/` and `/brief` | The executive summary, a static page rewritten from `public/brief.html` |
| `/demo` | The concept preview: an interactive dashboard and chat surface built on illustrative data |

The `Preview concept` button in the summary's nav links to `/demo`, so a reader
moves from the written case to the working surface without leaving the link.

## The brief is generated, not authored here

`public/brief.html` is a copy. Its source is
`Almas Equities - Executive Summary.html`, which lives two directories up in the
design folder and is not part of this repo. `scripts/sync-brief.mjs` copies it in
on every `prebuild` and `predev`.

On Vercel only this directory is checked out, so the canonical file is missing and
the script warns and uses the committed copy as-is. That is deliberate: see ruling
R9 in the script's own comment. **Editing the summary therefore takes three steps:**

```bash
# 1. edit the canonical file in the design folder, then
npm run sync:brief   # 2. refresh public/brief.html
git commit -am "..." # 3. commit the refreshed copy
```

Skipping step 2 means the deployed summary silently stays on the previous version.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest, jsdom
npm run build   # production build, runs sync:brief first
```

Recharts draws nothing measurable under jsdom, so every visualisation also renders
an off-screen `SrTable`. Tests assert against that table, not the SVG.

## Data

Every figure comes from `src/lib/dataset.ts`, an illustrative CSE-shaped dataset.
No client data, no live market feed, no backend. Nothing here is a real position
or a real revenue number.

## Deployment

Vercel, Next.js auto-detected, root directory is this folder, no environment
variables. The whole deployment is `noindex` (a header in `next.config.ts` plus
`public/robots.txt`), but the URL is publicly reachable by anyone holding it.
