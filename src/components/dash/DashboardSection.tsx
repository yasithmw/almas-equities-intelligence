'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  ordinal: number
  title: string
  subtitle: string
  widgets: number
  children: React.ReactNode
}

// A section of one dashboard.
//
// The platform draws these as a bordered, tinted box with the tiles
// inside it. That reads as a card holding cards, which is the one nesting
// this design system does not allow, and on a white-on-white theme the
// box adds a border for no separation anyway. The grouping is carried by
// a header on a rule instead: a mono ordinal, the question the section
// answers, its one-line subtitle, and how many figures are under it.
//
// Collapsing is the affordance a long dashboard actually needs. Sections
// open by default, because a demo that opens folded shows nothing.
export default function DashboardSection({
  ordinal, title, subtitle, widgets, children,
}: Props) {
  const [open, setOpen] = useState(true)
  const label = String(ordinal).padStart(2, '0')

  return (
    <section aria-label={title}>
      <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform duration-200', !open && '-rotate-90')}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-[10.5px] font-medium tracking-[0.14em] text-muted-foreground/55"
              >
                {label}
              </span>
              <h2 className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.012em] text-foreground">
                {title}
              </h2>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="mt-0.5 shrink-0 rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {widgets} {widgets === 1 ? 'widget' : 'widgets'}
        </span>
      </div>

      {open && (
        <div className="mt-4 grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {children}
        </div>
      )}
    </section>
  )
}
