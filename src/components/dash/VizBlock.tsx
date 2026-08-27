'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Viz } from '@/lib/types'
import {
  asBars, asLine, asTable, barShape, nativeType, plottable,
  switchOptions, type ChartType,
} from '@/lib/chart-switch'
import { Bars, SignedBars } from './Bars'
import PairedBars from './PairedBars'
import LineChart from './LineChart'
import AreaChart from './AreaChart'
import Donut from './Donut'
import ScatterPlot from './ScatterPlot'
import SparkStats from './SparkStats'
import DataTable from './DataTable'
import Movers from './Movers'
import ProjectedChart from './ProjectedChart'
import ChartTypeMenu from './ChartTypeMenu'
import WidgetMenu from './WidgetMenu'

interface Props {
  viz: Viz
  // Free surface: a redacted panel carries a small tag beside its own
  // title rather than in a second, competing wrapper. Optional and
  // additive, so every existing caller renders exactly as before.
  tag?: string
  // The header's chart-type switcher and 3-dots menu.
  //
  // OFF by default, and on only in the chat thread. In the product these
  // controls are on the widget, so they appear on a dashboard tile too;
  // here they do not, for a reason the product does not have. Its tiles are
  // resized by the user through react-grid-layout, and the demo's are fixed
  // at a third of the row, where sixty pixels of header controls push the
  // longest title onto a second line. A wrapped title on a pitch screen
  // costs more than the affordance buys on a surface nobody was asking
  // about. Turning them on there is this one word.
  controls?: boolean
}

// The platform's widget tile.
//
// The chrome is deliberately thin here, because globals.css owns it:
// `.dashboard-theme article.rounded-2xl` forces the 20px radius, the
// hairline border, the two-layer shadow and the hover lift, and it kills
// any ::before/::after on this element outright (`content: none
// !important`, so html2canvas sees a clean box for PNG export). An
// earlier version of this file drew a card-to-card/95 gradient, a
// ring-1, and a lit top edge through `before:`; none of the three ever
// reached the screen. What is left is what actually renders.
//
// Used by both surfaces on purpose. In the product a figure in a chat
// answer and a tile on a dashboard are the same object, and the demo
// only earns the claim "asking in chat and opening the dashboard are one
// product" if they are literally the same component here too.
export default function VizBlock({ viz, tag, controls = false }: Props) {
  // The chosen type, or null while the card is showing the figure it was
  // built as. Reset when the figure itself changes, since a card switched to
  // Table should not keep a following figure in Table: the answer chose its
  // own drawing and that choice is the starting point every time. Keyed on
  // the title rather than object identity, because a redaction rebuilds the
  // figure and retitles it, which is precisely a case that should reset.
  const [chosen, setChosen] = useState<{ title: string; type: ChartType | null }>({
    title: viz.title, type: null,
  })
  const type = chosen.title === viz.title ? chosen.type : null
  const setType = (next: ChartType | null) => setChosen({ title: viz.title, type: next })

  const native = nativeType(viz)
  const active = type ?? native
  const options = controls ? switchOptions(viz, active) : []

  // "View data" and the Table target are the same state. On a card that IS a
  // table the row reads the other way round, as the product's own "Show
  // chart", and hands back a drawing.
  const showingData = active === 'table'
  const chartType: ChartType = native === 'table' ? 'bar' : native

  return (
    <article className="group/widget flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        {/* DESIGN.md, Typography: globals.css forces -0.018em tracking on
            this heading, and negative tracking on an uppercase run is
            unreadable, so the title is sentence case. The tracked
            uppercase treatment lives on the source line instead, which
            is short enough to carry it. */}
        <header data-widget-title-block="true" className="min-w-0 space-y-1">
          <h3 className="text-[15px] font-semibold leading-snug text-balance text-foreground">
            {viz.title}
          </h3>
          <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/85">
            {viz.caption}
          </p>
        </header>

        {/* The product's top action row: every control gated by whether it has
            anything to do, so the row is never a set of dead affordances. */}
        <div className="flex shrink-0 items-center gap-1">
          {tag && (
            <Badge variant="outline" className="shrink-0">
              {tag}
            </Badge>
          )}
          {options.length > 0 && (
            <ChartTypeMenu current={active} options={options} onSelect={setType} />
          )}
          {controls && (
            <WidgetMenu
              dataOpen={showingData}
              onToggleData={
                options.length > 0
                  ? () => setType(showingData ? chartType : 'table')
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* A flex column, so a figure inside can take the row's leftover
          height through ChartFrame's flex-1 rather than leaving it as
          white space above the source line.

          Global constraint: no horizontal body scroll. Wide content,
          which in practice means only the four-column concentration
          table, scrolls inside its own container. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Body viz={viz} type={active} />
      </div>

      {/* Ruling R12: the source is this figure's own, never a hardcoded
          label, so mislabelling where a number came from is a type error
          rather than a silent copy mistake. */}
      <footer className="flex shrink-0 items-center border-t border-border/60 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
        {viz.source}
      </footer>
    </article>
  )
}

// The figure at the requested type.
//
// Choosing the type the answer was BUILT as returns the original renderer, not
// a reconstruction of it: ranked bars keep their end labels, paired columns
// keep their hidden axis and per-bar values, the two-scale lines keep both
// axes. Everything else is projected through chart-switch and drawn by the
// renderer that already exists for that shape, so a projected area and a
// native area are the same drawing.
function Body({ viz, type }: { viz: Viz; type: ChartType }) {
  const plot = plottable(viz)
  if (type === nativeType(viz) || !plot) return <Native viz={viz} />

  switch (type) {
    case 'table': return <DataTable viz={asTable(viz, plot)} />
    case 'line': return <LineChart viz={asLine(viz, plot)} />
    // Not AreaChart: see ProjectedChart's header for why a projection cannot
    // share one value axis the way a native, possibly stacked, area figure does.
    case 'area': return <ProjectedChart viz={asLine(viz, plot)} mark="area" />
    case 'bar':
      // Columns for a wide set or for two series, ranked bars otherwise. See
      // barShape for why two series never take the grouped-bars renderer.
      if (barShape(plot) === 'columns') {
        return <ProjectedChart viz={asLine(viz, plot)} mark="bar" />
      }
      {
        const bars = asBars(viz, plot)
        return bars.kind === 'signedBars'
          ? <SignedBars viz={bars} />
          : <Bars viz={bars} />
      }
    // 'list', 'donut', 'scatter' and 'spark' are never offered as targets, so
    // reaching one here means it is this figure's own type, handled above.
    default: return <Native viz={viz} />
  }
}

function Native({ viz }: { viz: Viz }) {
  switch (viz.kind) {
    case 'bars': return <Bars viz={viz} />
    case 'signedBars': return <SignedBars viz={viz} />
    case 'pairedBars': return <PairedBars viz={viz} />
    case 'line': return <LineChart viz={viz} />
    case 'area': return <AreaChart viz={viz} />
    case 'donut': return <Donut viz={viz} />
    case 'scatter': return <ScatterPlot viz={viz} />
    case 'spark': return <SparkStats viz={viz} />
    case 'table': return <DataTable viz={viz} />
    case 'movers': return <Movers viz={viz} />
  }
}
