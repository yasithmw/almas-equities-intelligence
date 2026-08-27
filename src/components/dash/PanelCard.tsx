import type { Panel } from '@/lib/types'
import { cn } from '@/lib/utils'

// How wide a panel sits at each breakpoint.
//
// The span used to be an inline `gridColumn: span N`, which is a single
// fixed number and so could not narrow: a span-4 KPI row inside a
// two-column grid asked for four tracks that were not there, and the
// browser invented them, pushing the page sideways. Declaring the span
// per breakpoint instead lets the same panel be full width in all three
// grids without any of them overflowing.
const SPAN: Record<NonNullable<Panel['span']>, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-2 xl:col-span-3',
  4: 'col-span-1 md:col-span-2 xl:col-span-4',
}

// Ruling R13: PanelCard is layout-only. Exhibit B's chat card and
// Exhibit C's dashboard panels are the same bordered, titled box in the
// client's document (.pc and .card are byte-identical declarations), so
// that chrome belongs to one owner, VizBlock (or KpiTile for its own
// .kpi tiles), not to the grid cell as well. PanelCard only places its
// children in the dashboard grid and, optionally, tags them for tests.
export default function PanelCard({
  span, testId, children,
}: {
  span?: Panel['span']
  testId?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('min-w-0', SPAN[span ?? 1])} data-testid={testId}>
      {children}
    </div>
  )
}
