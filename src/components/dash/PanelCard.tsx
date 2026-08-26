import type { Panel } from '@/lib/types'

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
    <div style={{ gridColumn: `span ${span ?? 1}` }} data-testid={testId}>
      {children}
    </div>
  )
}
