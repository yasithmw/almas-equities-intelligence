'use client'

import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import type { Filters } from '@/lib/dashboards'
import FilterBar from './FilterBar'
import StatusPill from './StatusPill'

interface Props {
  title: string
  description: string
  badge: string
  // Client Book and Firm Performance accept a filters argument but never
  // vary their panels by it, so each Dashboard declares usesFilters for
  // itself and the bar renders only when it is true. A live, clickable
  // control that changes nothing is worse than no control.
  usesFilters: boolean
  filters: Filters
  onFiltersChange: (next: Filters) => void
  onBack: () => void
}

// The platform's .page-header: the same 64px frosted glass bar every
// workspace page opens with, carrying the back affordance, the tinted
// page icon, the title over its one-line description, and the page's own
// controls pushed right.
export default function DashboardHeader({
  title, description, badge, usesFilters, filters, onFiltersChange, onBack,
}: Props) {
  return (
    <div className="page-header">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="All dashboards"
          title="All dashboards"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <span className="page-header-icon">
          <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.012em] text-foreground">
            {title}
          </h1>
          <p className="truncate text-[11.5px] text-muted-foreground">{description}</p>
        </div>
        <StatusPill tone={badge === 'Pre-built' ? 'ok' : 'ac'}>{badge}</StatusPill>
      </div>

      {usesFilters && (
        <div className="flex shrink-0 items-center gap-2">
          <FilterBar filters={filters} onChange={onFiltersChange} />
        </div>
      )}
    </div>
  )
}
