import { Badge } from '@/components/ui/badge'
import type { Viz } from '@/lib/types'
import { Bars, SignedBars } from './Bars'
import PairedBars from './PairedBars'
import LineChart from './LineChart'
import DataTable from './DataTable'
import Movers from './Movers'
import { INK_PRIMARY } from './chart-frame'

interface Props {
  viz: Viz
  // Free surface: a redacted panel carries a small tag beside its own
  // title rather than in a second, competing wrapper. Optional and
  // additive, so every existing caller renders exactly as before.
  tag?: string
}

// The platform's widget tile, ported: a rounded-2xl card on a card-to-
// card/95 gradient with a hairline ring, a lit top edge, and a shadow
// that deepens on hover. The header is a colour dot, an uppercase
// tracked title and a one-line description; the source line sits in the
// footer under a divider.
//
// Used by both surfaces on purpose. In the product a figure in a chat
// answer and a tile on a dashboard are the same object, and the demo
// only earns the claim "asking in chat and opening the dashboard are one
// product" if they are literally the same component here too.
export default function VizBlock({ viz, tag }: Props) {
  return (
    <article
      className="group/widget relative flex h-full flex-col space-y-3 overflow-hidden rounded-2xl bg-gradient-to-b from-card to-card/95 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_4px_16px_-6px_rgba(15,23,42,0.06)] ring-1 ring-border/60 transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent hover:shadow-[0_2px_6px_rgba(15,23,42,0.05),0_20px_40px_-12px_rgba(15,23,42,0.14)] hover:ring-border"
    >
      <div className="flex items-start justify-between gap-2">
        <header data-widget-title-block="true" className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: INK_PRIMARY }}
            />
            <h3 className="text-[15px] font-semibold uppercase leading-snug tracking-[0.04em] text-balance text-foreground">
              {viz.title}
            </h3>
          </div>
          <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/85">
            {viz.caption}
          </p>
        </header>
        {tag && (
          <Badge variant="outline" className="shrink-0">
            {tag}
          </Badge>
        )}
      </div>

      {/* Global constraint: no horizontal body scroll. Wide content, which
          in practice means only the four-column concentration table,
          scrolls inside its own container. */}
      <div className="min-w-0 flex-1">
        {viz.kind === 'bars' && <Bars viz={viz} />}
        {viz.kind === 'signedBars' && <SignedBars viz={viz} />}
        {viz.kind === 'pairedBars' && <PairedBars viz={viz} />}
        {viz.kind === 'line' && <LineChart viz={viz} />}
        {viz.kind === 'table' && <DataTable viz={viz} />}
        {viz.kind === 'movers' && <Movers viz={viz} />}
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
