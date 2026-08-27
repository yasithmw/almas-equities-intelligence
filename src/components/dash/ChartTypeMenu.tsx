'use client'

import { createPortal } from 'react-dom'
import {
  Activity, AreaChart, BarChart3, Check, ChevronDown, Donut, LineChart, List,
  ScatterChart, Shapes, Table, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ChartSwitchOption, ChartType } from '@/lib/chart-switch'
import { useAnchoredMenu } from './use-anchored-menu'

// The product's own TYPE_ICON map (components/widgets/chart-type-menu.tsx),
// trimmed to the types the demo draws. The product falls back to Shapes for a
// type its map has no entry for, so a movers list and a stat list show a
// generic glyph there; naming those two is the only change.
const TYPE_ICON: Record<ChartType, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  area: AreaChart,
  table: Table,
  list: List,
  donut: Donut,
  scatter: ScatterChart,
  spark: Activity,
}

const MENU_WIDTH = 180
const MENU_HEIGHT = 200

/**
 * The chart-type switcher in the widget header, ported from the product's
 * `ChartTypeMenu`: a trigger showing the current type's glyph and a chevron,
 * and a menu portal'd out of the tile's clipped overflow.
 *
 * The product splits its menu into "Switch instantly" and "Rebuild with Graff"
 * groups, because half its targets need the agent to re-query the data. Every
 * target here re-renders in place, so there is one group, and a lone group
 * heading over a list that has no sibling is a label with nothing to
 * distinguish. It is gone, and the menu is narrower than the product's 220px to
 * fit what it actually holds.
 */
export default function ChartTypeMenu({
  current, options, onSelect,
}: {
  current: ChartType
  options: ChartSwitchOption[]
  onSelect: (type: ChartType) => void
}) {
  const { open, setOpen, triggerRef, menuRef, pos, mounted } = useAnchoredMenu({
    width: MENU_WIDTH, height: MENU_HEIGHT,
  })

  function pick(type: ChartType) {
    setOpen(false)
    onSelect(type)
  }

  const TriggerIcon = TYPE_ICON[current] ?? Shapes

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Switch chart type"
      className="fixed z-[1000] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-xl"
      style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
    >
      {options.map((o) => {
        const Icon = TYPE_ICON[o.type] ?? Shapes
        return (
          <button
            key={o.type}
            type="button"
            role="menuitem"
            onClick={o.isCurrent ? undefined : () => pick(o.type)}
            disabled={o.isCurrent}
            aria-current={o.isCurrent || undefined}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
              o.isCurrent
                ? 'cursor-default text-foreground'
                : 'text-foreground/90 hover:bg-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
            {o.isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="widget-data-toggle h-7 gap-1 px-2 text-xs"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch chart type"
        title="Switch chart type"
      >
        <TriggerIcon className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>
      {open && mounted && createPortal(menu, document.body)}
    </>
  )
}
