'use client'

import { useState, type ElementType } from 'react'
import {
  ChevronLeft,
  LayoutDashboard,
  MessageSquare,
  PanelLeftOpen,
  SquarePen,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useDemo, type View } from './DemoContext'

// Ported from the platform's AppSidebar: the single global left bar,
// with navigation living INSIDE the chat sidebar directly under "New
// chat". Two states, the same two the real one has: an expanded 260px
// labelled panel, and a collapsed icon-only rail where every item keeps
// its label in a right-side tooltip.
//
// The real bar also carries Search, Shared, pinned chats and a refresh
// control over server-paginated history. None of those have anything to
// do in a demo with six questions, and a control that does nothing is
// worse than an absent one, so they are left out rather than mocked.

const TOOLTIP_CLASS =
  'rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md'

interface NavItem {
  view: View
  label: string
  icon: ElementType
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { view: 'chat', label: 'Chat', icon: MessageSquare },
  { view: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
]

export default function AppSidebar() {
  const { view, setView, history, newChat } = useDemo()
  const [collapsed, setCollapsed] = useState(false)
  const toggle = () => setCollapsed((c) => !c)

  if (collapsed) {
    return (
      <aside
        className="relative flex h-full w-[56px] shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3"
        aria-label="Sidebar"
      >
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          title="Expand"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <PanelLeftOpen className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* One quiet hairline separates the toggle from the menu, so New
            chat and the nav read as a single cluster. */}
        <span className="my-1 h-px w-5 bg-border/60" aria-hidden="true" />

        <RailButton label="New chat" icon={SquarePen} onClick={newChat} />

        {NAV_ITEMS.map((item) => (
          <RailButton
            key={item.view}
            label={item.label}
            icon={item.icon}
            active={view === item.view}
            onClick={() => setView(item.view)}
          />
        ))}
      </aside>
    )
  }

  return (
    <aside
      className="relative flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-card"
      aria-label="Sidebar"
    >
      <EdgeToggle onClick={toggle} />

      <div className="shrink-0 px-2 pt-3 pb-1">
        <button type="button" onClick={newChat} className="fleet-menu-row">
          <SquarePen className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
          <span>New chat</span>
        </button>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = view === item.view
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              aria-current={active ? 'page' : undefined}
              className={cn('fleet-menu-row', active && 'fleet-menu-row-active')}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1.5">
        <span className="fleet-eyebrow">Recent chats</span>
      </div>

      {/* Ruling R3: history entries are a record of what has been asked,
          not controls. Rendering them as buttons would make a
          suggested-question query match two elements at once. */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-4">
        {history.length === 0 ? (
          <p className="px-2.5 py-2 text-[12px] leading-relaxed text-muted-foreground/60">
            Questions you ask appear here.
          </p>
        ) : (
          <ul data-testid="rail-history" className="flex flex-col gap-0.5">
            {history.map((q) => (
              <li
                key={q}
                title={q}
                className="truncate rounded-lg px-2.5 py-2 text-[12.5px] text-foreground/85"
              >
                {q}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 px-4 py-2.5 text-center text-[10.5px] tracking-[0.06em] text-muted-foreground/55 uppercase">
        Analytics platform
      </div>
    </aside>
  )
}

// A circular chevron straddling the sidebar's right border, pinned to the
// same top position in both states so it never jumps when toggling.
function EdgeToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Collapse sidebar"
      title="Collapse"
      className="absolute -right-3.5 top-3.5 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-primary shadow-md ring-1 ring-foreground/5 transition-all duration-200 hover:border-primary/60 hover:bg-primary/10 hover:shadow-lg"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
    </button>
  )
}

function RailButton({
  label,
  icon: Icon,
  onClick,
  active = false,
}: {
  label: string
  icon: ElementType
  onClick: () => void
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
          )}
        >
          <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.4 : 2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className={TOOLTIP_CLASS}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
