import type {
  Account, IndexPoint, RevenueMonth, Sector, Ticker,
} from './types'

export const TICKERS: Ticker[] = [
  { code: 'COMB', name: 'Commercial Bank of Ceylon', sector: 'Banks', price: 106.0, mtdPct: 4.8, dividend: 9.96, pe: 6.4, turnoverMn: 412, foreignNetMn: 96 },
  { code: 'HNB', name: 'Hatton National Bank', sector: 'Banks', price: 198.0, mtdPct: 2.6, dividend: 16.04, pe: 5.9, turnoverMn: 288, foreignNetMn: 61 },
  { code: 'SAMP', name: 'Sampath Bank', sector: 'Banks', price: 79.5, mtdPct: 1.7, dividend: 5.41, pe: 6.8, turnoverMn: 231, foreignNetMn: 34 },
  { code: 'NTB', name: 'Nations Trust Bank', sector: 'Banks', price: 142.0, mtdPct: 0.9, dividend: 7.81, pe: 5.2, turnoverMn: 118, foreignNetMn: -12 },
  // Diversified
  { code: 'JKH', name: 'John Keells Holdings', sector: 'Diversified', price: 189.25, mtdPct: 3.2, dividend: 4.5, pe: 22.4, turnoverMn: 356, foreignNetMn: 142 },
  { code: 'HAYL', name: 'Hayleys', sector: 'Diversified', price: 98.0, mtdPct: -1.4, dividend: 3.0, pe: 9.1, turnoverMn: 64, foreignNetMn: -18 },
  { code: 'MELS', name: 'Melstacorp', sector: 'Diversified', price: 74.25, mtdPct: 2.1, dividend: 2.25, pe: 10.8, turnoverMn: 51, foreignNetMn: 9 },
  { code: 'VONE', name: 'Vallibel One', sector: 'Diversified', price: 58.5, mtdPct: -0.6, dividend: 1.6, pe: 7.9, turnoverMn: 22, foreignNetMn: -4 },
  // Telco
  { code: 'DIAL', name: 'Dialog Axiata', sector: 'Telco', price: 13.8, mtdPct: 3.5, dividend: 0.35, pe: 13.0, turnoverMn: 210, foreignNetMn: 27 },
  { code: 'SLTL', name: 'Sri Lanka Telecom', sector: 'Telco', price: 24.0, mtdPct: -0.8, dividend: 1.0, pe: 8.5, turnoverMn: 18, foreignNetMn: -6 },
  // Hotels
  { code: 'AHUN', name: 'Aitken Spence Hotel Holdings', sector: 'Hotels', price: 89.0, mtdPct: 6.5, dividend: 1.5, pe: 15.2, turnoverMn: 34, foreignNetMn: 11 },
  { code: 'KHL', name: 'Keells Hotels', sector: 'Hotels', price: 15.8, mtdPct: 4.1, dividend: 0.4, pe: 18.6, turnoverMn: 12, foreignNetMn: 3 },
  { code: 'JETS', name: 'Jetwing Symphony', sector: 'Hotels', price: 11.2, mtdPct: 8.9, dividend: 0.2, pe: 21.0, turnoverMn: 9, foreignNetMn: 2 },
  // Manufacturing
  { code: 'TKYO', name: 'Tokyo Cement Company (Lanka)', sector: 'Manufacturing', price: 62.0, mtdPct: -2.3, dividend: 2.5, pe: 7.2, turnoverMn: 28, foreignNetMn: -5 },
  { code: 'RCL', name: 'Royal Ceramics Lanka', sector: 'Manufacturing', price: 33.5, mtdPct: 1.0, dividend: 1.2, pe: 9.4, turnoverMn: 19, foreignNetMn: 1 },
  { code: 'ACL', name: 'ACL Cables', sector: 'Manufacturing', price: 88.0, mtdPct: -0.4, dividend: 3.0, pe: 8.0, turnoverMn: 14, foreignNetMn: -2 },
  // Insurance
  { code: 'CINS', name: 'Ceylinco Insurance', sector: 'Insurance', price: 1180.0, mtdPct: 1.8, dividend: 30.0, pe: 5.1, turnoverMn: 42, foreignNetMn: 6 },
  { code: 'AAIC', name: 'Asian Alliance Insurance', sector: 'Insurance', price: 62.0, mtdPct: 0.6, dividend: 2.8, pe: 7.6, turnoverMn: 11, foreignNetMn: -1 },
  { code: 'UAL', name: 'Union Assurance', sector: 'Insurance', price: 38.5, mtdPct: 1.3, dividend: 1.4, pe: 9.8, turnoverMn: 8, foreignNetMn: 2 },
]

export const INDEX_SERIES: IndexPoint[] = Array.from({ length: 30 }, (_, i) => ({
  session: i + 1,
  // rising overall with realistic chop, matching Exhibit C's upward sparkline
  aspi: Math.round(15480 + i * 26 + Math.sin(i / 2.1) * 68),
  sl20: Math.round(4680 + i * 8.4 + Math.sin(i / 2.6) * 22),
}))

export const ACCOUNTS: Account[] = [
  {
    id: 'A/C 10482',
    holder: 'K. Wijesinghe',
    rm: 'R. Fernando',
    holdings: [
      { code: 'COMB', qty: 12000, avgCost: 91.5 },
      { code: 'JKH', qty: 8000, avgCost: 188.0 },
      { code: 'DIAL', qty: 25000, avgCost: 12.4 },
    ],
  },
  {
    id: 'A/C 11907',
    holder: 'S. Rajapakse',
    rm: 'D. Silva',
    holdings: [
      { code: 'HNB', qty: 4500, avgCost: 176.0 },
      { code: 'AHUN', qty: 15000, avgCost: 74.0 },
    ],
  },
]

export const REVENUE: RevenueMonth[] = [
  { month: 'Sep', revenueMn: 61.2, turnoverBn: 2.4 },
  { month: 'Oct', revenueMn: 64.8, turnoverBn: 2.6 },
  { month: 'Nov', revenueMn: 68.1, turnoverBn: 2.7 },
  { month: 'Dec', revenueMn: 74.5, turnoverBn: 3.0 },
  { month: 'Jan', revenueMn: 70.2, turnoverBn: 2.8 },
  { month: 'Feb', revenueMn: 72.6, turnoverBn: 2.9 },
  { month: 'Mar', revenueMn: 78.4, turnoverBn: 3.1 },
  { month: 'Apr', revenueMn: 81.9, turnoverBn: 3.3 },
  { month: 'May', revenueMn: 79.7, turnoverBn: 3.2 },
  { month: 'Jun', revenueMn: 85.3, turnoverBn: 3.4 },
  { month: 'Jul', revenueMn: 88.6, turnoverBn: 3.6 },
  { month: 'Aug', revenueMn: 92.1, turnoverBn: 3.7 },
]

export function dividendYield(t: Ticker): number {
  return (t.dividend / t.price) * 100
}

export function sectorPerformance(): { sector: Sector; mtdPct: number }[] {
  const groups = new Map<Sector, Ticker[]>()
  for (const t of TICKERS) {
    const list = groups.get(t.sector) ?? []
    list.push(t)
    groups.set(t.sector, list)
  }
  return [...groups.entries()]
    .map(([sector, members]) => ({
      sector,
      mtdPct: members.reduce((s, t) => s + t.mtdPct, 0) / members.length,
    }))
    .sort((a, b) => b.mtdPct - a.mtdPct)
}

export function topMovers(count: number): Ticker[] {
  return [...TICKERS]
    .sort((a, b) => Math.abs(b.mtdPct) - Math.abs(a.mtdPct))
    .slice(0, count)
}

export function foreignFlowByTicker(): Ticker[] {
  return [...TICKERS].sort((a, b) => b.foreignNetMn - a.foreignNetMn)
}

export function accountGain(account: Account) {
  return account.holdings.map((h) => {
    const ticker = TICKERS.find((t) => t.code === h.code)!
    return {
      code: h.code,
      qty: h.qty,
      avgCost: h.avgCost,
      price: ticker.price,
      gainLkr: (ticker.price - h.avgCost) * h.qty,
      gainPct: ((ticker.price - h.avgCost) / h.avgCost) * 100,
    }
  })
}
