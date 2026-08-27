'use client'

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis,
} from 'recharts'
import { GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { LineViz } from '@/lib/types'
import { ChartFrame, INK_PRIMARY, INK_SECONDARY, SrTable, axisNumber } from './chart-frame'

const INKS = [INK_PRIMARY, INK_SECONDARY]

/** Columns, or an area fill. The axes are the same work for both. */
export type ProjectedMark = 'bar' | 'area'

// The two drawings a SWITCHED figure needs and no existing renderer can give
// it, both over a label axis with one value axis PER SERIES.
//
// Columns, because Bars.tsx ranks categories down the side, which is right for
// six banks and wrong for twelve months: twelve stacked rows read as a list,
// and every label sits sideways to the series it belongs to. PairedBars draws
// columns but hides its axis and stamps a value over every bar, right for two
// categories and unreadable at twelve.
//
// Areas, because AreaChart.tsx puts every series on ONE axis, which it has to:
// its figures may be stacked, and a stack is only readable against a shared
// scale. A projection has no such licence. It does not know that its series are
// parts of one total, and for the pair this demo actually plots they are not:
// revenue in tens of millions against turnover in billions flattens the second
// series onto the floor of a shared axis, which is the exact failure the
// caption "each series scaled to its own range" promises will not happen.
//
// So the per-series axis is the point of this file, and it is the same decision
// LineChart makes for the same reason.
export default function ProjectedChart({
  viz, mark,
}: { viz: LineViz; mark: ProjectedMark }) {
  const data = viz.xLabels.map((label, i) => {
    const row: Record<string, string | number> = { label }
    for (const s of viz.series) row[s.name] = s.points[i]
    return row
  })
  const dual = viz.series.length > 1
  const Root = mark === 'area' ? AreaChart : BarChart

  return (
    <>
      <ChartFrame height={230}>
        <Root data={data} margin={{ top: 8, right: dual ? 4 : 10, bottom: 0, left: -6 }}>
          {mark === 'area' && (
            <defs>
              {viz.series.map((s, i) => (
                <linearGradient
                  key={s.name}
                  id={`projected-${slug(viz.title)}-${i}`}
                  x1="0" y1="0" x2="0" y2="1"
                >
                  {/* Two areas on two axes trace nearly the same shape, so at
                      the single-series opacity the upper fill covers the lower
                      one and the overlap reads as a grey slab. Lighter fills
                      let both strokes and both tints through. */}
                  <stop
                    offset="0%"
                    stopColor={INKS[i % INKS.length]}
                    stopOpacity={dual ? 0.14 : 0.28}
                  />
                  <stop offset="100%" stopColor={INKS[i % INKS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
          )}
          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={axisTick(10)}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          {viz.series.map((s, i) => (
            <YAxis
              key={s.name}
              yAxisId={s.name}
              orientation={i === 0 ? 'left' : 'right'}
              // The series' own ink, but only when there are two of them. Two
              // axes need telling apart; one axis coloured like the mark is a
              // code with nothing to decode, and reads as an accent on a number.
              tick={dual ? { ...axisTick(10), fill: INKS[i % INKS.length] } : axisTick(10)}
              tickFormatter={axisNumber}
              axisLine={false}
              tickLine={false}
              width={56}
              // A column must sit on its baseline: drawn from an auto-fitted
              // floor it claims a magnitude it does not have. The top is left
              // to Recharts so the highest tick is a round number. An area is
              // read as a shape, so it takes the tighter fitted range.
              domain={mark === 'bar' ? [(min: number) => Math.min(0, min), 'auto'] : ['auto', 'auto']}
            />
          ))}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={mark === 'bar' ? { fill: 'hsl(var(--foreground) / 0.04)' } : undefined}
          />
          {dual && (
            <Legend
              iconType={mark === 'bar' ? 'circle' : 'plainline'}
              iconSize={mark === 'bar' ? 7 : 14}
              wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'hsl(var(--muted-foreground))' }}
            />
          )}
          {viz.series.map((s, i) => (
            mark === 'area' ? (
              <Area
                key={s.name}
                yAxisId={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={INKS[i % INKS.length]}
                strokeWidth={2}
                fill={`url(#projected-${slug(viz.title)}-${i})`}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
              />
            ) : (
              <Bar
                key={s.name}
                yAxisId={s.name}
                dataKey={s.name}
                fill={INKS[i % INKS.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={26}
              />
            )
          ))}
        </Root>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Point', ...viz.series.map((s) => s.name)]}
        rows={viz.xLabels.map((label, i) => [
          label,
          ...viz.series.map((s) => String(s.points[i])),
        ])}
      />
    </>
  )
}

// A gradient id has to be unique on the page, and two cards can plot the same
// figure at once (a chat answer and its dashboard tile). The title is what
// distinguishes them.
function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
