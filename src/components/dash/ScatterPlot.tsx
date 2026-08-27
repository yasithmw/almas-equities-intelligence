'use client'

import {
  CartesianGrid,
  Label,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { AXIS_COLOR, GRID_COLOR, axisTick } from '../charts/chart-theme'
import type { ScatterViz } from '@/lib/types'
import { ChartFrame, SrTable, axisNumber, categoryInk } from './chart-frame'

// Axis names, drawn small and tracked so they read as labels rather than
// as a second title. Without them a reader has no way to tell which of
// two ratios is on which axis, and "Valuation against income" does not
// say which is which.
const AXIS_NAME = { fontSize: 10, fontWeight: 600, fill: AXIS_COLOR, letterSpacing: '0.06em' }

type Point = ScatterViz['points'][number]

// Two measures per name, one dot each.
//
// This is the only figure on the surface that answers "is the cheap one
// also the generous one". A ranked bar can show which counter has the
// lowest P/E and a second bar which has the highest yield, but neither
// can show that they are, or are not, the same counter. Groups (sectors)
// take CHART_COLORS in order and get a legend, because here the hue is
// the category label.
export default function ScatterPlot({ viz }: { viz: ScatterViz }) {
  const groups = [...new Set(viz.points.map((p) => p.group))]

  return (
    <>
      <ChartFrame height={252}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
          {/* 'auto' rather than dataMin/dataMax on purpose: pinning the
              domain to the extremes made Recharts divide the raw span
              into equal parts, and the ticks came out as 1.69, 3.69,
              5.69, 9.4. A reader cannot place a value against a scale
              like that. Letting the domain round outward gives whole
              numbers, and the padding keeps the outermost dots clear of
              the plot edge. */}
          <XAxis
            type="number"
            dataKey="x"
            name={viz.xName}
            tick={axisTick(10)}
            tickFormatter={axisNumber}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            padding={{ left: 14, right: 14 }}
            height={40}
          >
            <Label value={viz.xName} position="insideBottom" offset={0} style={AXIS_NAME} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            name={viz.yName}
            tick={axisTick(10)}
            tickFormatter={axisNumber}
            axisLine={false}
            tickLine={false}
            width={64}
            domain={['auto', 'auto']}
            padding={{ top: 12, bottom: 12 }}
          >
            <Label
              value={viz.yName}
              angle={-90}
              position="insideLeft"
              offset={12}
              style={{ ...AXIS_NAME, textAnchor: 'middle' }}
            />
          </YAxis>
          <ZAxis range={[54, 54]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: GRID_COLOR }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as Point
              return (
                <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-md">
                  <div className="font-mono text-[11.5px] font-medium tracking-[0.04em] text-popover-foreground">
                    {p.label}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {p.group}
                  </div>
                  <div className="mt-1 text-[11.5px] tabular-nums text-popover-foreground">
                    {viz.xName} {p.xDisplay}
                  </div>
                  <div className="text-[11.5px] tabular-nums text-popover-foreground">
                    {viz.yName} {p.yDisplay}
                  </div>
                </div>
              )
            }}
          />
          {groups.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingTop: 4, color: 'hsl(var(--muted-foreground))' }}
            />
          )}
          {groups.map((group, i) => (
            <Scatter
              key={group}
              name={group}
              data={viz.points.filter((p) => p.group === group)}
              fill={categoryInk(i)}
              fillOpacity={0.85}
            />
          ))}
        </ScatterChart>
      </ChartFrame>
      <SrTable
        caption={`${viz.title}, values`}
        columns={['Name', 'Group', viz.xName, viz.yName]}
        rows={viz.points.map((p) => [p.label, p.group, p.xDisplay, p.yDisplay])}
      />
    </>
  )
}
