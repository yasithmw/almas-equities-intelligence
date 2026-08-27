import { ArrowDown, ArrowUp } from 'lucide-react'
import type { SparkViz } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SrTable } from './chart-frame'

// A stat and the shape that produced it, in one row.
//
// A KPI tile states a level; this states the level and its recent
// history side by side, which is the difference between "the index is at
// 16,180" and "the index is at 16,180 and has been climbing for a month".
//
// Drawn as a plain inline SVG rather than through Recharts. A sparkline
// is a polyline with no axes, no ticks, no tooltip and no legend, and at
// roughly 88 by 30 pixels a ResponsiveContainer's measurement pass buys
// nothing: a viewBox with preserveAspectRatio="none" scales the same
// path to whatever width the row ends up with, and renders identically
// under jsdom where Recharts draws nothing at all.
function Spark({ points, tone }: { points: number[]; tone: string }) {
  if (points.length < 2) return <span className="h-[30px] w-[88px] shrink-0" aria-hidden="true" />

  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min
  const W = 100
  const H = 34
  const PAD = 3
  const x = (i: number) => (i / (points.length - 1)) * W
  // A flat series has no range to normalise against; sitting it on the
  // centre line is the honest drawing, not a division by zero.
  const y = (v: number) =>
    span === 0 ? H / 2 : PAD + (1 - (v - min) / span) * (H - PAD * 2)

  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')
  const fill = `${line} L${W},${H} L0,${H} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[30px] w-[88px] shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path d={fill} fill={tone} fillOpacity={0.1} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function SparkStats({ viz }: { viz: SparkViz }) {
  return (
    <>
      <ul className="divide-y divide-border/60">
        {viz.rows.map((r) => {
          const Arrow = r.dir === 'up' ? ArrowUp : r.dir === 'down' ? ArrowDown : null
          const tone =
            r.dir === 'up'
              ? 'hsl(var(--success))'
              : r.dir === 'down'
                ? 'hsl(var(--danger))'
                : 'hsl(var(--chart-6))'
          return (
            <li key={r.label} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {r.label}
                </span>
                <span className="mt-1 block text-[19px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground">
                  {r.value}
                </span>
                {r.delta && (
                  <span
                    className={cn(
                      'mt-1.5 flex items-center gap-1 text-[11.5px] font-medium',
                      r.dir === 'up'
                        ? 'text-success'
                        : r.dir === 'down'
                          ? 'text-danger'
                          : 'text-muted-foreground',
                    )}
                  >
                    {Arrow && <Arrow className="h-3 w-3 shrink-0" strokeWidth={2.6} />}
                    {r.delta}
                  </span>
                )}
              </span>
              <Spark points={r.points} tone={tone} />
            </li>
          )
        })}
      </ul>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Measure', 'Latest', 'Change']}
        rows={viz.rows.map((r) => [r.label, r.value, r.delta ?? 'No change stated'])}
      />
    </>
  )
}
