'use client'

import {
  Area,
  AreaChart as RcAreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { AreaViz } from '@/lib/types'
import { ChartFrame, INK_PRIMARY, INK_SECONDARY, SrTable, axisNumber } from './chart-frame'

const INKS = [INK_PRIMARY, INK_SECONDARY]

// A quantity over time, filled to the baseline.
//
// The fill is a soft vertical gradient of the series' own ink rather than
// a flat tint, so two stacked bands stay tellable apart where they meet.
// Every series carries pre-formatted `displays` alongside its raw points,
// so the tooltip and the off-screen table read "Rs 92.1M", never a bare
// 92.1 whose unit the reader has to remember from the title.
export default function AreaChart({ viz }: { viz: AreaViz }) {
  const data = viz.xLabels.map((label, i) => {
    const row: Record<string, string | number> = { label }
    for (const s of viz.series) {
      row[s.name] = s.points[i]
      row[`${s.name}__display`] = s.displays[i]
    }
    return row
  })

  return (
    <>
      <ChartFrame height={viz.series.length > 1 ? 218 : 196}>
        <RcAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            {viz.series.map((s, i) => (
              <linearGradient key={s.name} id={`area-${gradientId(viz.title, s.name)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INKS[i % INKS.length]} stopOpacity={0.26} />
                <stop offset="100%" stopColor={INKS[i % INKS.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={axisTick(10)}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={axisTick(10)}
            tickFormatter={axisNumber}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name, item) => [
              (item?.payload as Record<string, string>)?.[`${String(name)}__display`] ?? String(value),
              String(name),
            ]}
          />
          {viz.series.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'hsl(var(--muted-foreground))' }}
            />
          )}
          {viz.series.map((s, i) => (
            <Area
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stackId={viz.stacked ? 'one' : undefined}
              stroke={INKS[i % INKS.length]}
              strokeWidth={2}
              fill={`url(#area-${gradientId(viz.title, s.name)})`}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          ))}
        </RcAreaChart>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Point', ...viz.series.map((s) => s.name)]}
        rows={viz.xLabels.map((label, i) => [label, ...viz.series.map((s) => s.displays[i])])}
      />
    </>
  )
}

// An SVG url() reference terminates at whitespace, so a gradient id built
// from a series name ("Market turnover") would resolve to "#area-Market"
// and the fill would silently fall back to black. Same guard the
// platform's own slugifyId applies, scoped by title so two tiles on one
// page cannot collide on a single id.
function gradientId(title: string, series: string): string {
  return `${title}-${series}`.replace(/[^A-Za-z0-9_-]/g, '_')
}
