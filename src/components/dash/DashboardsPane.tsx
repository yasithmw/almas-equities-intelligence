'use client'

import { useEffect, useState } from 'react'
import type { KpiSpec } from '@/lib/types'
import {
  DASHBOARDS, DEFAULT_FILTERS, accessFor, buildDashboard, BUILD_STEPS,
  type Dashboard, type Filters,
} from '@/lib/dashboards'
import { DESKS } from '@/lib/desks'
import { useDemo } from '../shell/DemoContext'
import ActivityFeed from '../chat/ActivityFeed'
import PanelCard from './PanelCard'
import VizBlock from './VizBlock'
import KpiTile from './KpiTile'
import DashboardHeader from './DashboardHeader'
import DashboardList from './DashboardList'
import LockedPanel from './LockedPanel'
import styles from './DashboardsPane.module.css'

// The KPI row (Panel 0 on every dashboard, span 4) has no owner among the
// "have" primitives: KpiTile draws one tile, not a row of them. Sized to
// however many tiles a given dashboard actually hands it (three for
// Client Book, four everywhere else) via a CSS custom property, rather
// than a fixed repeat(4, 1fr) that would leave a dead cell.
function KpiRow({ tiles }: { tiles: KpiSpec[] }) {
  return (
    <div className={styles.kpiRow} style={{ '--kpi-cols': String(tiles.length) } as React.CSSProperties}>
      {tiles.map((t) => <KpiTile key={t.label} spec={t} />)}
    </div>
  )
}

// Names whichever desk can actually open a locked dashboard, derived from
// the same access matrix the lock itself comes from, never hardcoded to
// "Management": if the matrix ever changed, this sentence would still be
// true.
function viewableDeskLabel(dashboardId: string): string {
  const viewers = DESKS.filter((d) => accessFor(d.id, dashboardId) !== 'locked').map((d) => d.label)
  if (viewers.length === 0) return 'No desk'
  if (viewers.length === 1) return viewers[0]
  if (viewers.length === 2) return `${viewers[0]} and ${viewers[1]}`
  return `${viewers.slice(0, -1).join(', ')} and ${viewers[viewers.length - 1]}`
}

// The real pre-built dashboard pinned by Exhibit C (Task 8), replacing
// Task 6's stub in place: a persistent list of dashboards (DashboardList,
// standing in for the mockup's tab strip now that its five tabs have
// become three separate dashboards), the currently open one's header,
// filters and panel grid below it, and the build-a-dashboard composer at
// the foot, exactly where Exhibit C's own .comp sits under its .dash.
export default function DashboardsPane() {
  const { desk } = useDemo()
  const [openId, setOpenId] = useState<string>('market')
  const [customDashboards, setCustomDashboards] = useState<Dashboard[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const [buildValue, setBuildValue] = useState('')
  const [buildQuery, setBuildQuery] = useState<string | null>(null)
  const [buildTurn, setBuildTurn] = useState(0)
  const [buildCollapsed, setBuildCollapsed] = useState(false)
  const [buildBusy, setBuildBusy] = useState(false)

  // A filter chosen on one dashboard (Banks, say) should not silently
  // carry over and narrow a different one opened straight after.
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [openId])

  const allDashboards = [...DASHBOARDS, ...customDashboards]
  const openDashboard = allDashboards.find((d) => d.id === openId) ?? allDashboards[0]
  const access = accessFor(desk, openDashboard.id)

  function submitBuild() {
    const q = buildValue.trim()
    if (!q || buildBusy) return
    setBuildValue('')
    setBuildQuery(q)
    setBuildTurn((n) => n + 1)
    setBuildCollapsed(false)
    setBuildBusy(true)
  }

  // Fires once ActivityFeed's own step sequence finishes revealing
  // "Composed 4 widgets": only then does the described request actually
  // become a fourth dashboard, appended to the list and opened, the same
  // "answer only after the feed lands" rule chat already follows.
  function handleBuildComplete() {
    if (!buildQuery) return
    const dashboard = buildDashboard(buildQuery)
    setCustomDashboards((prev) => [...prev, dashboard])
    setOpenId(dashboard.id)
    setBuildBusy(false)
  }

  return (
    <div className={styles.pane}>
      <DashboardList
        dashboards={allDashboards}
        openId={openDashboard.id}
        accessOf={(d) => accessFor(desk, d.id)}
        allowedDeskLabel={(d) => viewableDeskLabel(d.id)}
        onOpen={setOpenId}
      />

      <div className={styles.detail}>
        <DashboardHeader
          title={openDashboard.title}
          badge={openDashboard.badge}
          filters={filters}
          onFiltersChange={setFilters}
        />
        {access === 'locked' ? (
          <div className={styles.lockedWrap}>
            <LockedPanel allowedDeskLabel={viewableDeskLabel(openDashboard.id)} />
          </div>
        ) : (
          <div className={styles.grid}>
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

      <div className={styles.buildRow}>
        <div className={styles.buildBar}>
          <input
            type="text"
            className={styles.buildInput}
            aria-label="Describe a new dashboard"
            placeholder={'Or describe a new dashboard, for example “foreign buying and selling by sector this quarter”'}
            value={buildValue}
            disabled={buildBusy}
            onChange={(e) => setBuildValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitBuild()
              }
            }}
          />
          <button
            type="button"
            aria-label="Build dashboard"
            className={styles.buildSend}
            disabled={buildBusy || buildValue.trim().length === 0}
            onClick={submitBuild}
          >
            <span aria-hidden="true">&#8593;</span>
          </button>
        </div>
        {buildQuery && (
          <div className={styles.buildFeed}>
            <div className={styles.buildQuery}>&ldquo;{buildQuery}&rdquo;</div>
            <ActivityFeed
              key={buildTurn}
              steps={BUILD_STEPS}
              collapsed={buildCollapsed}
              onToggleCollapsed={() => setBuildCollapsed((c) => !c)}
              onComplete={handleBuildComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
}
