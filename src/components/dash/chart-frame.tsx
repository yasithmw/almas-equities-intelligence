'use client'

import { ResponsiveContainer } from 'recharts'

// Every figure in the demo is drawn by Recharts, the platform's own
// chart library, so a client comparing the demo to their dashboards sees
// the same axes, the same tick weight, the same tooltip card.
//
// Two things travel with each figure:
//
// 1. A fixed pixel height. The platform sizes tiles through
//    react-grid-layout; the demo has a static grid, so each viz kind
//    declares the height that suits it.
// 2. An off-screen table of the same numbers. An SVG chart is opaque to
//    a screen reader, and the platform's own answer to that is the
//    Data panel behind every widget. This is the same idea at demo
//    scale, and it is what the component tests read, since Recharts
//    measures 0x0 under jsdom and draws nothing there.
export function ChartFrame({ height, children }: { height: number; children: React.ReactElement }) {
  return (
    // The declared height is a FLOOR, and 1.6 times it is the ceiling.
    //
    // Tiles in one grid row stretch to the tallest of them. At a fixed
    // height the shorter figures left the difference as dead white space
    // above their source line: a five-bar chart beside a donut-plus-key
    // sat in a tile two hundred pixels taller than it drew. Let them grow
    // without limit, though, and five bars spread across four hundred
    // pixels with more gap than bar, which looks like a figure with rows
    // missing.
    //
    // So a figure grows into the row up to half again its natural height,
    // and whatever slack is left over is split above and below it. Both
    // failure modes are bounded, and the figure stays centred in its tile
    // either way.
    // ── Why the inner box is positioned, and must stay that way ──────
    // ResponsiveContainer measures the box it is given. A percentage
    // height only resolves against an ancestor whose height is DEFINITE,
    // and `min-height` never makes a height definite: it changes the used
    // height while the specified height stays `auto`. So the slot below
    // laid out at its 160px floor, `height: 100%` inside it resolved to
    // `auto`, Recharts measured 0 and drew nothing, and every chart in
    // the demo came out an empty card. Anchoring the container to the
    // slot with inset-0 gives it the slot's resolved height as a real
    // one. Do not collapse these two divs back into one.
    <div className="flex w-full flex-1 flex-col justify-center">
      <div
        className="relative w-full"
        style={{ minHeight: height, maxHeight: height * 1.6 }}
      >
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function SrTable({
  caption, columns, rows,
}: { caption: string; columns: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r[0]}-${i}`}>
            {r.map((cell, j) => (
              j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Axis tick text.
//
// The platform's own formatCompact is wrong for these series: an index
// moving from 16,000 to 16,300 compacts to "16.2K" on two consecutive
// ticks, so the axis reads as if it had stopped. Grouped digits keep every
// tick distinct, which is what an axis is for.
export function axisNumber(value: number | string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  const abs = Math.abs(n)
  const maximumFractionDigits = abs >= 1000 ? 0 : abs >= 10 ? 1 : 2
  return n.toLocaleString('en-US', { maximumFractionDigits })
}

// Series inks. The platform resolves these through getWidgetPalette, which
// walks CHART_COLORS from a per-widget offset; the demo has a fixed handful
// of figures, so it names the two it uses from the same token set rather
// than rotating a palette nothing would notice.
export const INK_PRIMARY = 'hsl(var(--chart-6))'
export const INK_SECONDARY = 'hsl(var(--chart-4))'
export const INK_UP = 'hsl(var(--success))'
export const INK_DOWN = 'hsl(var(--danger))'

// Categorical inks.
//
// A category is not a judgement, so a categorical palette must not reach
// for --success or --danger: a sector drawn in danger red reads as a
// sector in trouble, and on a surface where red genuinely means "down"
// that is a real misreading, not a nitpick. CHART_COLORS, the platform's
// own rotation, does exactly that at positions three, four and five.
//
// The first attempt at a fix went the other way and took six blues and
// neutrals, which solved the misreading and created a worse one: navy,
// ink, slate and pale slate are not tellable apart at the size of a
// scatter dot, so the legend stopped working. These six are spread
// across the wheel and read as a palette, which is what defuses any one
// of them being taken for a verdict. See --cat-1..6 in globals.css.
export const CATEGORY_INKS = [
  'hsl(var(--cat-1))',
  'hsl(var(--cat-2))',
  'hsl(var(--cat-3))',
  'hsl(var(--cat-4))',
  'hsl(var(--cat-5))',
  'hsl(var(--cat-6))',
]

export function categoryInk(index: number): string {
  return CATEGORY_INKS[index % CATEGORY_INKS.length]
}

// The tooltip a ranked category figure wants: the category on one line,
// its own formatted value under it. Recharts' default renders
// "Value : +0.8%", which names the dataKey rather than the measure and
// tells the reader nothing they did not already know.
export function CategoryTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: { payload?: { label?: string; display?: string } }[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-md">
      <div className="text-[11.5px] font-medium text-popover-foreground">{row.label}</div>
      <div className="mt-0.5 text-[12.5px] font-semibold tabular-nums text-popover-foreground">
        {row.display}
      </div>
    </div>
  )
}
