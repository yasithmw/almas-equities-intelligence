import { describe, it, expect } from 'vitest'
import {
  DASHBOARDS, DASHBOARD_SPECS, DEFAULT_FILTERS, buildDashboard, matchDashboardSpec,
  widgetCount, type DashSection,
} from './dashboards'
import { dashboardAccess } from './desks'

describe('dashboards', () => {
  it('ships exactly three', () => {
    expect(DASHBOARDS.map((d) => d.id)).toEqual(['market', 'clients', 'firm'])
  })

  it('titles them as the spec names them', () => {
    expect(DASHBOARDS.map((d) => d.title)).toEqual([
      'Market Overview', 'Client Book', 'Firm Performance',
    ])
  })

  // Fix round 2: Client Book and Firm Performance accepted a filters
  // argument but never varied their panels by it, so Sector/Period
  // rendered as live, clickable controls that did nothing on either.
  // Each dashboard now declares for itself whether Sector/Period can
  // change what it shows, which DashboardHeader reads to decide
  // whether to render FilterBar at all.
  it('declares filters only for Market Overview, not Client Book or Firm Performance', () => {
    expect(DASHBOARDS.map((d) => ({ id: d.id, usesFilters: d.usesFilters }))).toEqual([
      { id: 'market', usesFilters: true },
      { id: 'clients', usesFilters: false },
      { id: 'firm', usesFilters: false },
    ])
  })

  it('opens every dashboard with a KPI row first', () => {
    for (const d of DASHBOARDS) {
      const panels = d.panels('management', DEFAULT_FILTERS)
      expect(panels[0].body.kind).toBe('kpis')
      expect(panels[0].span).toBe(4)
    }
  })

  // The flat four-panel dashboard is gone: panels arrive grouped into
  // sections so a twelve-widget page still reads as an argument rather
  // than a wall. What has to hold is the grouping, not a fixed count.
  it('groups every dashboard into at least three titled sections', () => {
    for (const d of DASHBOARDS) {
      const sections = d.sections('management', DEFAULT_FILTERS)
      expect(sections.length).toBeGreaterThanOrEqual(3)
      for (const s of sections) {
        expect(s.title.length).toBeGreaterThan(0)
        expect(s.subtitle.length).toBeGreaterThan(0)
        expect(s.panels.length).toBeGreaterThan(0)
      }
    }
  })

  it('gives every section a unique id, and every panel within it one too', () => {
    for (const d of DASHBOARDS) {
      const sections = d.sections('management', DEFAULT_FILTERS)
      expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length)
      for (const s of sections) {
        expect(new Set(s.panels.map((p) => p.id)).size).toBe(s.panels.length)
      }
    }
  })

  // panels() is derived from sections(), never written alongside it: two
  // hand-maintained lists is exactly how a section gains a tile the flat
  // list never hears about.
  it('derives the flat panel list from the sections, losing nothing', () => {
    for (const d of DASHBOARDS) {
      const flat = d.panels('management', DEFAULT_FILTERS)
      const grouped = d.sections('management', DEFAULT_FILTERS).flatMap((s) => s.panels)
      expect(flat).toEqual(grouped)
    }
  })

  it('carries at least ten figures on every dashboard, for every desk that can open it', () => {
    for (const d of DASHBOARDS) {
      for (const desk of ['management', 'dealing', 'research'] as const) {
        expect(widgetCount(d, desk, DEFAULT_FILTERS)).toBeGreaterThanOrEqual(10)
      }
    }
  })

  // A KPI row is one panel holding three or four figures. A reader
  // counting tiles counts the figures, so the card's "N widgets" has to
  // as well, or it under-reports every dashboard by three.
  it('counts each KPI tile as a widget, not the row that holds them', () => {
    for (const d of DASHBOARDS) {
      const panels = d.panels('management', DEFAULT_FILTERS)
      const kpiTiles = panels
        .filter((p) => p.body.kind === 'kpis')
        .reduce((n, p) => n + (p.body.kind === 'kpis' ? p.body.tiles.length : 0), 0)
      const figures = panels.filter((p) => p.body.kind !== 'kpis').length
      expect(widgetCount(d, 'management', DEFAULT_FILTERS)).toBe(kpiTiles + figures)
    }
  })

  // A span wider than the grid has nowhere to go, and a donut whose parts
  // do not sum to anything is a decorative pie. Both are the kind of
  // thing a new panel gets wrong quietly.
  it('keeps every panel inside the four-column grid', () => {
    for (const d of DASHBOARDS) {
      for (const desk of ['management', 'dealing', 'research'] as const) {
        for (const p of d.panels(desk, DEFAULT_FILTERS)) {
          expect([1, 2, 3, 4]).toContain(p.span)
        }
      }
    }
  })

  it('narrows Market Overview when a sector filter is applied', () => {
    const market = DASHBOARDS.find((d) => d.id === 'market')!
    const all = market.panels('management', DEFAULT_FILTERS)
    const banks = market.panels('management', { ...DEFAULT_FILTERS, sector: 'Banks' })
    expect(JSON.stringify(banks)).not.toBe(JSON.stringify(all))
  })

  it('shrinks Client Book for the dealing desk', () => {
    const clients = DASHBOARDS.find((d) => d.id === 'clients')!
    const mgmt = JSON.stringify(clients.panels('management', DEFAULT_FILTERS))
    const dealer = JSON.stringify(clients.panels('dealing', DEFAULT_FILTERS))
    expect(dealer).not.toBe(mgmt)
  })

  it('withholds holder names from research in Client Book', () => {
    const clients = DASHBOARDS.find((d) => d.id === 'clients')!
    const research = JSON.stringify(clients.panels('research', DEFAULT_FILTERS))
    expect(research).toContain('Name withheld')
    expect(research).not.toContain('K. Wijesinghe')
  })

  // Fix round 2: nameMuted used to hardcode `desk === 'research'`, a
  // second source of truth for the same fact DashboardsPane's own
  // REDACTED tag already derives correctly from the access matrix
  // (accessFor(desk, 'clients') === 'redacted'). Every desk's mute flag
  // must come from that same matrix now, never a literal desk id, so
  // this checks all three desks, not only the one where the two
  // formulations happen to agree today.
  it('derives nameMuted from the access matrix, not a hardcoded desk id', () => {
    const clients = DASHBOARDS.find((d) => d.id === 'clients')!
    for (const desk of ['management', 'dealing', 'research'] as const) {
      const panel = clients.panels(desk, DEFAULT_FILTERS).find((p) => p.id === 'gainloss')!
      if (panel.body.kind !== 'movers') throw new Error('expected a movers panel')
      const expectMuted = dashboardAccess(desk, 'clients') === 'redacted'
      for (const row of panel.body.rows) expect(row.nameMuted).toBe(expectMuted)
    }
  })

  it('captions every chart on every dashboard, for every desk', () => {
    for (const d of DASHBOARDS) {
      for (const desk of ['management', 'dealing', 'research'] as const) {
        for (const p of d.panels(desk, DEFAULT_FILTERS)) {
          if (p.body.kind !== 'kpis') expect(p.body.caption.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('uses no em dash in any panel copy', () => {
    for (const d of DASHBOARDS) {
      expect(JSON.stringify(d.panels('management', DEFAULT_FILTERS)))
        .not.toContain('—')
    }
  })
})

// Fix round 1: buildDashboard() previously ignored which spec (if any)
// matched and always returned the same dashboard wearing the typed
// text as its title, so a request like "hotel sector exposure" got
// built as "Foreign buying and selling by sector" while quoting the
// hotel request back underneath. These lock in the fix: a real matcher
// (mirroring src/lib/match.ts's own approach), three real specs, and a
// null result for anything else.
describe('matchDashboardSpec', () => {
  it('ships exactly three specs', () => {
    expect(DASHBOARD_SPECS.map((s) => s.id)).toEqual([
      'foreign-by-sector', 'liquidity-by-counter', 'sector-valuation',
    ])
  })

  it('matches the foreign-by-sector spec from a natural phrasing', () => {
    const spec = matchDashboardSpec('foreign buying and selling by sector')
    expect(spec?.id).toBe('foreign-by-sector')
  })

  it('matches the liquidity spec from a natural phrasing', () => {
    const spec = matchDashboardSpec('show me liquidity by counter')
    expect(spec?.id).toBe('liquidity-by-counter')
  })

  it('matches the sector-valuation spec from a natural phrasing', () => {
    const spec = matchDashboardSpec('sector valuation')
    expect(spec?.id).toBe('sector-valuation')
  })

  it('returns null for an unrelated request, the exact case this fix targets', () => {
    expect(matchDashboardSpec('hotel sector exposure')).toBeNull()
    expect(matchDashboardSpec('what is the weather in Colombo')).toBeNull()
  })

  it('builds the dashboard the matched spec actually names, not a fixed default', () => {
    const liquidity = DASHBOARD_SPECS.find((s) => s.id === 'liquidity-by-counter')!
    const dashboard = buildDashboard(liquidity, 'liquidity by counter')
    expect(dashboard.title).toBe('Liquidity and turnover by counter')
    const panels = dashboard.panels('management', DEFAULT_FILTERS)
    expect(panels.length).toBeGreaterThan(4)
    expect(panels[0].body.kind).toBe('kpis')
  })

  // Fix round 2, extended beyond the two dashboards it named: none of
  // the three specs' panels() read a Filters argument either (they
  // take none), so a built dashboard declaring usesFilters would show
  // the same dead Sector/Period controls the fix removed from Client
  // Book and Firm Performance, just on a path the brief didn't name.
  it('declares no filters on a built dashboard either, since no spec varies by them', () => {
    for (const spec of DASHBOARD_SPECS) {
      expect(buildDashboard(spec, spec.text).usesFilters).toBe(false)
    }
  })

  it('gives each spec sections opening on a KPI row, same shape as the pre-built three', () => {
    for (const spec of DASHBOARD_SPECS) {
      const sections: DashSection[] = spec.sections()
      expect(sections.length).toBeGreaterThanOrEqual(2)
      expect(sections[0].panels[0].body.kind).toBe('kpis')
      expect(sections[0].panels[0].span).toBe(4)
      for (const s of sections) {
        expect(s.title.length).toBeGreaterThan(0)
        expect(s.subtitle.length).toBeGreaterThan(0)
      }
    }
  })

  it('captions every non-KPI panel and uses no em dash, for every spec', () => {
    for (const spec of DASHBOARD_SPECS) {
      const panels = spec.sections().flatMap((s) => s.panels)
      for (const p of panels) {
        if (p.body.kind !== 'kpis') expect(p.body.caption.length).toBeGreaterThan(0)
      }
      expect(JSON.stringify(panels)).not.toContain('—')
    }
  })
})
