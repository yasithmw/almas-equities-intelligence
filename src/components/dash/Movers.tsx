import { TrendingDown, TrendingUp } from 'lucide-react'
import type { MoversViz } from '@/lib/types'
import { cn } from '@/lib/utils'

// Label plus a signed value, no bar: a movers list is read as a ranking,
// and a bar per row would claim a magnitude comparison the eye does not
// need here.
//
// A row with a name stacks it UNDER the code rather than beside it. Three
// columns in a one-third-width tile squeezed the name to about fifty
// pixels, which truncated the withheld-name marker to "Name ..." on the
// research desk, turning the clearest compliance signal in the demo into
// an ellipsis. Stacking gives the name the full width of the row.
export default function Movers({ viz }: { viz: MoversViz }) {
  return (
    <ul className="divide-y divide-border/60">
      {viz.rows.map((r) => {
        const up = r.value >= 0
        const Icon = up ? TrendingUp : TrendingDown
        return (
          <li key={r.code} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[11.5px] font-medium tracking-[0.04em] text-foreground">
                {r.code}
              </span>
              {r.name && (
                <span
                  data-testid="mover-name"
                  className={cn(
                    'mt-0.5 block truncate text-[11.5px]',
                    r.nameMuted ? 'italic text-muted-foreground/55' : 'text-muted-foreground',
                  )}
                >
                  {r.name}
                </span>
              )}
            </span>
            <span
              className={cn(
                'flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold tabular-nums',
                up ? 'text-success' : 'text-danger',
              )}
            >
              <Icon className="h-3 w-3" strokeWidth={2.4} />
              {r.display}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
