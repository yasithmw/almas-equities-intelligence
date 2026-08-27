'use client'

import { cn } from '@/lib/utils'

export type LibraryTab = 'prebuilt' | 'mine' | 'shared'

interface Props {
  value: LibraryTab
  onChange: (tab: LibraryTab) => void
  prebuilt: number
}

// The platform's dashboard library opens on a three-way segmented
// control: what shipped with the product, what you saved yourself, and
// what a colleague shared with you.
//
// This demo only carries the first. The other two render, with their real
// zero counts, and are disabled rather than clickable, because the shape
// of the library is worth showing and an empty tab that opens on nothing
// is not. A disabled control that says why is a state; a live control
// that does nothing when clicked is the defect this codebase already
// removed once from the filter bar.
export default function LibraryTabs({ value, onChange, prebuilt }: Props) {
  const tabs: {
    id: LibraryTab
    label: string
    count: number
    reason?: string
  }[] = [
    { id: 'prebuilt', label: 'System', count: prebuilt },
    {
      id: 'mine',
      label: 'My dashboards',
      count: 0,
      reason: 'Saving your own dashboards is off in this demonstration environment',
    },
    {
      id: 'shared',
      label: 'Shared with me',
      count: 0,
      reason: 'Nothing has been shared with this desk in this demonstration environment',
    },
  ]

  return (
    <div
      role="tablist"
      aria-label="Dashboard library"
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5"
    >
      {tabs.map((t) => {
        const selected = value === t.id
        const disabled = t.reason !== undefined
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            title={t.reason}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-200',
              'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40',
              selected && 'bg-card text-foreground shadow-sm',
              !selected && !disabled && 'text-muted-foreground hover:text-foreground',
              disabled && 'cursor-not-allowed text-muted-foreground/45',
            )}
          >
            {t.label}
            <span className="tabular-nums opacity-60">({t.count})</span>
          </button>
        )
      })}
    </div>
  )
}
