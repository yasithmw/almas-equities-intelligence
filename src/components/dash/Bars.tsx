'use client'

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_COLOR, GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { BarsViz, SignedBarsViz } from '@/lib/types'
import { ChartFrame, INK_DOWN, INK_PRIMARY, INK_UP, SrTable } from './chart-frame'

type Row = { label: string; value: number; display: string }

// A value label placed on the side of the bar that has room for it.
// Recharts' own `position="right"` measures from the rect's right edge,
// which for a bar drawn LEFT of zero is the zero line, so a negative
// bar's label landed on top of the axis and its neighbours' labels. This
// reads the sign and flips the anchor.
function endLabel(rows: Row[]) {
  return function EndLabel(props: {
    x?: number | string
    y?: number | string
    width?: number | string
    height?: number | string
    index?: number
  }) {
    const i = props.index ?? 0
    const row = rows[i]
    if (!row) return null
    const x = Number(props.x ?? 0)
    const y = Number(props.y ?? 0)
    const w = Number(props.width ?? 0)
    const h = Number(props.height ?? 0)
    const negative = row.value < 0
    return (
      <text
        x={negative ? x - 7 : x + w + 7}
        y={y + h / 2}
        textAnchor={negative ? 'end' : 'start'}
        dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 600, fill: AXIS_COLOR }}
      >
        {row.display}
      </text>
    )
  }
}

// Horizontal bars, the platform's default for a ranked category set:
// category names down the value axis, a value label at the end of each
// bar, a vertical-only grid so the eye reads across rather than down.
export function Bars({ viz }: { viz: BarsViz }) {
  const data: Row[] = viz.rows.map((r) => ({ label: r.label, value: r.value, display: r.display }))
  return (
    <>
      <ChartFrame height={Math.max(140, data.length * 34 + 24)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tick={axisTick(11)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
            formatter={(_v, _n, item) => [(item?.payload as Row)?.display, 'Value']}
          />
          <Bar dataKey="value" fill={INK_PRIMARY} radius={[0, 5, 5, 0]} maxBarSize={20}>
            <LabelList dataKey="display" content={endLabel(data)} />
          </Bar>
        </BarChart>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Name', 'Value']}
        rows={viz.rows.map((r) => [r.label, r.display])}
      />
    </>
  )
}

// Bars above and below zero. Each bar takes the success or danger ink
// from its own sign, and the zero line is drawn as a solid axis so the
// split reads at a glance.
export function SignedBars({ viz }: { viz: SignedBarsViz }) {
  const data: Row[] = viz.rows.map((r) => ({ label: r.label, value: r.value, display: r.display }))
  return (
    <>
      <ChartFrame height={Math.max(160, data.length * 34 + 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          {/* Padding the domain, rather than the margin, is what gives a
              bar below zero somewhere to put its label: a page margin
              would come off the plot area, and on a one-third-width tile
              that left no room to draw the bars at all. */}
          <XAxis
            type="number"
            hide
            domain={[
              (dataMin: number) => (dataMin < 0 ? dataMin * 1.9 : 0),
              (dataMax: number) => dataMax * 1.1,
            ]}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tick={axisTick(11)}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
            formatter={(_v, _n, item) => [(item?.payload as Row)?.display, 'Value']}
          />
          <Bar dataKey="value" radius={4} maxBarSize={20}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.value >= 0 ? INK_UP : INK_DOWN} />
            ))}
            <LabelList dataKey="display" content={endLabel(data)} />
          </Bar>
        </BarChart>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Name', 'Value']}
        rows={viz.rows.map((r) => [r.label, r.display])}
      />
    </>
  )
}
