import type { Access, DeskId, KpiSpec, PanelBody, Sector, Step } from './types'
import {
  TICKERS, ACCOUNTS, INDEX_SERIES, REVENUE,
  sectorPerformance, accountGain, foreignFlowByTicker,
} from './dataset'
import {
  dashboardAccess, visibleAccounts, maskHolder, type DashboardId,
} from './desks'
import { revenueVsTurnover } from './answers'

// ---------------------------------------------------------------------------
// Filters. Sector and Period are real, working controls (Ruling R7): every
// number below that can honestly change with them does.
// ---------------------------------------------------------------------------

export interface Filters {
  sector: Sector | 'All'
  period: 'MTD' | 'QTD' | 'YTD'
}

// Ruling R6.
export const DEFAULT_FILTERS: Filters = { sector: 'All', period: 'MTD' }

// ---------------------------------------------------------------------------
// The movers gap (a gap carried from Task 4, ruling 7 in the task brief).
// No existing primitive renders "label plus signed coloured value, with no
// bar", which is exactly Exhibit C's .mv / .tk / .g / .r. Rather than add a
// new member to lib/types.ts's closed Viz union (out of scope: this file is
// the one permitted change inside src/lib/), MoversViz is defined here and
// VizBlock.tsx (a components/dash file, which Ruling 7 explicitly says is
// mine to extend) imports it to widen the one prop it accepts. This keeps
// the dependency direction the ordinary way round: components import types
// from lib, lib never imports from components.
//
// One row shape serves two panels that are the same underlying idea, "a
// label plus a signed coloured value, no bar": Market Overview's top
// movers (label = ticker) and Client Book's unrealised gain and loss
// (label = account id, with an optional second, maskable line for the
// holder's name).
// ---------------------------------------------------------------------------

export interface MoversRow {
  code: string
  name?: string
  nameMuted?: boolean
  value: number
  display: string
}

export interface MoversViz {
  kind: 'movers'
  title: string
  rows: MoversRow[]
  source: string
  caption: string
}

export type DashPanel = { id: string; span: 1 | 2 | 4; body: PanelBody | MoversViz }

export interface Dashboard {
  id: string
  title: string
  badge: string
  description: string
  panels: (desk: DeskId, filters: Filters) => DashPanel[]
}

// dashboardAccess/its MATRIX (desks.ts) is keyed only by the three pinned
// ids. A dashboard built through "describe a new dashboard" carries no
// entry there, and was never asked to carry desk scoping of its own, so it
// stays open to whoever just built it in this session.
const KNOWN_IDS: DashboardId[] = ['market', 'clients', 'firm']
export function accessFor(desk: DeskId, dashboardId: string): Access {
  return (KNOWN_IDS as string[]).includes(dashboardId)
    ? dashboardAccess(desk, dashboardId as DashboardId)
    : 'full'
}

// ---------------------------------------------------------------------------
// Formatting helpers, local to this file. Small and one-way (rupees,
// percentages); the one thing Ruling 8 requires shared, the q06 chart
// itself, is imported rather than rebuilt (see revenueVsTurnover below).
// ---------------------------------------------------------------------------

// Screenshot review: a KPI like Foreign net rendered as "+Rs 346.0M",
// a trailing ".0" the client's own KPI row never carries ("+Rs 412M").
// One decimal place still matters for the smaller, sub-10 figures
// (Client Book's AUM, a few million), so the digit is dropped only
// when it is exactly zero, never rounded away for anything else.
function trimZero(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s
}
function fmtRsM(mn: number): string {
  if (Math.abs(mn) >= 1000) return `Rs ${trimZero((mn / 1000).toFixed(1))}B`
  return `Rs ${trimZero(mn.toFixed(1))}M`
}
function fmtSignedRsM(mn: number): string {
  const sign = mn < 0 ? '−' : '+'
  return `${sign}${fmtRsM(Math.abs(mn))}`
}
function fmtSignedRsFull(n: number): string {
  const sign = n < 0 ? '−' : '+'
  return `${sign}Rs ${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}
function fmtSignedPct(n: number): string {
  const sign = n < 0 ? '−' : '+'
  return `${sign}${Math.abs(n).toFixed(1)}%`
}

function exposureOf(holdings: { code: string; qty: number }[]): { code: string; value: number }[] {
  return holdings.map((h) => {
    const ticker = TICKERS.find((t) => t.code === h.code)!
    return { code: h.code, value: h.qty * ticker.price }
  })
}

// A single, shared definition of "concentrated": more than half a book (or
// a firm's allocated revenue) sitting in one name. Reused by Client Book's
// concentration flags and Firm Performance's revenue concentration so the
// two panels mean the same thing by "flagged".
const CONCENTRATION_THRESHOLD_PCT = 50

// ---------------------------------------------------------------------------
// Market Overview
// ---------------------------------------------------------------------------

function marketPanels(_desk: DeskId, filters: Filters): DashPanel[] {
  const pool = filters.sector === 'All'
    ? TICKERS
    : TICKERS.filter((t) => t.sector === filters.sector)

  // The index itself (ASPI/SL20) is a market-wide figure a sector filter
  // cannot narrow; Period windows how much of its 30-session history the
  // line panel shows, which is a real slice of INDEX_SERIES, not an
  // invented figure the dataset does not carry.
  const windowLen = filters.period === 'MTD' ? 10 : filters.period === 'QTD' ? 20 : 30
  const sessionWindow = INDEX_SERIES.slice(-windowLen)
  const latest = INDEX_SERIES[INDEX_SERIES.length - 1]
  const prevSession = INDEX_SERIES[INDEX_SERIES.length - 2]
  const aspiDeltaPct = ((latest.aspi - prevSession.aspi) / prevSession.aspi) * 100
  const sl20DeltaPct = ((latest.sl20 - prevSession.sl20) / prevSession.sl20) * 100

  const turnoverMn = pool.reduce((s, t) => s + t.turnoverMn, 0)
  const foreignNetMn = pool.reduce((s, t) => s + t.foreignNetMn, 0)
  const buyers = pool.filter((t) => t.foreignNetMn > 0).length

  const kpis: KpiSpec[] = [
    {
      label: 'ASPI',
      value: latest.aspi.toLocaleString('en-US'),
      delta: `${fmtPct(Math.abs(aspiDeltaPct))} latest session`,
      dir: aspiDeltaPct > 0 ? 'up' : aspiDeltaPct < 0 ? 'down' : 'flat',
    },
    {
      label: 'S&P SL20',
      value: latest.sl20.toLocaleString('en-US'),
      delta: `${fmtPct(Math.abs(sl20DeltaPct))} latest session`,
      dir: sl20DeltaPct > 0 ? 'up' : sl20DeltaPct < 0 ? 'down' : 'flat',
    },
    {
      label: 'Turnover',
      value: fmtRsM(turnoverMn),
      delta: `across ${pool.length} counter${pool.length === 1 ? '' : 's'}`,
    },
    // Ruling R14: the value carries the colour, matching Exhibit C's
    // inline style on .kv, not just the delta line below it.
    {
      label: 'Foreign net',
      value: fmtSignedRsM(foreignNetMn),
      valueDir: foreignNetMn >= 0 ? 'up' : 'down',
      dir: foreignNetMn >= 0 ? 'up' : 'down',
      delta: `${buyers} of ${pool.length} counters net buying`,
    },
  ]

  const sectorRows = filters.sector === 'All'
    ? sectorPerformance()
    : sectorPerformance().filter((s) => s.sector === filters.sector)

  const movers = [...pool]
    .sort((a, b) => Math.abs(b.mtdPct) - Math.abs(a.mtdPct))
    .slice(0, 4)

  return [
    { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
    {
      id: 'index',
      span: 2,
      body: {
        kind: 'line',
        title: `ASPI and S&P SL20, last ${sessionWindow.length} sessions`,
        xLabels: sessionWindow.map((p) => String(p.session)),
        series: [
          { name: 'ASPI', points: sessionWindow.map((p) => p.aspi), accent: 'var(--blue)' },
          { name: 'S&P SL20', points: sessionWindow.map((p) => p.sl20), accent: 'var(--blue-2)' },
        ],
        source: 'Source: your market data',
        caption: 'Illustrative values',
      },
    },
    {
      id: 'sectors',
      span: 1,
      body: {
        kind: 'signedBars',
        title: filters.sector === 'All'
          ? 'Sector performance'
          : `Sector performance, ${filters.sector}`,
        rows: sectorRows.map((s) => ({
          label: s.sector, value: s.mtdPct, display: fmtSignedPct(s.mtdPct),
        })),
        source: 'Source: your market data',
        caption: 'Month to date, illustrative values',
      },
    },
    {
      id: 'movers',
      span: 1,
      body: {
        kind: 'movers',
        title: filters.sector === 'All' ? 'Top movers' : `Top movers, ${filters.sector}`,
        rows: movers.map((t) => ({
          code: t.code, value: t.mtdPct, display: fmtSignedPct(t.mtdPct),
        })),
        source: 'Source: your market data',
        caption: 'Illustrative values',
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Client Book
// ---------------------------------------------------------------------------

function clientsPanels(desk: DeskId, _filters: Filters): DashPanel[] {
  const accounts = visibleAccounts(desk)

  const aumByAccountId = new Map(
    ACCOUNTS.map((a) => [a.id, exposureOf(a.holdings).reduce((s, r) => s + r.value, 0)]),
  )
  const totalAumMn = [...aumByAccountId.values()].reduce((s, v) => s + v, 0) / 1_000_000
  const visibleAumMn = accounts.reduce((s, a) => s + (aumByAccountId.get(a.id) ?? 0), 0) / 1_000_000

  const latestRevenueMn = REVENUE[REVENUE.length - 1].revenueMn
  // The dataset's whole client book is exactly these accounts, so
  // management and research (who see every account) get the firm's real
  // latest-month revenue unscaled. Dealing sees only its own book, so its
  // brokerage figure is that book's real share of total AUM applied to
  // the same real revenue number, not a separate invented figure.
  const brokerageMn = totalAumMn > 0 ? latestRevenueMn * (visibleAumMn / totalAumMn) : 0

  const kpis: KpiSpec[] = [
    { label: 'AUM', value: fmtRsM(visibleAumMn) },
    { label: 'Active accounts', value: String(accounts.length) },
    { label: 'MTD brokerage', value: fmtRsM(brokerageMn) },
  ]

  const exposureByTicker = new Map<string, number>()
  for (const a of accounts) {
    for (const r of exposureOf(a.holdings)) {
      exposureByTicker.set(r.code, (exposureByTicker.get(r.code) ?? 0) + r.value)
    }
  }
  const exposureRows = [...exposureByTicker.entries()].sort((a, b) => b[1] - a[1])

  const concentrationRows = accounts.map((a) => {
    const rows = exposureOf(a.holdings)
    const total = rows.reduce((s, r) => s + r.value, 0)
    const top = [...rows].sort((r1, r2) => r2.value - r1.value)[0]
    const sharePct = total > 0 ? (top.value / total) * 100 : 0
    const flag = sharePct > CONCENTRATION_THRESHOLD_PCT ? 'High' : 'OK'
    return [a.id, top.code, fmtPct(sharePct), flag]
  })

  const gainRows: MoversRow[] = accounts.map((a) => {
    const totalGain = accountGain(a).reduce((s, g) => s + g.gainLkr, 0)
    return {
      code: a.id,
      name: maskHolder(desk, a),
      nameMuted: desk === 'research',
      value: totalGain,
      display: fmtSignedRsFull(totalGain),
    }
  })

  return [
    { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
    {
      id: 'exposure',
      span: 2,
      body: {
        kind: 'bars',
        title: 'Holdings by exposure',
        rows: exposureRows.map(([code, value]) => ({
          label: code, value, display: fmtRsM(value / 1_000_000),
        })),
        source: 'Source: your client records',
        caption: 'Current market value, illustrative values',
      },
    },
    {
      id: 'concentration',
      span: 1,
      body: {
        kind: 'table',
        title: 'Concentration flags',
        columns: ['Account', 'Largest holding', 'Share', 'Flag'],
        rows: concentrationRows,
        source: 'Source: your client records',
        caption: `Flagged above ${CONCENTRATION_THRESHOLD_PCT}% in one holding`,
      },
    },
    {
      id: 'gainloss',
      span: 1,
      body: {
        kind: 'movers',
        title: 'Unrealised gain and loss',
        rows: gainRows,
        source: 'Source: your client records',
        caption: 'Illustrative values',
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Firm Performance
// ---------------------------------------------------------------------------

function firmPanels(_desk: DeskId, _filters: Filters): DashPanel[] {
  const latest = REVENUE[REVENUE.length - 1]
  const activeAccounts = ACCOUNTS.length
  const revenuePerAccountMn = latest.revenueMn / activeAccounts
  // The dataset carries no account-opened date, so there is no evidence
  // of any account newer than the two on file: reporting zero is the
  // honest count, not an invented one.
  const newAccountsMtd = 0

  const kpis: KpiSpec[] = [
    { label: 'MTD brokerage revenue', value: fmtRsM(latest.revenueMn) },
    { label: 'Revenue per active account', value: fmtRsM(revenuePerAccountMn) },
    { label: 'Active accounts', value: String(activeAccounts) },
    { label: 'New accounts MTD', value: String(newAccountsMtd), delta: 'None opened this period' },
  ]

  // Same proportional-allocation technique as Client Book's MTD brokerage
  // KPI: the dataset has no revenue-by-desk series, but it does have a
  // real relationship manager on every account, so the firm's one real
  // monthly revenue figure is split by each RM's real share of book AUM.
  const aumByRm = new Map<string, number>()
  for (const a of ACCOUNTS) {
    const aum = exposureOf(a.holdings).reduce((s, r) => s + r.value, 0)
    aumByRm.set(a.rm, (aumByRm.get(a.rm) ?? 0) + aum)
  }
  const totalAum = [...aumByRm.values()].reduce((s, v) => s + v, 0)
  const byRm = [...aumByRm.entries()]
    .map(([rm, aum]) => {
      const sharePct = totalAum > 0 ? (aum / totalAum) * 100 : 0
      return { rm, sharePct, revenueMn: (sharePct / 100) * latest.revenueMn }
    })
    .sort((a, b) => b.revenueMn - a.revenueMn)

  return [
    { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
    // Ruling 8: the exact chart q06 returns, imported rather than rebuilt.
    { id: 'revenue-turnover', span: 2, body: revenueVsTurnover() },
    {
      id: 'revenue-desk',
      span: 1,
      body: {
        kind: 'bars',
        title: 'Revenue by desk',
        rows: byRm.map((r) => ({ label: r.rm, value: r.revenueMn, display: fmtRsM(r.revenueMn) })),
        source: 'Source: your brokerage ledger',
        caption: 'Allocated by book size, illustrative values',
      },
    },
    {
      id: 'concentration',
      span: 1,
      body: {
        kind: 'table',
        title: 'Revenue concentration',
        columns: ['Desk', 'Revenue share', 'Flag'],
        rows: byRm.map((r) => [
          r.rm, fmtPct(r.sharePct), r.sharePct > CONCENTRATION_THRESHOLD_PCT ? 'High' : 'OK',
        ]),
        source: 'Source: your brokerage ledger',
        caption: `Flagged above ${CONCENTRATION_THRESHOLD_PCT}% from one desk`,
      },
    },
  ]
}

const MARKET: Dashboard = {
  id: 'market',
  title: 'Market Overview',
  badge: 'Pre-built',
  description: 'Index levels, sector performance and the biggest movers, market-wide.',
  panels: marketPanels,
}
const CLIENTS: Dashboard = {
  id: 'clients',
  title: 'Client Book',
  badge: 'Pre-built',
  description: 'Holdings, concentration and unrealised gain across your visible accounts.',
  panels: clientsPanels,
}
const FIRM: Dashboard = {
  id: 'firm',
  title: 'Firm Performance',
  badge: 'Pre-built',
  description: 'Brokerage revenue against turnover, by desk, and its concentration.',
  panels: firmPanels,
}

export const DASHBOARDS: Dashboard[] = [MARKET, CLIENTS, FIRM]

// ---------------------------------------------------------------------------
// Build a dashboard. Exhibit C's own composer placeholder names this exact
// example ("foreign buying and selling by sector this quarter"), and
// Foreign Flows was deliberately left out of the pre-built three, so this
// is the one description this scripted demo composes: every figure below
// is still derived fresh from TICKERS, the same rule as the pre-built
// three, never a canned chart.
// ---------------------------------------------------------------------------

export const BUILD_STEPS: Step[] = [
  { label: 'Parsed the request', ms: 260 },
  { label: 'Planned 4 widgets', ms: 420 },
  { label: 'Queried foreign flow by sector', ms: 640 },
  { label: 'Composed 4 widgets', ms: 460 },
]

function foreignBySectorPanels(): DashPanel[] {
  const bySector = new Map<Sector, { net: number; buys: number; sells: number }>()
  for (const t of TICKERS) {
    const entry = bySector.get(t.sector) ?? { net: 0, buys: 0, sells: 0 }
    entry.net += t.foreignNetMn
    if (t.foreignNetMn > 0) entry.buys += 1
    else if (t.foreignNetMn < 0) entry.sells += 1
    bySector.set(t.sector, entry)
  }
  const sectorRows = [...bySector.entries()].sort((a, b) => b[1].net - a[1].net)
  const totalNet = TICKERS.reduce((s, t) => s + t.foreignNetMn, 0)
  const buyers = TICKERS.filter((t) => t.foreignNetMn > 0).length
  const sellers = TICKERS.filter((t) => t.foreignNetMn < 0).length
  const byTicker = foreignFlowByTicker()
  const topBuy = byTicker[0]
  const topSell = byTicker[byTicker.length - 1]

  const kpis: KpiSpec[] = [
    { label: 'Foreign net', value: fmtSignedRsM(totalNet), valueDir: totalNet >= 0 ? 'up' : 'down' },
    { label: 'Counters buying', value: String(buyers) },
    { label: 'Counters selling', value: String(sellers) },
    { label: 'Leading sector', value: sectorRows[0][0] },
  ]

  return [
    { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
    {
      id: 'sector-flow',
      span: 2,
      body: {
        kind: 'signedBars',
        title: 'Foreign net by sector',
        rows: sectorRows.map(([sector, v]) => ({
          label: sector, value: v.net, display: fmtSignedRsM(v.net),
        })),
        source: 'Source: your market data',
        caption: 'This quarter, illustrative values',
      },
    },
    {
      id: 'ticker-flow',
      span: 1,
      body: {
        kind: 'movers',
        title: 'Largest foreign flows',
        rows: [topBuy, topSell].map((t) => ({
          code: t.code, value: t.foreignNetMn, display: fmtSignedRsM(t.foreignNetMn),
        })),
        source: 'Source: your market data',
        caption: 'Illustrative values',
      },
    },
    {
      id: 'sector-counts',
      span: 1,
      body: {
        kind: 'table',
        title: 'Buying and selling counters, by sector',
        columns: ['Sector', 'Buying', 'Selling'],
        rows: sectorRows.map(([sector, v]) => [sector, String(v.buys), String(v.sells)]),
        source: 'Source: your market data',
        caption: 'Illustrative values',
      },
    },
  ]
}

export function buildDashboard(query: string): Dashboard {
  return {
    id: `custom-${Date.now()}`,
    title: 'Foreign buying and selling by sector',
    badge: 'Custom',
    description: query,
    panels: foreignBySectorPanels,
  }
}
