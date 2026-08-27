'use client'

import { createPortal } from 'react-dom'
import { BarChart3, Code2, MoreVertical, Plus } from 'lucide-react'
import {
  ExcelIcon, ImageFileIcon, PdfIcon, PowerPointIcon, type FileTypeIcon,
} from '@/components/ui/file-type-icons'
import { cn } from '@/lib/utils'
import { useAnchoredMenu } from './use-anchored-menu'

const MENU_WIDTH = 252
const MENU_HEIGHT = 220

/**
 * The four formats the product's export menu offers, in its order, with its
 * icons. Each one here is a glyph and nothing else: the demo writes no files.
 * See the strip below for why they are on screen at all.
 */
const FORMATS: { icon: FileTypeIcon; label: string }[] = [
  { icon: ImageFileIcon, label: 'Image' },
  { icon: PdfIcon, label: 'PDF' },
  { icon: PowerPointIcon, label: 'PowerPoint' },
  { icon: ExcelIcon, label: 'Excel' },
]

/**
 * The widget header's "3-dots" menu, ported from the product's
 * `WidgetActionsMenu` (components/widgets/widget-toolbar.tsx): the same trigger
 * geometry as the other header icon buttons, and the same portal'd panel.
 *
 * ONE action works: View data, which is the product's own first row and the only
 * one whose whole implementation is already sitting in the card. Export and
 * add-to-dashboard need a file writer and a dashboard store, so they appear as
 * their icons alone under a mono label, with no verb beside them and no hint
 * promising a file. They are on screen because they are part of what this widget
 * is in the product, and a prospect reading the menu should see the shape of it;
 * they carry a title saying they are off here, so nobody clicks one and waits for
 * a download. The alternative, cutting them, would make the menu a single row and
 * misrepresent the product in the other direction.
 */
export default function WidgetMenu({
  dataOpen, onToggleData,
}: {
  dataOpen: boolean
  /** Omitted when the figure holds no numbers to show as data. */
  onToggleData?: () => void
}) {
  const { open, setOpen, triggerRef, menuRef, pos, mounted } = useAnchoredMenu({
    width: MENU_WIDTH, height: MENU_HEIGHT,
  })

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Widget options"
      className="fixed z-[1000] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
      style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
    >
      {onToggleData && (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onToggleData()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {dataOpen
                ? <BarChart3 className="h-3.5 w-3.5 text-foreground" />
                : <Code2 className="h-3.5 w-3.5 text-foreground" />}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {dataOpen ? 'Show chart' : 'View data'}
            </span>
          </button>
          <div className="border-t border-border" />
        </>
      )}

      <IconStrip label="Format">
        {FORMATS.map(({ icon: Icon, label }) => (
          <InertAction key={label} label={`Download as ${label}`}>
            <Icon size={15} />
          </InertAction>
        ))}
      </IconStrip>

      <IconStrip label="Dashboard">
        <InertAction label="Add to dashboard">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        </InertAction>
      </IconStrip>
    </div>
  )

  return (
    <>
      {/* The product's trigger, verbatim: the same 24px circle as the refresh
          and expand buttons beside it, so the row reads as one. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="Widget options"
        aria-label="Widget options"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/40 transition hover:bg-primary/10 hover:text-primary',
          open && 'bg-primary/10 text-primary',
        )}
      >
        <MoreVertical className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      {open && mounted && createPortal(menu, document.body)}
    </>
  )
}

/**
 * A mono category label with its actions as bare icons on the right. Borrowed
 * from the product's own "Format | Save Mail" header row, which puts the noun on
 * the left and the verbs above a column of square buttons: the label names the
 * group, the icon carries the action.
 *
 * `role="group"`, not a bare div: a menu may only contain menu items, separators
 * and groups.
 */
function IconStrip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-2 px-3 py-1.5"
    >
      <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-0.5">{children}</span>
    </div>
  )
}

/**
 * An action the product performs and the demo does not. A real button, focusable
 * and named, so the keyboard reaches everything the mouse can see; it just has
 * nothing to run. `aria-disabled` rather than `disabled`, because a disabled
 * button in most browsers shows no title on hover, and the title is the whole
 * explanation.
 */
function InertAction({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled="true"
      aria-label={label}
      title={`${label}, not available in the demo`}
      onClick={(e) => e.preventDefault()}
      className="flex h-7 w-7 cursor-default items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}
