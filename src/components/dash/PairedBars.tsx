'use client'

import { Bar, BarChart, CartesianGrid, LabelList, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_COLOR, GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { PairedBarsViz } from '@/lib/types'
import { ChartFrame, INK_PRIMARY, INK_SECONDARY, SrTable, axisNumber } from './chart-frame'

// Two measures per category, grouped rather than stacked: the question
// this answers is "how does one compare with the other", and a stack
// would hide exactly that.
//
// Whether the value axis shows depends on whether the two series share a
// unit, which the figure declares for itself.
//
// Where they do NOT (a P/E around 6x against a dividend yield around
// 9%), the axis stays hidden: a shared numeric scale would invite
// reading 6.2 against 9.4 as one quantity, which they are not. Each bar
// carries its own formatted value instead.
//
// Where they DO (an average cost against a market price, both rupees a
// share), the axis is the better drawing and the per-bar labels come
// off. Two labels above two adjacent thirty-pixel bars is about ninety
// pixels of text in sixty pixels of space, and "Rs 188.00" and
// "Rs 189.25" ran through each other.
// A value label above its bar, on one line.
//
// Recharts' own `position="top"` wraps the label to the bar's width, and
// these bars are capped at thirty pixels, so "Rs 198.00" broke into two
// lines and the upper one was clipped straight off the top of the plot.
// Drawing the text directly, centred on the bar and ignoring the bar's
// width, keeps every label whole.
function topLabel(props: {
  x?: number | string
  y?: number | string
  width?: number | string
  value?: string | number
}) {
  const x = Number(props.x ?? 0)
  const y = Number(props.y ?? 0)
  const w = Number(props.width ?? 0)
  if (props.value === undefined || props.value === null) return null
  return (
    <text
      x={x + w / 2}
      y={y - 6}
      textAnchor="middle"
      style={{ fontSize: 11, fontWeight: 600, fill: AXIS_COLOR }}
    >
      {String(props.value)}
    </text>
  )
}

export default function PairedBars({ viz }: { viz: PairedBarsViz }) {
  const [aName, bName] = viz.series
  const shared = viz.sharedAxis === true
  const data = viz.rows.map((r) => ({
    label: r.label,
    [aName]: r.a,
    [bName]: r.b,
    aDisplay: r.aDisplay,
    bDisplay: r.bDisplay,
  }))

  return (
    <>
      <ChartFrame height={230}>
        <BarChart
          data={data}
          margin={{ top: shared ? 8 : 26, right: 8, bottom: 0, left: shared ? -10 : 8 }}
        >
          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={axisTick(11)} axisLine={false} tickLine={false} />
          <YAxis
            hide={!shared}
            width={52}
            tick={axisTick(10)}
            tickFormatter={axisNumber}
            axisLine={false}
            tickLine={false}
            // 'auto' when the axis is shown, so the ticks round to whole
            // numbers instead of ending on the tallest bar's own value.
            domain={[0, shared ? 'auto' : 'dataMax']}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'hsl(var(--muted-foreground))' }}
          />
          <Bar dataKey={aName} fill={INK_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={30}>
            {!shared && <LabelList dataKey="aDisplay" content={topLabel} />}
          </Bar>
          <Bar dataKey={bName} fill={INK_SECONDARY} radius={[4, 4, 0, 0]} maxBarSize={30}>
            {!shared && <LabelList dataKey="bDisplay" content={topLabel} />}
          </Bar>
        </BarChart>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Name', aName, bName]}
        rows={viz.rows.map((r) => [r.label, r.aDisplay, r.bDisplay])}
      />
    </>
  )
}
