'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, LayoutDashboard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KpiSpec } from '@/lib/types'
import {
  DASHBOARDS, DASHBOARD_SPECS, DEFAULT_FILTERS, accessFor, buildDashboard,
  matchDashboardSpec, BUILD_STEPS,
  type Dashboard, type DashboardSpec, type Filters,
} from '@/lib/dashboards'
import { DESKS } from '@/lib/desks'
import { cn } from '@/lib/utils'
import { useDemo } from '../shell/DemoContext'
import ActivityFeed from '../chat/ActivityFeed'
import PanelCard from './PanelCard'
import VizBlock from './VizBlock'
import KpiTile from './KpiTile'
import DashboardHeader from './DashboardHeader'
import DashboardList from './DashboardList'
import LockedPanel from './LockedPanel'
import NoMatchPanel from './NoMatchPanel'

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
  const [customDashboards, setCustomDashboards] = useState<Dashboard[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const [buildValue, setBuildValue] = useState('')
  // A matched attempt carries the spec that matched, not just the raw
  // text, so the dashboard that eventually gets built is the one that
  // was actually recognised, never a fixed default wearing the typed
  // words as its description. An unmatched attempt carries no spec at
  // all and shows the same "here is what I can build" panel chat gives
  // for an unmatched question.
  const [buildAttempt, setBuildAttempt] = useState<{ query: string; spec: DashboardSpec } | null>(null)
  const [buildNoMatch, setBuildNoMatch] = useState(false)
  const [buildTurn, setBuildTurn] = useState(0)
  const [buildCollapsed, setBuildCollapsed] = useState(false)
  const [buildBusy, setBuildBusy] = useState(false)

  // A filter chosen on one dashboard should not silently carry over and
  // narrow a different one opened straight after.
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [openId])

  const allDashboards = [...DASHBOARDS, ...customDashboards]
  const openDashboard = openId ? allDashboards.find((d) => d.id === openId) ?? null : null

  function submitBuild(rawText?: string) {
    const q = (rawText ?? buildValue).trim()
    if (!q || buildBusy) return
    const spec = matchDashboardSpec(q)
    setBuildValue('')
    if (!spec) {
      setBuildNoMatch(true)
      setBuildAttempt(null)
      return
    }
    setBuildNoMatch(false)
    setBuildAttempt({ query: q, spec })
    setBuildTurn((n) => n + 1)
    setBuildCollapsed(false)
    setBuildBusy(true)
  }

  // A chip names a spec directly, so submitting its own canonical text
  // is guaranteed to match it: the exact-text pass in matchDashboardSpec
  // always wins over alias or fuzzy scoring.
  function pickSpec(spec: DashboardSpec) {
    if (buildBusy) return
    submitBuild(spec.text)
  }

  // Fires once ActivityFeed's own step sequence finishes revealing
  // "Composed 4 widgets": only then does the matched spec become a
  // fourth dashboard, appended to the list and opened, the same "answer
  // only after the feed lands" rule chat already follows.
  function handleBuildComplete() {
    if (!buildAttempt) return
    const dashboard = buildDashboard(buildAttempt.spec, buildAttempt.query)
    setCustomDashboards((prev) => [...prev, dashboard])
    setOpenId(dashboard.id)
    setBuildBusy(false)
  }

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
  const openable = allDashboards.filter((d) => accessFor(desk, d.id) !== 'locked').length

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
              {openable} of {allDashboards.length} open to this desk
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6 py-6">
          <DashboardList
            dashboards={allDashboards}
            accessOf={(d) => accessFor(desk, d.id)}
            allowedDeskLabel={(d) => viewableDeskLabel(d.id)}
            onOpen={setOpenId}
          />

          <section className="flex flex-col gap-3 border-t border-border/60 pt-7">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={2} />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                Build a dashboard
              </h2>
            </div>

            <div className="max-w-3xl">
              <div
                className={cn(
                  'prompt-box rounded-3xl border border-border/60 bg-card/80 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300',
                  'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/25',
                  buildBusy && 'opacity-80',
                )}
              >
                <label htmlFor="build-dashboard" className="sr-only">
                  Describe a new dashboard
                </label>
                <textarea
                  id="build-dashboard"
                  rows={1}
                  aria-label="Describe a new dashboard"
                  placeholder="Describe a new dashboard, for example “foreign buying and selling by sector this quarter”"
                  value={buildValue}
                  disabled={buildBusy}
                  onChange={(e) => setBuildValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitBuild()
                    }
                  }}
                  className="max-h-40 min-h-[30px] w-full resize-none bg-transparent px-3 pt-2 pb-1 text-[15px] leading-relaxed text-foreground outline-hidden placeholder:text-muted-foreground/50"
                />
                <div className="flex items-center justify-end px-1 pt-1">
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    aria-label="Build dashboard"
                    disabled={buildBusy || buildValue.trim().length === 0}
                    onClick={() => submitBuild()}
                    className={cn(
                      'h-8 w-8 rounded-full border-transparent transition-all duration-200',
                      buildValue.trim().length > 0
                        ? 'hover:brightness-95'
                        : 'bg-transparent text-muted-foreground/50',
                    )}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {buildNoMatch && (
                <div className="mt-3">
                  <NoMatchPanel specs={DASHBOARD_SPECS} onPick={pickSpec} disabled={buildBusy} />
                </div>
              )}

              {buildAttempt && (
                <div className="mt-3 flex flex-col items-start gap-2.5">
                  <div className="max-w-[min(100%,32rem)] rounded-2xl rounded-tr-lg bg-user-bubble px-4 py-3 text-sm leading-relaxed shadow-surface-sm [font-weight:380]"
                    style={{ color: 'hsl(var(--user-bubble-foreground))' }}
                  >
                    {buildAttempt.query}
                  </div>
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
          </section>
        </div>
      </div>
    </div>
  )
}
