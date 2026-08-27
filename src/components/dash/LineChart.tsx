'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RcLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { LineViz } from '@/lib/types'
import { ChartFrame, INK_PRIMARY, INK_SECONDARY, SrTable, axisNumber } from './chart-frame'

const INKS = [INK_PRIMARY, INK_SECONDARY]

// A series over time, with one value axis PER SERIES.
//
// This is not a stylistic choice. The two pairs this demo plots are an
// index near 16,000 against one near 4,900, and brokerage revenue in
// tens of millions against market turnover in billions. On a single
// shared axis the smaller series flattens onto the floor and its shape,
// which is the whole question being asked, disappears. Each series
// therefore gets its own axis, drawn in that series' own ink so the
// reader can tell at a glance which scale belongs to which line.
export default function LineChart({ viz }: { viz: LineViz }) {
  const data = viz.xLabels.map((label, i) => {
    const row: Record<string, string | number> = { label }
    for (const s of viz.series) row[s.name] = s.points[i]
    return row
  })
  const dual = viz.series.length > 1

  return (
    <>
      <ChartFrame height={230}>
        <RcLineChart data={data} margin={{ top: 8, right: dual ? 4 : 10, bottom: 0, left: -6 }}>
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
              tick={{ ...axisTick(10), fill: INKS[i % INKS.length] }}
              tickFormatter={axisNumber}
              axisLine={false}
              tickLine={false}
              width={56}
              domain={['auto', 'auto']}
            />
          ))}
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          {dual && (
            <Legend
              iconType="plainline"
              iconSize={14}
              wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'hsl(var(--muted-foreground))' }}
            />
          )}
          {viz.series.map((s, i) => (
            <Line
              key={s.name}
              yAxisId={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={INKS[i % INKS.length]}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          ))}
        </RcLineChart>
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
