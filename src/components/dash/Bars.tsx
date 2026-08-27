'use client'

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_COLOR, GRID_COLOR, axisTick } from '../charts/chart-theme'
import type { BarsViz, SignedBarsViz } from '@/lib/types'
import {
  CategoryTooltip, ChartFrame, INK_DOWN, INK_PRIMARY, INK_UP, SrTable,
} from './chart-frame'

type Row = { label: string; value: number; display: string }

// A value label, always drawn on the far side of the zero line from the
// category names.
//
// Recharts' own `position="right"` measures from the rect's right edge,
// which for a bar drawn LEFT of zero is the zero line, so a negative
// bar's label landed on top of the axis and its neighbours' labels.
// Flipping the anchor and drawing it to the LEFT of the bar instead only
// moved the problem: in a quarter-width tile a −0.6% bar sits within a
// few pixels of zero, and its label ran straight back through
// "Manufacturing". However much axis is reserved below zero, a small
// enough negative will always put its label back over the names.
//
// So a negative row's value is drawn just PAST the zero line, in the
// positive gutter, which on that row is empty by definition: nothing can
// collide with it, at any tile width, for any pair of values. It also
// reads better, since every value on the figure then sits in the same
// place relative to the axis.
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
    // Recharts hands a negative bar a SIGNED width, so `x + w` is its
    // far-left edge, not its right one. Taking the max of the two edges
    // is the right one either way: for a positive bar that is the bar's
    // tip, and for a negative bar it is the zero line, which is exactly
    // where this label wants to sit.
    const right = Math.max(x, x + w)
    return (
      <text
        x={right + (row.value < 0 ? 10 : 7)}
        y={y + h / 2}
        textAnchor="start"
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
            width={100}
            tick={axisTick(11)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CategoryTooltip />}
            cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
          />
          <Bar dataKey="value" fill={INK_PRIMARY} radius={[0, 5, 5, 0]} maxBarSize={30}>
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

// How far below zero the axis runs.
//
// Enough for the longest negative label to sit clear of the category
// names, expressed as a share of the figure's own range so it holds
// whether the smallest value is −0.6% or −Rs 6M. Zero when nothing is
// negative, so an all-positive figure spends none of its width on an
// empty half.
//
// Only the bar needs room here, not its label: labels are drawn past the
// zero line (see endLabel), so the negative side no longer has to be
// wide enough to hold text. A little over the deepest negative is
// exactly enough, and the positive bars keep the rest of the width.
function negativeFloor(rows: Row[]): number {
  const min = Math.min(...rows.map((r) => r.value), 0)
  if (min >= 0) return 0
  return -Math.abs(min) * 1.25
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
              that left no room to draw the bars at all.
              The padding used to be `dataMin * 1.9`, which scales with
              the SMALLEST value rather than with the label. Where one
              sector was down 0.6% against another up 6.5%, that reserved
              about half a percent of axis for a label needing forty
              pixels, and "−0.6%" was drawn straight through the category
              names. Reserving a share of the figure's own full range
              instead means the room is there whatever the negative
              happens to be. */}
          <XAxis
            type="number"
            hide
            domain={[negativeFloor(data), (dataMax: number) => dataMax * 1.12]}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            tick={axisTick(11)}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
          />
          <Tooltip
            content={<CategoryTooltip />}
            cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
          />
          <Bar dataKey="value" radius={4} maxBarSize={30}>
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
