import { describe, it, expect } from 'vitest'
import {
  TICKERS, INDEX_SERIES, ACCOUNTS, REVENUE,
  dividendYield, sectorPerformance, topMovers,
  foreignFlowByTicker, accountGain,
} from './dataset'

describe('dataset shape', () => {
  it('holds at least eighteen tickers, all CSE codes', () => {
    expect(TICKERS.length).toBeGreaterThanOrEqual(18)
    for (const t of TICKERS) {
      expect(t.code).toMatch(/^[A-Z]{3,5}$/)
      expect(t.price).toBeGreaterThan(0)
    }
  })

  it('includes the tickers the brief already names', () => {
    const codes = TICKERS.map((t) => t.code)
    for (const c of ['COMB', 'HNB', 'SAMP', 'NTB', 'JKH', 'DIAL', 'AHUN']) {
      expect(codes).toContain(c)
    }
  })

  it('carries thirty index sessions', () => {
    expect(INDEX_SERIES).toHaveLength(30)
    expect(INDEX_SERIES[0].session).toBe(1)
    expect(INDEX_SERIES[29].session).toBe(30)
  })

  it('carries twelve revenue months', () => {
    expect(REVENUE).toHaveLength(12)
  })

  it('includes A/C 10482 managed by R. Fernando', () => {
    const acct = ACCOUNTS.find((a) => a.id === 'A/C 10482')
    expect(acct).toBeDefined()
    expect(acct!.rm).toBe('R. Fernando')
    expect(acct!.holdings.length).toBeGreaterThan(0)
  })
})

describe('derivations', () => {
  it('derives dividend yield from dividend over price', () => {
    const comb = TICKERS.find((t) => t.code === 'COMB')!
    expect(dividendYield(comb)).toBeCloseTo((comb.dividend / comb.price) * 100, 6)
  })

  it('ranks banks by yield with COMB first', () => {
    const banks = TICKERS.filter((t) => t.sector === 'Banks')
      .sort((a, b) => dividendYield(b) - dividendYield(a))
    expect(banks[0].code).toBe('COMB')
  })

  it('averages sector performance from its members only', () => {
    const banks = TICKERS.filter((t) => t.sector === 'Banks')
    const expected = banks.reduce((s, t) => s + t.mtdPct, 0) / banks.length
    const row = sectorPerformance().find((s) => s.sector === 'Banks')!
    expect(row.mtdPct).toBeCloseTo(expected, 6)
  })

  it('returns movers sorted by absolute change, largest first', () => {
    const movers = topMovers(4)
    expect(movers).toHaveLength(4)
    for (let i = 1; i < movers.length; i += 1) {
      expect(Math.abs(movers[i - 1].mtdPct)).toBeGreaterThanOrEqual(
        Math.abs(movers[i].mtdPct),
      )
    }
  })

  it('splits foreign flow into buys and sells by sign', () => {
    const flow = foreignFlowByTicker()
    expect(flow.some((f) => f.foreignNetMn > 0)).toBe(true)
    expect(flow.some((f) => f.foreignNetMn < 0)).toBe(true)
  })

  it('computes account gain from live price against average cost', () => {
    const acct = ACCOUNTS.find((a) => a.id === 'A/C 10482')!
    const rows = accountGain(acct)
    const first = rows[0]
    const ticker = TICKERS.find((t) => t.code === first.code)!
    const holding = acct.holdings.find((h) => h.code === first.code)!
    expect(first.gainLkr).toBeCloseTo(
      (ticker.price - holding.avgCost) * holding.qty, 6,
    )
  })

  it('agrees with the yields Exhibit B prints', () => {
    const yields = Object.fromEntries(
      TICKERS.filter((t) => t.sector === 'Banks')
        .map((t) => [t.code, Number(dividendYield(t).toFixed(1))]),
    )
    expect(yields).toMatchObject({ COMB: 9.4, HNB: 8.1, SAMP: 6.8, NTB: 5.5 })
  })
})
