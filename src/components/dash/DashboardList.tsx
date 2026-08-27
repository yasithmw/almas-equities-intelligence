'use client'

import { ArrowRight, EyeOff, Layers, Lock } from 'lucide-react'
import type { Access } from '@/lib/types'
import type { Dashboard } from '@/lib/dashboards'
import { Button } from '@/components/ui/button'
import LockedPanel from './LockedPanel'

interface Props {
  dashboards: Dashboard[]
  accessOf: (dashboard: Dashboard) => Access
  allowedDeskLabel: (dashboard: Dashboard) => string
  widgetsOf: (dashboard: Dashboard) => number
  // The titles of the sections behind the card, in order. Three cards on
  // a wide screen otherwise leave the library mostly empty, and the
  // reader has to open a dashboard to find out what is in it. These are
  // the dashboard's own section titles, not a written-out summary that
  // could drift from them.
  outlineOf: (dashboard: Dashboard) => string[]
  onOpen: (id: string) => void
}

// How a desk's access shows on the card, before the dashboard is opened.
//
// Three of the four states are worth saying out loud on the listing: a
// dealer should know Client Book will be their own book before they open
// it, and research should know the holder names will be withheld. 'full'
// says nothing, because "you can see all of this" is the default and a
// pill claiming it would be noise on every card.
const ACCESS_NOTE: Partial<Record<Access, { icon: typeof EyeOff; label: string }>> = {
  rescoped: { icon: Layers, label: 'Scoped to your book' },
  redacted: { icon: EyeOff, label: 'Holder names withheld' },
  locked: { icon: Lock, label: 'Not open to this desk' },
}

// The platform's /dashboards landing card, ported: three stacked zones
// divided by hairlines, which is what gives the card its structure
// without any tint. A tracked uppercase eyebrow naming the kind, the
// dashboard's own title, then the description and what is inside it, then
// a footer that is only ever the action.
//
// A locked card keeps its title, its eyebrow and its counts in full and
// swaps only the footer action for the locked plate, so it is an honestly
// labelled listing rather than a button pretending to work. Every card
// renders data-testid={'dash-card-' + id} (Ruling 7).
export default function DashboardList({
  dashboards, accessOf, allowedDeskLabel, widgetsOf, outlineOf, onOpen,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {dashboards.map((d) => {
        const access = accessOf(d)
        const locked = access === 'locked'
        const note = ACCESS_NOTE[access]
        const widgets = widgetsOf(d)
        const outline = outlineOf(d)

        return (
          <article
            key={d.id}
            data-testid={`dash-card-${d.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="px-5 pb-4 pt-5">
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                {d.badge}
              </span>
              <h2 className="mt-1.5 truncate text-[19px] font-semibold tracking-[-0.01em] text-foreground">
                {d.title}
              </h2>
            </div>

            <div className="flex flex-1 flex-col border-t border-border/60 px-5 py-4">
              <p className="line-clamp-3 text-[13px] leading-relaxed text-foreground/70">
                {d.description}
              </p>
              <ol className="mt-4 space-y-1.5 border-t border-border/50 pt-3.5">
                {outline.map((title, i) => (
                  <li key={title} className="flex items-baseline gap-2.5 text-[12.5px]">
                    <span
                      aria-hidden="true"
                      className="shrink-0 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground/50"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 truncate text-foreground/75">{title}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                <span className="inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground/60">
                  {widgets} {widgets === 1 ? 'widget' : 'widgets'}
                </span>
                <span className="inline-flex items-center rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground/60">
                  {outline.length} {outline.length === 1 ? 'section' : 'sections'}
                </span>
                {note && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <note.icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                    {note.label}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-border/60 px-5 py-4">
              {locked ? (
                <LockedPanel allowedDeskLabel={allowedDeskLabel(d)} />
              ) : (
                // aria-label overrides the computed name outright, so the
                // accessible name is exactly the dashboard's title however
                // the visible description wraps.
                <Button
                  variant="outline"
                  aria-label={d.title}
                  onClick={() => onOpen(d.id)}
                  className="w-full border-primary/70 text-primary hover:border-primary hover:bg-primary/[0.06]"
                >
                  <span aria-hidden="true">View dashboard</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                </Button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
