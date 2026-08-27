import { describe, it, expect } from 'vitest'
import { DASHBOARDS, DEFAULT_FILTERS } from './dashboards'

describe('dashboards', () => {
  it('ships exactly three', () => {
    expect(DASHBOARDS.map((d) => d.id)).toEqual(['market', 'clients', 'firm'])
  })

  it('titles them as the spec names them', () => {
    expect(DASHBOARDS.map((d) => d.title)).toEqual([
      'Market Overview', 'Client Book', 'Firm Performance',
    ])
  })

  it('opens every dashboard with a KPI row first', () => {
    for (const d of DASHBOARDS) {
      const panels = d.panels('management', DEFAULT_FILTERS)
      expect(panels[0].body.kind).toBe('kpis')
      expect(panels[0].span).toBe(4)
    }
  })

  it('gives each dashboard a KPI row plus three panels', () => {
    for (const d of DASHBOARDS) {
      expect(d.panels('management', DEFAULT_FILTERS)).toHaveLength(4)
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
