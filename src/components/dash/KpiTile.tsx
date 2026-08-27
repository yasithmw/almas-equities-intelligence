import { ArrowDown, ArrowUp } from 'lucide-react'
import type { KpiSpec } from '@/lib/types'
import { cn } from '@/lib/utils'

// The platform's KPI hero, at the size the dashboard theme resolves it
// to: an 11px uppercase tracked label over a 40px tabular value, on a
// plain card with one hairline border. Written out explicitly rather
// than leaning on the theme's own `[class*="kpi"] p` overrides, because
// those force the value's colour with !important and Ruling R14 needs
// the value's own colour to survive.
function tone(dir?: 'up' | 'down' | 'flat') {
  if (dir === 'up') return 'text-success'
  if (dir === 'down') return 'text-danger'
  return 'text-muted-foreground'
}

// Ruling R14: the source exhibit colours the Foreign net tile on the
// VALUE, not on the delta line below it, so valueDir drives the value's
// colour independently of dir.
export default function KpiTile({ spec }: { spec: KpiSpec }) {
  const Arrow = spec.dir === 'up' ? ArrowUp : spec.dir === 'down' ? ArrowDown : null

  return (
    <div className="kpi-tile rounded-xl border border-border bg-card px-5 py-4">
      <div className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {spec.label}
      </div>
      <div
        className={cn(
          'mt-2 font-serif text-[2.5rem] font-medium leading-none tracking-[-0.03em] tabular-nums',
          spec.valueDir === 'up'
            ? 'text-success'
            : spec.valueDir === 'down'
              ? 'text-danger'
              : 'text-foreground',
        )}
      >
        {spec.value}
      </div>
      {spec.delta && (
        <div className={cn('mt-2 flex items-center gap-1 text-[11.5px] font-medium', tone(spec.dir))}>
          {Arrow && <Arrow className="h-3 w-3 shrink-0" strokeWidth={2.6} />}
          {spec.delta}
        </div>
      )}
    </div>
  )
}
