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
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
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
