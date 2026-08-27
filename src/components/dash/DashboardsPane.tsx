'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChartColumnBig } from 'lucide-react'
import type { KpiSpec } from '@/lib/types'
import {
  DASHBOARDS, DEFAULT_FILTERS, accessFor, widgetCount,
  type Dashboard, type Filters,
} from '@/lib/dashboards'
import { DESKS } from '@/lib/desks'
import { useDemo } from '../shell/DemoContext'
import PanelCard from './PanelCard'
import VizBlock from './VizBlock'
import KpiTile from './KpiTile'
import DashboardHeader from './DashboardHeader'
import DashboardList from './DashboardList'
import DashboardSection from './DashboardSection'
import LibraryTabs, { type LibraryTab } from './LibraryTabs'
import LockedPanel from './LockedPanel'

// The KPI row (Panel 0 of every section that opens a dashboard) has no
// owner among the viz primitives: KpiTile draws one tile, not a row of
// them. Sized to however many tiles a given dashboard hands it, three or
// four, rather than a fixed four that would leave a dead cell. Below the
// xl breakpoint the row wraps to two, which is the same collapse the
// panel grid around it makes.
function KpiRow({ tiles }: { tiles: KpiSpec[] }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 xl:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
      style={{ '--kpi-cols': tiles.length } as React.CSSProperties}
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
// landing library of dashboard cards behind a tab strip, then a
// full-width detail page behind a .page-header with a back affordance.
// That is the flow the client already has, and it is also the layout that
// gives a sectioned panel grid the room it needs.
//
// Both levels sit inside .dashboard-theme, the wrapper the platform puts
// on /dashboards, so tile chrome, heading type and tabular figures
// resolve exactly as they do in the product.
export default function DashboardsPane() {
  const { desk } = useDemo()
  const [openId, setOpenId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [tab, setTab] = useState<LibraryTab>('prebuilt')

  // A filter chosen on one dashboard should not silently carry over and
  // narrow a different one opened straight after.
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [openId])

  const openDashboard = openId ? DASHBOARDS.find((d) => d.id === openId) ?? null : null

  // Counts on the landing card are this desk's counts, not the firm's: a
  // dealer's Client Book really does carry fewer figures than management's,
  // and a card promising thirteen that opens on eleven would be the first
  // thing they noticed.
  const countsOf = useMemo(() => {
    const cache = new Map<string, { widgets: number; outline: string[] }>()
    return (d: Dashboard) => {
      const hit = cache.get(d.id)
      if (hit) return hit
      const next = {
        widgets: widgetCount(d, desk, DEFAULT_FILTERS),
        outline: d.sections(desk, DEFAULT_FILTERS).map((s) => s.title),
      }
      cache.set(d.id, next)
      return next
    }
  }, [desk])

  // ----- Detail: one dashboard, full width -------------------------------
  if (openDashboard) {
    const access = accessFor(desk, openDashboard.id)
    const sections = openDashboard.sections(desk, filters)
    const widgets = widgetCount(openDashboard, desk, filters)

    return (
      <div className="dashboard-theme flex h-full min-h-0 flex-col overflow-hidden">
        <DashboardHeader
          title={openDashboard.title}
          description={openDashboard.description}
          badge={openDashboard.badge}
          summary={access === 'locked' ? undefined : `${widgets} widgets`}
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
              <div className="space-y-8">
                {sections.map((section, i) => (
                  <DashboardSection
                    key={section.id}
                    ordinal={i + 1}
                    title={section.title}
                    subtitle={section.subtitle}
                    widgets={section.panels.reduce(
                      (n, p) => n + (p.body.kind === 'kpis' ? p.body.tiles.length : 1), 0,
                    )}
                  >
                    {section.panels.map((panel) => (
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
                  </DashboardSection>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ----- Landing: the library --------------------------------------------
  // "3 of 3 open to this desk" pointed at a desk control the header no
  // longer has, so it read as a count of nothing. The subtitle says what
  // is there, and narrows to a ratio only when this desk really is
  // locked out of something.
  const openable = DASHBOARDS.filter((d) => accessFor(desk, d.id) !== 'locked').length

  return (
    <div className="dashboard-theme flex h-full min-h-0 flex-col overflow-hidden">
      <div className="page-header">
        <div className="flex min-w-0 items-center gap-3">
          {/* Not LayoutDashboard: the sidebar's own Dashboards nav item
              already carries that glyph, so the page header repeating it
              read as the same control twice over. A chart mark says what
              this page holds rather than restating where you are. */}
          <span className="page-header-icon">
            <ChartColumnBig className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.012em] text-foreground">
              Dashboards
            </h1>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {openable === DASHBOARDS.length
                ? 'System dashboards for Almas Equities'
                : `${openable} of ${DASHBOARDS.length} open to you`}
            </p>
          </div>
        </div>

        <LibraryTabs value={tab} onChange={setTab} prebuilt={DASHBOARDS.length} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
          <DashboardList
            dashboards={DASHBOARDS}
            accessOf={(d) => accessFor(desk, d.id)}
            allowedDeskLabel={(d) => viewableDeskLabel(d.id)}
            widgetsOf={(d) => countsOf(d).widgets}
            outlineOf={(d) => countsOf(d).outline}
            onOpen={setOpenId}
          />
        </div>
      </div>
    </div>
  )
}
