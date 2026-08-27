'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { DonutViz } from '@/lib/types'
import { CategoryTooltip, ChartFrame, INK_DOWN, INK_UP, SrTable, categoryInk } from './chart-frame'

const TONE_INK = {
  up: INK_UP,
  down: INK_DOWN,
  flat: 'hsl(var(--chart-7))',
} as const

// A ring, drawn only where the parts genuinely sum to the whole.
//
// The centre is not decoration: it carries the total the ring is a
// division of, which is the one number a part-to-whole figure otherwise
// makes the reader add up for themselves.
//
// Segment colour follows what the parts mean. Market breadth really is
// up, down and neither, so it takes the signal inks. Everything else is
// a set of categories, and categories take the blue and neutral
// CATEGORY_INKS: the platform's full rotation starts on black and runs
// through success green and danger red, which on this surface would say
// a sector was in trouble for no reason beyond its position in a list.
export default function Donut({ viz }: { viz: DonutViz }) {
  const total = viz.rows.reduce((s, r) => s + Math.abs(r.value), 0)
  const data = viz.rows.map((r, i) => ({
    ...r,
    value: Math.abs(r.value),
    fill: r.tone ? TONE_INK[r.tone] : categoryInk(i),
  }))

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChartFrame height={172}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={total > 0 ? 1.5 : 0}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ChartFrame>

        {/* The total, parked in the hole the ring already leaves. Capped
            at the hole's width and allowed to wrap, because an uncapped
            single line ("under management") ran straight out over the
            ring. Pointer events off so it never eats a segment's hover. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="max-w-[52%] text-center text-[19px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">
            {viz.centreValue}
          </span>
          <span className="mt-1 max-w-[52%] text-balance text-center text-[9.5px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground">
            {viz.centreLabel}
          </span>
        </div>
      </div>

      {/* Recharts' own legend puts a wrapping row of names under the ring
          and gives no room for each part's value. A two-column key with
          the figure on the right is what the reader actually needs, and
          it stays legible in a one-quarter-width tile. */}
      <ul className="shrink-0 space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-[11.5px]">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: d.fill }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">{d.display}</span>
          </li>
        ))}
      </ul>

      <SrTable
        caption={`${viz.title}, values`}
        columns={['Part', 'Value']}
        rows={viz.rows.map((r) => [r.label, r.display])}
      />
    </div>
  )
}
