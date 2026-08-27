'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import type { KpiSpec } from '@/lib/types'
import {
  DASHBOARDS, DEFAULT_FILTERS, accessFor,
  type Filters,
} from '@/lib/dashboards'
import { DESKS } from '@/lib/desks'
import { useDemo } from '../shell/DemoContext'
import PanelCard from './PanelCard'
import VizBlock from './VizBlock'
import KpiTile from './KpiTile'
import DashboardHeader from './DashboardHeader'
import DashboardList from './DashboardList'
import LockedPanel from './LockedPanel'

// The KPI row (Panel 0 on every dashboard, span 4) has no owner among
// the viz primitives: KpiTile draws one tile, not a row of them. Sized
// to however many tiles a given dashboard hands it, three for Client
// Book and four elsewhere, rather than a fixed four that would leave a
// dead cell.
function KpiRow({ tiles }: { tiles: KpiSpec[] }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
    >
      {tiles.map((t) => <KpiTile key={t.label} spec={t} />)}
    </div>
  )
}

// Names whichever desk can actually open a locked dashboard, derived
// from the same access matrix the lock itself comes from, never
// hardcoded to "Management": if the matrix changed, this sentence would
// still be true.
function viewableDeskLabel(dashboardId: string): string {
  const viewers = DESKS.filter((d) => accessFor(d.id, dashboardId) !== 'locked').map((d) => d.label)
  if (viewers.length === 0) return 'No desk'
  if (viewers.length === 1) return viewers[0]
  if (viewers.length === 2) return `${viewers[0]} and ${viewers[1]}`
  return `${viewers.slice(0, -1).join(', ')} and ${viewers[viewers.length - 1]}`
}

// The dashboards surface, in the platform's own two-level shape: a
// landing grid of dashboard cards, then a full-width detail page behind
// a .page-header with a back affordance. That is the flow the client
// already has, and it is also the layout that gives a four-column panel
// grid the room it needs.
//
// Both levels sit inside .dashboard-theme, the wrapper the platform puts
// on /dashboards, so tile chrome, heading type and tabular figures
// resolve exactly as they do in the product.
export default function DashboardsPane() {
  const { desk } = useDemo()
  const [openId, setOpenId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  // A filter chosen on one dashboard should not silently carry over and
  // narrow a different one opened straight after.
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [openId])

  const openDashboard = openId ? DASHBOARDS.find((d) => d.id === openId) ?? null : null

  // ----- Detail: one dashboard, full width -------------------------------
  if (openDashboard) {
    const access = accessFor(desk, openDashboard.id)
    return (
      <div className="dashboard-theme flex h-full min-h-0 flex-col overflow-hidden">
        <DashboardHeader
          title={openDashboard.title}
          description={openDashboard.description}
          badge={openDashboard.badge}
          usesFilters={openDashboard.usesFilters}
          filters={filters}
          onFiltersChange={setFilters}
          onBack={() => setOpenId(null)}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
            {access === 'locked' ? (
              <div className="max-w-xl">
                <LockedPanel allowedDeskLabel={viewableDeskLabel(openDashboard.id)} />
              </div>
            ) : (
              <div className="grid auto-rows-min grid-cols-4 gap-4">
                {openDashboard.panels(desk, filters).map((panel) => (
                  <PanelCard key={panel.id} span={panel.span} testId={`panel-${panel.id}`}>
                    {panel.body.kind === 'kpis' ? (
                      <KpiRow tiles={panel.body.tiles} />
                    ) : (
                      <VizBlock
                        viz={panel.body}
                        tag={
                          openDashboard.id === 'clients'
                          && panel.id === 'gainloss'
                          && access === 'redacted'
                            ? 'Redacted'
                            : undefined
                        }
                      />
                    )}
                  </PanelCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ----- Landing: the dashboards you can open ----------------------------
  // "3 of 3 open to this desk" pointed at a desk control the header no
  // longer has, so it read as a count of nothing. The plain count says
  // what is there.
  const openable = DASHBOARDS.filter((d) => accessFor(desk, d.id) !== 'locked').length

  return (
    <div className="dashboard-theme flex h-full min-h-0 flex-col overflow-hidden">
      <div className="page-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="page-header-icon">
            <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.012em] text-foreground">
              Dashboards
            </h1>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {openable === DASHBOARDS.length
                ? `${DASHBOARDS.length} dashboards`
                : `${openable} of ${DASHBOARDS.length} open to you`}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
          <DashboardList
            dashboards={DASHBOARDS}
            accessOf={(d) => accessFor(desk, d.id)}
            allowedDeskLabel={(d) => viewableDeskLabel(d.id)}
            onOpen={setOpenId}
          />
        </div>
      </div>
    </div>
  )
}
