'use client'

import { Bar, BarChart, CartesianGrid, LabelList, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_COLOR, GRID_COLOR, TOOLTIP_STYLE, axisTick } from '../charts/chart-theme'
import type { PairedBarsViz } from '@/lib/types'
import { ChartFrame, INK_PRIMARY, INK_SECONDARY, SrTable } from './chart-frame'

// Two measures per category, grouped rather than stacked: the question
// this answers is "how does one compare with the other", and a stack
// would hide exactly that.
//
// The value axis is deliberately HIDDEN. The categories here are
// different measures, so one of them is a multiple (P/E, around 6x) and
// the other a percentage (dividend yield, around 9%). A shared numeric
// axis would invite reading 6.2 against 9.4 as if they were the same
// quantity, which they are not. Each bar carries its own formatted value
// instead, and the comparison the reader is meant to make, one series
// against the other WITHIN a measure, is the one the drawing supports.
export default function PairedBars({ viz }: { viz: PairedBarsViz }) {
  const [aName, bName] = viz.series
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
        <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={axisTick(11)} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'hsl(var(--muted-foreground))' }}
          />
          <Bar dataKey={aName} fill={INK_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={30}>
            <LabelList
              dataKey="aDisplay"
              position="top"
              style={{ fontSize: 11, fontWeight: 600, fill: AXIS_COLOR }}
            />
          </Bar>
          <Bar dataKey={bName} fill={INK_SECONDARY} radius={[4, 4, 0, 0]} maxBarSize={30}>
            <LabelList
              dataKey="bDisplay"
              position="top"
              style={{ fontSize: 11, fontWeight: 600, fill: AXIS_COLOR }}
            />
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
