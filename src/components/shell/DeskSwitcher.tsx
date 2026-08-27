'use client'

import { Briefcase, FlaskConical, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DESKS } from '@/lib/desks'
import type { DeskId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDemo } from './DemoContext'

// Built in the platform's own segmented-control idiom, lifted from
// ResponseModeToggle: a bordered group on a muted ground where the
// active segment is a raised card (bg-background + shadow-sm) rather
// than a filled accent. That is how the product signals "one of these
// is selected", so the desk switcher signals it the same way.
const ICONS: Record<DeskId, LucideIcon> = {
  management: Briefcase,
  dealing: TrendingUp,
  research: FlaskConical,
}

// Ruling R1: the switcher's own active button doubles as the
// active-desk indicator (data-testid="active-desk"), so the header
// never prints the same desk name twice.
export default function DeskSwitcher() {
  const { desk, setDesk } = useDemo()

  return (
    <div
      className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5"
      role="group"
      aria-label="Desk"
    >
      {DESKS.map((d) => {
        const active = d.id === desk
        const Icon = ICONS[d.id]
        return (
          <button
            key={d.id}
            type="button"
            aria-pressed={active}
            aria-label={`${d.label}, ${d.person}`}
            data-testid={active ? 'active-desk' : undefined}
            onClick={() => setDesk(d.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all duration-200',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span>{d.label}</span>
          </button>
        )
      })}
    </div>
  )
}
