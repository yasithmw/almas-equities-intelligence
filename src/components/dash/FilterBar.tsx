'use client'

import { ChevronDown } from 'lucide-react'
import { TICKERS } from '@/lib/dataset'
import type { Filters } from '@/lib/dashboards'

// Ruling 7: real <label> plus <select> controls, so the tests can drive
// them with selectOptions and a keyboard user gets the platform select
// they already know. Styled as the platform's own pill-shaped filter
// control rather than as a custom dropdown.
//
// The sector list is derived from the dataset (TICKERS' own sectors, in
// first-seen order) rather than typed out again, so it can never drift
// from the sectors the dataset actually carries.
const SECTORS: Array<Filters['sector']> = [
  'All',
  ...Array.from(new Set(TICKERS.map((t) => t.sector))),
]
const PERIODS: Array<Filters['period']> = ['MTD', 'QTD', 'YTD']

function Control<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
        {label}
      </span>
      <span className="relative inline-flex items-center">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-8 appearance-none rounded-full border border-border bg-card pl-3 pr-7 text-[12px] font-medium text-foreground transition-colors outline-hidden hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 h-3 w-3 text-muted-foreground/60"
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
    </label>
  )
}

export default function FilterBar({
  filters, onChange,
}: { filters: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Control
        label="Sector"
        value={filters.sector}
        options={SECTORS}
        onChange={(sector) => onChange({ ...filters, sector })}
      />
      <Control
        label="Period"
        value={filters.period}
        options={PERIODS}
        onChange={(period) => onChange({ ...filters, period })}
      />
    </div>
  )
}
