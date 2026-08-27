'use client'

import { ArrowRight, LayoutDashboard } from 'lucide-react'
import type { Access } from '@/lib/types'
import type { Dashboard } from '@/lib/dashboards'
import LockedPanel from './LockedPanel'
import StatusPill from './StatusPill'

interface Props {
  dashboards: Dashboard[]
  accessOf: (dashboard: Dashboard) => Access
  allowedDeskLabel: (dashboard: Dashboard) => string
  onOpen: (id: string) => void
}

// Ported from the platform's /dashboards landing grid: a card per
// dashboard on a hairline border with a soft shadow, lifting half a
// pixel on hover, and a "View dashboard" action with an arrow that
// nudges right. Every card renders data-testid={'dash-card-' + id}
// (Ruling 7).
//
// A locked card keeps its title and badge in full and swaps only the
// open action for the locked plate, so it is an honestly labelled
// listing rather than a button pretending to work.
export default function DashboardList({ dashboards, accessOf, allowedDeskLabel, onOpen }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {dashboards.map((d) => {
        const locked = accessOf(d) === 'locked'
        return (
          <article
            key={d.id}
            data-testid={`dash-card-${d.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_2px_6px_hsl(var(--foreground)/0.06),0_12px_24px_-12px_hsl(var(--foreground)/0.12)]"
          >
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-foreground/[0.05] text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <StatusPill tone={d.badge === 'Pre-built' ? 'ok' : 'ac'}>{d.badge}</StatusPill>
              </div>

              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.012em] text-foreground">
                  {d.title}
                </h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {d.description}
                </p>
              </div>

              <div className="mt-auto pt-1">
                {locked ? (
                  <LockedPanel allowedDeskLabel={allowedDeskLabel(d)} />
                ) : (
                  // aria-label overrides the computed name outright, so the
                  // accessible name is exactly the dashboard's title however
                  // the visible description wraps.
                  <button
                    type="button"
                    aria-label={d.title}
                    onClick={() => onOpen(d.id)}
                    className="inline-flex items-center text-[12.5px] font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    <span aria-hidden="true">View dashboard</span>
                    <ArrowRight
                      className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
