import { describe, it, expect } from 'vitest'
import {
  DESKS, DEFAULT_DESK, dashboardAccess, visibleAccounts, maskHolder,
} from './desks'
import { ACCOUNTS } from './dataset'

describe('desks', () => {
  it('offers exactly three desks and defaults to management', () => {
    expect(DESKS.map((d) => d.id)).toEqual(['management', 'dealing', 'research'])
    expect(DEFAULT_DESK).toBe('management')
  })

  it('names the dealing desk R. Fernando, matching Exhibit B', () => {
    expect(DESKS.find((d) => d.id === 'dealing')!.person).toBe('R. Fernando')
  })
})

describe('dashboard access matrix', () => {
  it('gives management everything', () => {
    expect(dashboardAccess('management', 'market')).toBe('full')
    expect(dashboardAccess('management', 'clients')).toBe('full')
    expect(dashboardAccess('management', 'firm')).toBe('full')
  })

  it('rescopes clients and locks firm for dealing', () => {
    expect(dashboardAccess('dealing', 'market')).toBe('full')
    expect(dashboardAccess('dealing', 'clients')).toBe('rescoped')
    expect(dashboardAccess('dealing', 'firm')).toBe('locked')
  })

  it('redacts clients and locks firm for research', () => {
    expect(dashboardAccess('research', 'market')).toBe('full')
    expect(dashboardAccess('research', 'clients')).toBe('redacted')
    expect(dashboardAccess('research', 'firm')).toBe('locked')
  })

  it('produces all four access states across the matrix', () => {
    const states = new Set(
      (['management', 'dealing', 'research'] as const).flatMap((d) =>
        (['market', 'clients', 'firm'] as const).map((b) => dashboardAccess(d, b)),
      ),
    )
    expect(states).toEqual(new Set(['full', 'rescoped', 'redacted', 'locked']))
  })
})

describe('account scoping', () => {
  it('shows management every account', () => {
    expect(visibleAccounts('management')).toHaveLength(ACCOUNTS.length)
  })

  it('shows dealing only the accounts R. Fernando manages', () => {
    const seen = visibleAccounts('dealing')
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((a) => a.rm === 'R. Fernando')).toBe(true)
    expect(seen.length).toBeLessThan(ACCOUNTS.length)
  })

  it('shows research every account so aggregates are whole', () => {
    expect(visibleAccounts('research')).toHaveLength(ACCOUNTS.length)
  })

  it('masks holder names for research only', () => {
    const acct = ACCOUNTS[0]
    expect(maskHolder('management', acct)).toBe(acct.holder)
    expect(maskHolder('dealing', acct)).toBe(acct.holder)
    expect(maskHolder('research', acct)).toBe('Name withheld')
  })
})
