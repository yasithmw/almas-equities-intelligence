import type {
  Access, DeskId, KpiSpec, MoversRow, PanelBody, Sector, Step,
} from './types'
import {
  TICKERS, ACCOUNTS, INDEX_SERIES, REVENUE,
  sectorPerformance, accountGain, foreignFlowByTicker, dividendYield,
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
// Shape
//
// A dashboard used to be a flat list of four panels, which is exactly the
// number a flat list can carry before it stops being read and starts
// being scanned. Panels now arrive grouped into sections, each stating
// the question its tiles answer, so a thirteen-widget page still reads
// top to bottom as an argument: where the market stands, what moved,
// what it is worth.
//
// MoversRow/MoversViz live in lib/types.ts as members of the Viz union
// (fix round 2). They were originally defined here instead, to avoid
// touching lib/types.ts under Task 8's original constraint, which
// inverted the usual dependency direction: VizBlock.tsx, a shared
// primitive, had to import a type from this feature module to widen its
// own prop. One row shape still serves two panels that are the same
// underlying idea, "a label plus a signed coloured value, no bar":
// Market Overview's top movers (label = ticker) and Client Book's
// unrealised gain and loss (label = account id, with an optional second,
// maskable line for the holder's name).
// ---------------------------------------------------------------------------

export type DashPanel = { id: string; span: 1 | 2 | 3 | 4; body: PanelBody }

export interface DashSection {
  id: string
  title: string
  // One line saying what this group of tiles is for. Rendered under the
  // section title, so it has to survive truncation at a narrow width:
  // front-load the noun.
  subtitle: string
  panels: DashPanel[]
}

export interface Dashboard {
  id: string
  title: string
  badge: string
  description: string
  // Fix round 2: Client Book and Firm Performance accepted a filters
  // argument but never varied their panels by it, so FilterBar rendered
  // live, clickable Sector/Period controls that did nothing on either.
  // Each dashboard now declares for itself whether Sector/Period can
  // change what it shows; DashboardHeader renders FilterBar only when
  // this is true, instead of unconditionally for every dashboard.
  usesFilters: boolean
  sections: (desk: DeskId, filters: Filters) => DashSection[]
  // Derived from sections, never written by hand: the flat panel list a
  // caller wants when it does not care about grouping. Two independent
  // definitions of "this dashboard's panels" is exactly how a section
  // gains a tile the flat list never hears about.
  panels: (desk: DeskId, filters: Filters) => DashPanel[]
}

function defineDashboard(spec: Omit<Dashboard, 'panels'>): Dashboard {
  return {
    ...spec,
    panels: (desk, filters) => spec.sections(desk, filters).flatMap((s) => s.panels),
  }
}

// What the landing card means by "N widgets".
//
// A KPI row is one panel carrying three or four separate figures, and a
// reader counting tiles on the page counts those figures, not the row
// that holds them. Counting panels would report thirteen widgets as ten.
export function widgetCount(
  dashboard: Dashboard, desk: DeskId, filters: Filters,
): number {
  return dashboard
    .panels(desk, filters)
    .reduce((n, p) => n + (p.body.kind === 'kpis' ? p.body.tiles.length : 1), 0)
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
function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
function fmtQty(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}
function fmtPrice(n: number): string {
  return `Rs ${n.toFixed(2)}`
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

// Every figure on the surface carries the same two-line provenance: where
// the number came from, and that it is illustrative. Naming the strings
// once keeps a new tile from inventing a sixth phrasing of "Source:".
const SRC_MARKET = 'Source: your market data'
const SRC_CLIENTS = 'Source: your client records'
const SRC_LEDGER = 'Source: your brokerage ledger'
const ILLUSTRATIVE = 'Illustrative values'

// ---------------------------------------------------------------------------
// Market Overview
// ---------------------------------------------------------------------------

function marketSections(_desk: DeskId, filters: Filters): DashSection[] {
  const narrowed = filters.sector !== 'All'
  const pool = narrowed ? TICKERS.filter((t) => t.sector === filters.sector) : TICKERS

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
      delta: `across ${plural(pool.length, 'counter', 'counters')}`,
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

  // Breadth: the count of counters moving each way. A ring is the honest
  // drawing because the three parts really do sum to the pool, which is
  // the figure sitting in the middle of it.
  const advancing = pool.filter((t) => t.mtdPct > 0).length
  const declining = pool.filter((t) => t.mtdPct < 0).length
  const unchanged = pool.length - advancing - declining

  const sectorRows = narrowed
    ? sectorPerformance().filter((s) => s.sector === filters.sector)
    : sectorPerformance()

  const movers = [...pool]
    .sort((a, b) => Math.abs(b.mtdPct) - Math.abs(a.mtdPct))
    .slice(0, 5)

  // Turnover and foreign flow both roll up by sector while the whole
  // market is in view. Once one sector is selected that roll-up would be
  // a single bar restating a KPI, so both drop to the counters inside
  // that sector, which is the level the reader has just asked for.
  const turnoverRows = narrowed
    ? [...pool]
      .sort((a, b) => b.turnoverMn - a.turnoverMn)
      .map((t) => ({ label: t.code, value: t.turnoverMn, display: fmtRsM(t.turnoverMn) }))
    : groupSum(TICKERS, (t) => t.sector, (t) => t.turnoverMn)
      .sort((a, b) => b.value - a.value)
      .map((g) => ({ label: g.key, value: g.value, display: fmtRsM(g.value) }))

  const foreignRows = narrowed
    ? [...pool]
      .sort((a, b) => b.foreignNetMn - a.foreignNetMn)
      .map((t) => ({ label: t.code, value: t.foreignNetMn, display: fmtSignedRsM(t.foreignNetMn) }))
    : groupSum(TICKERS, (t) => t.sector, (t) => t.foreignNetMn)
      .sort((a, b) => b.value - a.value)
      .map((g) => ({ label: g.key, value: g.value, display: fmtSignedRsM(g.value) }))

  const byYield = [...pool].sort((a, b) => dividendYield(b) - dividendYield(a)).slice(0, 5)
  const byPe = [...pool].sort((a, b) => a.pe - b.pe).slice(0, 5)

  // Top movers ranks on the ABSOLUTE move, so on a month where the market
  // is broadly up it can return five risers and never mention that
  // anything fell. The laggards list is the other half of that sentence,
  // and it is the half a dealer is actually looking for.
  const laggards = [...pool].sort((a, b) => a.mtdPct - b.mtdPct).slice(0, 5)

  // Sector roll-up, one row per sector in view. Every column is summed or
  // averaged from the same counters the charts above are drawn from.
  const sectorDetail = [...new Set(pool.map((t) => t.sector))].map((sector) => {
    const members = pool.filter((t) => t.sector === sector)
    return {
      sector,
      count: members.length,
      avgMtd: members.reduce((n, t) => n + t.mtdPct, 0) / members.length,
      turnoverMn: members.reduce((n, t) => n + t.turnoverMn, 0),
      foreignNetMn: members.reduce((n, t) => n + t.foreignNetMn, 0),
    }
  }).sort((a, b) => b.turnoverMn - a.turnoverMn)

  const scope = narrowed ? `, ${filters.sector}` : ''

  return [
    {
      id: 'stands',
      title: 'Where the market stands',
      subtitle: 'Index level, traded value and the foreign balance, for the sessions in view.',
      panels: [
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
            source: SRC_MARKET,
            caption: 'Each series scaled to its own range, values are illustrative',
          },
        },
        {
          id: 'breadth',
          span: 1,
          body: {
            kind: 'donut',
            title: `Market breadth${scope}`,
            // The one ring on the surface whose parts really do mean up,
            // down and neither, so it takes the signal inks rather than
            // the categorical ones.
            rows: [
              { label: 'Advancing', value: advancing, display: String(advancing), tone: 'up' as const },
              { label: 'Declining', value: declining, display: String(declining), tone: 'down' as const },
              { label: 'Unchanged', value: unchanged, display: String(unchanged), tone: 'flat' as const },
            ],
            centreValue: String(pool.length),
            centreLabel: pool.length === 1 ? 'counter' : 'counters',
            source: SRC_MARKET,
            caption: 'Counters by direction, month to date',
          },
        },
        {
          id: 'turnover',
          span: 1,
          body: {
            kind: 'bars',
            title: narrowed ? `Turnover by counter${scope}` : 'Turnover by sector',
            rows: turnoverRows,
            source: SRC_MARKET,
            caption: 'Traded value, illustrative values',
          },
        },
      ],
    },
    {
      id: 'moved',
      title: 'What moved',
      subtitle: 'Sector performance month to date, and the counters carrying it.',
      panels: [
        {
          id: 'sectors',
          span: 1,
          body: {
            kind: 'signedBars',
            title: narrowed ? `Sector performance${scope}` : 'Sector performance',
            rows: sectorRows.map((s) => ({
              label: s.sector, value: s.mtdPct, display: fmtSignedPct(s.mtdPct),
            })),
            source: SRC_MARKET,
            caption: 'Month to date, illustrative values',
          },
        },
        {
          id: 'movers',
          span: 1,
          body: {
            kind: 'movers',
            title: narrowed ? `Top movers${scope}` : 'Top movers',
            rows: movers.map((t) => ({
              code: t.code, value: t.mtdPct, display: fmtSignedPct(t.mtdPct),
            })),
            source: SRC_MARKET,
            caption: 'Largest absolute move, illustrative values',
          },
        },
        {
          id: 'laggards',
          span: 1,
          body: {
            kind: 'movers',
            title: narrowed ? `Laggards${scope}` : 'Laggards',
            rows: laggards.map((t) => ({
              code: t.code, value: t.mtdPct, display: fmtSignedPct(t.mtdPct),
            })),
            source: SRC_MARKET,
            caption: 'Weakest month to date, illustrative values',
          },
        },
        {
          id: 'foreign',
          span: 1,
          body: {
            kind: 'signedBars',
            title: narrowed ? `Foreign net by counter${scope}` : 'Foreign net by sector',
            rows: foreignRows,
            source: SRC_MARKET,
            caption: 'Buying above the line, selling below, illustrative values',
          },
        },
        // Full width, and last in the section: the four figures above are
        // each one column of this table, so it belongs under them as the
        // place to check a number rather than beside them competing for
        // the same glance. Dropped entirely when one sector is selected,
        // where it would be a table with a single row in it.
        ...(narrowed ? [] : [{
          id: 'sector-detail',
          span: 4 as const,
          body: {
            kind: 'table' as const,
            title: 'Sector detail',
            columns: ['Sector', 'Counters', 'Avg move', 'Turnover', 'Foreign net'],
            rows: sectorDetail.map((d) => [
              d.sector,
              String(d.count),
              fmtSignedPct(d.avgMtd),
              fmtRsM(d.turnoverMn),
              fmtSignedRsM(d.foreignNetMn),
            ]),
            source: SRC_MARKET,
            caption: 'Summed across the counters in each sector, illustrative values',
          },
        }]),
      ],
    },
    {
      id: 'worth',
      title: 'What it is worth',
      subtitle: 'Valuation and income across the counters in view.',
      panels: [
        {
          id: 'valuation',
          span: 2,
          body: {
            kind: 'scatter',
            title: 'Valuation against income',
            xName: 'P/E',
            yName: 'Dividend yield',
            points: pool.map((t) => ({
              label: t.code,
              group: t.sector,
              x: t.pe,
              y: dividendYield(t),
              xDisplay: `${t.pe.toFixed(1)}x`,
              yDisplay: fmtPct(dividendYield(t)),
            })),
            source: SRC_MARKET,
            caption: 'One dot per counter, low and left is cheap, illustrative values',
          },
        },
        {
          id: 'yield',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Highest dividend yield',
            rows: byYield.map((t) => ({
              label: t.code, value: dividendYield(t), display: fmtPct(dividendYield(t)),
            })),
            source: SRC_MARKET,
            caption: 'Dividend over price, illustrative values',
          },
        },
        {
          id: 'pe',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Cheapest by P/E',
            rows: byPe.map((t) => ({ label: t.code, value: t.pe, display: `${t.pe.toFixed(1)}x` })),
            source: SRC_MARKET,
            caption: 'Lowest multiple first, illustrative values',
          },
        },
        // The ranked tiles above each show five of the counters in view.
        // A dealer asked about the sixth has nowhere to look, which is
        // what this is for: every counter the filters leave standing,
        // with every field the dataset carries on it.
        {
          id: 'counter-detail',
          span: 4,
          body: {
            kind: 'table',
            title: narrowed ? `Every counter${scope}` : 'Every counter',
            columns: [
              'Counter', 'Name', 'Sector', 'Price', 'MTD', 'P/E', 'Yield', 'Turnover', 'Foreign net',
            ],
            rows: [...pool]
              .sort((a, b) => b.turnoverMn - a.turnoverMn)
              .map((t) => [
                t.code,
                t.name,
                t.sector,
                fmtPrice(t.price),
                fmtSignedPct(t.mtdPct),
                `${t.pe.toFixed(1)}x`,
                fmtPct(dividendYield(t)),
                fmtRsM(t.turnoverMn),
                fmtSignedRsM(t.foreignNetMn),
              ]),
            source: SRC_MARKET,
            caption: 'Ranked by turnover, illustrative values',
          },
        },
      ],
    },
  ]
}

// Sum one measure over a categorical key, in one place rather than in the
// four panels that each used to build their own Map.
function groupSum<T, K extends string>(
  items: T[], keyOf: (item: T) => K, valueOf: (item: T) => number,
): { key: K; value: number }[] {
  const totals = new Map<K, number>()
  for (const item of items) {
    const k = keyOf(item)
    totals.set(k, (totals.get(k) ?? 0) + valueOf(item))
  }
  return [...totals.entries()].map(([key, value]) => ({ key, value }))
}

// ---------------------------------------------------------------------------
// Client Book
// ---------------------------------------------------------------------------

function clientsSections(desk: DeskId, _filters: Filters): DashSection[] {
  const accounts = visibleAccounts(desk)
  const redacted = dashboardAccess(desk, 'clients') === 'redacted'

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

  const exposureByTicker = new Map<string, number>()
  for (const a of accounts) {
    for (const r of exposureOf(a.holdings)) {
      exposureByTicker.set(r.code, (exposureByTicker.get(r.code) ?? 0) + r.value)
    }
  }
  const exposureRows = [...exposureByTicker.entries()].sort((a, b) => b[1] - a[1])
  const visibleAum = exposureRows.reduce((s, [, v]) => s + v, 0)
  const largest = exposureRows[0]

  const kpis: KpiSpec[] = [
    { label: 'AUM', value: fmtRsM(visibleAumMn) },
    { label: 'Active accounts', value: String(accounts.length) },
    { label: 'MTD brokerage', value: fmtRsM(brokerageMn) },
    // Not an invented figure: the largest single line in the visible book
    // and the share of that book it accounts for, both read straight off
    // exposureRows above.
    {
      label: 'Largest position',
      value: largest ? largest[0] : 'None',
      delta: largest && visibleAum > 0
        ? `${fmtPct((largest[1] / visibleAum) * 100)} of the book`
        : 'No holdings visible',
      dir: 'flat',
    },
  ]

  const sectorExposure = groupSum(
    exposureRows.map(([code, value]) => ({ code, value })),
    (r) => TICKERS.find((t) => t.code === r.code)!.sector,
    (r) => r.value,
  ).sort((a, b) => b.value - a.value)

  const concentrationRows = accounts.map((a) => {
    const rows = exposureOf(a.holdings)
    const total = rows.reduce((s, r) => s + r.value, 0)
    const top = [...rows].sort((r1, r2) => r2.value - r1.value)[0]
    const sharePct = total > 0 ? (top.value / total) * 100 : 0
    const flag = sharePct > CONCENTRATION_THRESHOLD_PCT ? 'High' : 'OK'
    return { account: a.id, code: top.code, sharePct, flag, total }
  })

  const gainRows: MoversRow[] = accounts.map((a) => {
    const totalGain = accountGain(a).reduce((s, g) => s + g.gainLkr, 0)
    return {
      code: a.id,
      name: maskHolder(desk, a),
      // Fix round 2: this used to hardcode `desk === 'research'`, a
      // second source of truth for the same fact DashboardsPane already
      // derives correctly as `accessFor(desk, 'clients') === 'redacted'`
      // to drive the REDACTED tag. Reading the access matrix directly
      // here means the tag and the masking can never disagree, even if
      // the matrix ever assigned 'redacted' to a different desk.
      nameMuted: redacted,
      value: totalGain,
      display: fmtSignedRsFull(totalGain),
    }
  })

  // Gain per holding, summed across whichever accounts this desk can see,
  // so a dealer's version is their own book's movement rather than a
  // narrowed copy of the firm's.
  const gainByHolding = [...groupSum(
    accounts.flatMap((a) => accountGain(a)),
    (g) => g.code,
    (g) => g.gainLkr,
  )].sort((a, b) => b.value - a.value)

  // One row per holding across whichever accounts this desk can see, with
  // quantity and cost summed and the average cost weighted by quantity,
  // which is the only honest way to combine the same counter bought at
  // two different prices in two different accounts.
  const holdingDetail = [...new Set(accounts.flatMap((a) => a.holdings.map((h) => h.code)))]
    .map((code) => {
      const ticker = TICKERS.find((t) => t.code === code)!
      const lots = accounts.flatMap((a) => a.holdings.filter((h) => h.code === code))
      const qty = lots.reduce((n, h) => n + h.qty, 0)
      const cost = lots.reduce((n, h) => n + h.qty * h.avgCost, 0)
      const avgCost = qty > 0 ? cost / qty : 0
      const value = qty * ticker.price
      return {
        code,
        name: ticker.name,
        sector: ticker.sector,
        qty,
        avgCost,
        price: ticker.price,
        value,
        gain: value - cost,
        gainPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
      }
    })
    .sort((a, b) => b.value - a.value)

  const costVsMarket = accounts.flatMap((a) => accountGain(a)).map((g) => ({
    label: g.code,
    a: g.avgCost,
    b: g.price,
    aDisplay: `Rs ${g.avgCost.toFixed(2)}`,
    bDisplay: `Rs ${g.price.toFixed(2)}`,
  }))

  return [
    {
      id: 'book',
      title: 'The book today',
      subtitle: 'What the visible accounts hold, and what it is worth now.',
      panels: [
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
            source: SRC_CLIENTS,
            caption: 'Current market value, illustrative values',
          },
        },
        {
          id: 'mix',
          span: 1,
          body: {
            kind: 'donut',
            title: 'Book mix by holding',
            rows: exposureRows.map(([code, value]) => ({
              label: code, value, display: fmtPct(visibleAum > 0 ? (value / visibleAum) * 100 : 0),
            })),
            centreValue: fmtRsM(visibleAumMn),
            centreLabel: 'AUM',
            source: SRC_CLIENTS,
            caption: 'Share of visible book, illustrative values',
          },
        },
        {
          id: 'sector-exposure',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Exposure by sector',
            rows: sectorExposure.map((s) => ({
              label: s.key, value: s.value, display: fmtRsM(s.value / 1_000_000),
            })),
            source: SRC_CLIENTS,
            caption: 'Current market value, illustrative values',
          },
        },
        {
          id: 'holdings-detail',
          span: 4,
          body: {
            kind: 'table',
            title: 'Every holding',
            columns: ['Holding', 'Name', 'Sector', 'Quantity', 'Avg cost', 'Price', 'Value', 'Share'],
            rows: holdingDetail.map((h) => [
              h.code,
              h.name,
              h.sector,
              fmtQty(h.qty),
              fmtPrice(h.avgCost),
              fmtPrice(h.price),
              fmtRsM(h.value / 1_000_000),
              fmtPct(visibleAum > 0 ? (h.value / visibleAum) * 100 : 0),
            ]),
            source: SRC_CLIENTS,
            caption: 'Quantity summed and average cost weighted across visible accounts',
          },
        },
      ],
    },
    {
      id: 'risk',
      title: 'Where the book leans',
      subtitle: `Concentration by account, flagged above ${CONCENTRATION_THRESHOLD_PCT}% in one holding.`,
      panels: [
        {
          id: 'concentration',
          span: 2,
          body: {
            kind: 'table',
            title: 'Concentration flags',
            columns: ['Account', 'Largest holding', 'Share', 'Flag'],
            rows: concentrationRows.map((r) => [r.account, r.code, fmtPct(r.sharePct), r.flag]),
            source: SRC_CLIENTS,
            caption: `Flagged above ${CONCENTRATION_THRESHOLD_PCT}% in one holding`,
          },
        },
        {
          id: 'account-mix',
          span: 1,
          body: {
            kind: 'donut',
            title: 'Book split by account',
            rows: accounts.map((a) => {
              const v = aumByAccountId.get(a.id) ?? 0
              return {
                label: a.id,
                value: v,
                display: fmtPct(visibleAum > 0 ? (v / visibleAum) * 100 : 0),
              }
            }),
            centreValue: String(accounts.length),
            centreLabel: accounts.length === 1 ? 'account' : 'accounts',
            source: SRC_CLIENTS,
            caption: 'Share of visible book, illustrative values',
          },
        },
        {
          id: 'top-share',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Largest holding, as a share',
            rows: concentrationRows.map((r) => ({
              label: r.account, value: r.sharePct, display: fmtPct(r.sharePct),
            })),
            source: SRC_CLIENTS,
            caption: `Flagged above ${CONCENTRATION_THRESHOLD_PCT}%, illustrative values`,
          },
        },
      ],
    },
    {
      id: 'pnl',
      title: 'Gain and loss',
      subtitle: 'Unrealised movement since purchase, by account and by holding.',
      panels: [
        {
          id: 'cost-market',
          span: 2,
          body: {
            kind: 'pairedBars',
            title: 'Average cost against market price',
            series: ['Average cost', 'Market price'],
            // Both series are rupees a share, so the axis carries the
            // scale and the bars stay unlabelled.
            sharedAxis: true,
            rows: costVsMarket,
            source: SRC_CLIENTS,
            caption: 'Per holding, illustrative values',
          },
        },
        {
          id: 'gainloss',
          span: 1,
          body: {
            kind: 'movers',
            title: 'Unrealised gain and loss',
            rows: gainRows,
            source: SRC_CLIENTS,
            caption: 'By account, illustrative values',
          },
        },
        {
          id: 'gain-holding',
          span: 1,
          body: {
            kind: 'signedBars',
            title: 'Gain since purchase, by holding',
            rows: gainByHolding.map((g) => ({
              label: g.key, value: g.value, display: fmtSignedRsFull(g.value),
            })),
            source: SRC_CLIENTS,
            caption: 'Market price against average cost, illustrative values',
          },
        },
        // In rupees, the biggest holding almost always shows the biggest
        // gain, which says more about position size than about the
        // position. The same movement as a percentage of what was paid is
        // the ranking that answers "which of these actually worked".
        {
          id: 'gain-pct',
          span: 2,
          body: {
            kind: 'signedBars',
            title: 'Gain since purchase, as a percentage',
            rows: [...holdingDetail]
              .sort((a, b) => b.gainPct - a.gainPct)
              .map((h) => ({ label: h.code, value: h.gainPct, display: fmtSignedPct(h.gainPct) })),
            source: SRC_CLIENTS,
            caption: 'Against weighted average cost, illustrative values',
          },
        },
        {
          id: 'gain-detail',
          span: 2,
          body: {
            kind: 'table',
            title: 'Gain by holding',
            columns: ['Holding', 'Quantity', 'Avg cost', 'Price', 'Gain', 'Gain %'],
            rows: [...holdingDetail]
              .sort((a, b) => b.gain - a.gain)
              .map((h) => [
                h.code,
                fmtQty(h.qty),
                fmtPrice(h.avgCost),
                fmtPrice(h.price),
                fmtSignedRsFull(h.gain),
                fmtSignedPct(h.gainPct),
              ]),
            source: SRC_CLIENTS,
            caption: 'Unrealised, illustrative values',
          },
        },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Firm Performance
// ---------------------------------------------------------------------------

function firmSections(_desk: DeskId, _filters: Filters): DashSection[] {
  const latest = REVENUE[REVENUE.length - 1]
  const previous = REVENUE[REVENUE.length - 2]
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
      return {
        rm,
        sharePct,
        aumMn: aum / 1_000_000,
        revenueMn: (sharePct / 100) * latest.revenueMn,
      }
    })
    .sort((a, b) => b.revenueMn - a.revenueMn)

  const revenueMoMPct = ((latest.revenueMn - previous.revenueMn) / previous.revenueMn) * 100
  const turnoverMoMPct = ((latest.turnoverBn - previous.turnoverBn) / previous.turnoverBn) * 100

  // What the house keeps of every rupee traded, in basis points. Both
  // inputs are real series on REVENUE, so this is a derivation the client
  // can check by hand, not a rate the demo asserts.
  const captureBps = REVENUE.map((r) => ({
    month: r.month,
    bps: (r.revenueMn / (r.turnoverBn * 1000)) * 10_000,
  }))

  const recent = REVENUE.slice(-6)
  const momRows = recent.map((r, i) => {
    const prior = REVENUE[REVENUE.length - recent.length + i - 1]
    const pct = ((r.revenueMn - prior.revenueMn) / prior.revenueMn) * 100
    return { label: r.month, value: pct, display: fmtSignedPct(pct) }
  })

  return [
    {
      id: 'revenue',
      title: 'Revenue',
      subtitle: 'Brokerage revenue for the latest month, against the market that produced it.',
      panels: [
        { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
        // Ruling 8: the exact chart q06 returns, imported rather than rebuilt.
        { id: 'revenue-turnover', span: 2, body: revenueVsTurnover() },
        {
          id: 'revenue-trend',
          span: 1,
          body: {
            kind: 'area',
            title: 'Brokerage revenue, last 12 months',
            xLabels: REVENUE.map((r) => r.month),
            series: [{
              name: 'Brokerage revenue',
              points: REVENUE.map((r) => r.revenueMn),
              displays: REVENUE.map((r) => fmtRsM(r.revenueMn)),
            }],
            source: SRC_LEDGER,
            caption: 'Monthly, illustrative values',
          },
        },
        {
          id: 'pulse',
          span: 1,
          body: {
            kind: 'spark',
            title: 'Month on month',
            rows: [
              {
                label: 'Brokerage revenue',
                value: fmtRsM(latest.revenueMn),
                delta: `${fmtSignedPct(revenueMoMPct)} on ${previous.month}`,
                dir: revenueMoMPct > 0 ? 'up' : revenueMoMPct < 0 ? 'down' : 'flat',
                points: REVENUE.map((r) => r.revenueMn),
              },
              {
                label: 'Market turnover',
                value: `Rs ${latest.turnoverBn.toFixed(1)}B`,
                delta: `${fmtSignedPct(turnoverMoMPct)} on ${previous.month}`,
                dir: turnoverMoMPct > 0 ? 'up' : turnoverMoMPct < 0 ? 'down' : 'flat',
                points: REVENUE.map((r) => r.turnoverBn),
              },
            ],
            source: SRC_LEDGER,
            caption: 'Latest month against the one before, illustrative values',
          },
        },
      ],
    },
    {
      id: 'producers',
      title: 'Who is producing it',
      subtitle: 'The latest month allocated across relationship managers by book size.',
      panels: [
        {
          id: 'revenue-desk',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Revenue by relationship manager',
            rows: byRm.map((r) => ({ label: r.rm, value: r.revenueMn, display: fmtRsM(r.revenueMn) })),
            source: SRC_LEDGER,
            caption: 'Allocated by book size, illustrative values',
          },
        },
        {
          id: 'rm-share',
          span: 1,
          body: {
            kind: 'donut',
            title: 'Share by relationship manager',
            rows: byRm.map((r) => ({ label: r.rm, value: r.revenueMn, display: fmtPct(r.sharePct) })),
            centreValue: fmtRsM(latest.revenueMn),
            centreLabel: latest.month,
            source: SRC_LEDGER,
            caption: 'Allocated by book size, illustrative values',
          },
        },
        // The allocation above is derived from book size, so the book
        // itself belongs on the same row: without it the reader has the
        // conclusion and not the input it was computed from.
        {
          id: 'book-by-rm',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Book size by relationship manager',
            rows: byRm.map((r) => ({
              label: r.rm, value: r.aumMn, display: fmtRsM(r.aumMn),
            })),
            source: SRC_CLIENTS,
            caption: 'Current market value, illustrative values',
          },
        },
        {
          id: 'concentration',
          span: 1,
          body: {
            kind: 'table',
            title: 'Revenue concentration',
            columns: ['Manager', 'Share', 'Flag'],
            rows: byRm.map((r) => [
              r.rm,
              fmtPct(r.sharePct),
              r.sharePct > CONCENTRATION_THRESHOLD_PCT ? 'High' : 'OK',
            ]),
            source: SRC_LEDGER,
            caption: `Flagged above ${CONCENTRATION_THRESHOLD_PCT}% with one manager`,
          },
        },
      ],
    },
    {
      id: 'efficiency',
      title: 'What it earns on',
      subtitle: 'Revenue as a share of the turnover it was earned on, month by month.',
      panels: [
        {
          id: 'capture',
          span: 2,
          body: {
            kind: 'area',
            title: 'Capture rate, revenue over turnover',
            xLabels: captureBps.map((c) => c.month),
            series: [{
              name: 'Capture rate',
              points: captureBps.map((c) => c.bps),
              displays: captureBps.map((c) => `${c.bps.toFixed(0)} bps`),
            }],
            source: SRC_LEDGER,
            caption: 'Basis points of market turnover, illustrative values',
          },
        },
        {
          id: 'mom',
          span: 2,
          body: {
            kind: 'signedBars',
            title: 'Month on month revenue change',
            rows: momRows,
            source: SRC_LEDGER,
            caption: 'Last six months, illustrative values',
          },
        },
        // Both figures in this section are one column of this table, and
        // the capture rate in particular is a derived number: printing
        // the revenue and the turnover it was divided by, next to the
        // result, is what makes it checkable rather than asserted.
        {
          id: 'ledger',
          span: 4,
          body: {
            kind: 'table',
            title: 'Month by month',
            columns: ['Month', 'Brokerage revenue', 'Market turnover', 'Capture', 'Change'],
            rows: REVENUE.map((r, i) => [
              r.month,
              fmtRsM(r.revenueMn),
              `Rs ${r.turnoverBn.toFixed(1)}B`,
              `${captureBps[i].bps.toFixed(0)} bps`,
              i === 0
                ? 'First month on file'
                : fmtSignedPct(((r.revenueMn - REVENUE[i - 1].revenueMn) / REVENUE[i - 1].revenueMn) * 100),
            ]),
            source: SRC_LEDGER,
            caption: 'Capture is revenue over turnover, illustrative values',
          },
        },
      ],
    },
  ]
}

const MARKET: Dashboard = defineDashboard({
  id: 'market',
  title: 'Market Overview',
  badge: 'System',
  description: 'Index levels, sector performance and the biggest movers, market-wide.',
  // Sector narrows Turnover/Foreign net/sector performance/movers;
  // Period windows the index line. Both genuinely change what renders.
  usesFilters: true,
  sections: marketSections,
})
const CLIENTS: Dashboard = defineDashboard({
  id: 'clients',
  title: 'Client Book',
  badge: 'System',
  description: 'Holdings, concentration and unrealised gain across your visible accounts.',
  // clientsSections ignores filters entirely (Judgment call 5, main
  // report): holdings, concentration and gain/loss have no sector or
  // period dimension in this dataset. Showing Sector/Period here would
  // be a live control that does nothing when touched.
  usesFilters: false,
  sections: clientsSections,
})
const FIRM: Dashboard = defineDashboard({
  id: 'firm',
  title: 'Firm Performance',
  badge: 'System',
  description: 'Brokerage revenue against turnover, by relationship manager, and its concentration.',
  // Same reasoning as Client Book: firmSections ignores filters, and
  // Period specifically would need per-period revenue this dataset
  // does not carry (task-8 fix-round-2 brief).
  usesFilters: false,
  sections: firmSections,
})

export const DASHBOARDS: Dashboard[] = [MARKET, CLIENTS, FIRM]

// ---------------------------------------------------------------------------
// Build a dashboard. Fix round 1: the first version of this section ignored
// whatever was typed and always returned the same dashboard under whatever
// title the user's own words seemed to describe, which is worse than a
// dead end (it looks like it built the wrong thing while quoting the
// request back). Three canned specs now, matched the same way chat
// matches a question, through the same composer: recognised text returns
// a spec and builds it; anything else gets the same honest "here is what
// I can build" chat already gives for its own six questions, never a
// wrong dashboard under a right-sounding title.
// ---------------------------------------------------------------------------

export const BUILD_STEPS: Step[] = [
  { label: 'Parsed the request', ms: 260 },
  { label: 'Planned two sections', ms: 420 },
  { label: 'Queried the market data', ms: 640 },
  { label: 'Composed the widgets', ms: 460 },
]

function foreignBySectorSections(): DashSection[] {
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

  // A ring divides one whole, so it can only carry the buying side: net
  // buying and net selling do not sum to a total anybody would recognise.
  const buyingSectors = sectorRows.filter(([, v]) => v.net > 0)
  const buyingTotal = buyingSectors.reduce((s, [, v]) => s + v.net, 0)

  const kpis: KpiSpec[] = [
    { label: 'Foreign net', value: fmtSignedRsM(totalNet), valueDir: totalNet >= 0 ? 'up' : 'down' },
    { label: 'Counters buying', value: String(buyers) },
    { label: 'Counters selling', value: String(sellers) },
    { label: 'Leading sector', value: sectorRows[0][0] },
  ]

  return [
    {
      id: 'balance',
      title: 'The balance',
      subtitle: 'Where foreign money went this quarter, sector by sector.',
      panels: [
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
            source: SRC_MARKET,
            caption: 'This quarter, illustrative values',
          },
        },
        {
          id: 'buy-share',
          span: 1,
          body: {
            kind: 'donut',
            title: 'Share of net buying',
            rows: buyingSectors.map(([sector, v]) => ({
              label: sector,
              value: v.net,
              display: fmtPct(buyingTotal > 0 ? (v.net / buyingTotal) * 100 : 0),
            })),
            centreValue: fmtRsM(buyingTotal),
            centreLabel: 'net bought',
            source: SRC_MARKET,
            caption: 'Sectors in net inflow only, illustrative values',
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
            source: SRC_MARKET,
            caption: 'Biggest buy and biggest sell, illustrative values',
          },
        },
      ],
    },
    {
      id: 'counters',
      title: 'Counter by counter',
      subtitle: 'How many names moved each way, and which carried the flow.',
      panels: [
        {
          id: 'sector-counts',
          span: 2,
          body: {
            kind: 'table',
            title: 'Buying and selling counters, by sector',
            columns: ['Sector', 'Buying', 'Selling'],
            rows: sectorRows.map(([sector, v]) => [sector, String(v.buys), String(v.sells)]),
            source: SRC_MARKET,
            caption: 'Counters in net inflow against net outflow',
          },
        },
        {
          id: 'top-flows',
          span: 2,
          body: {
            kind: 'signedBars',
            title: 'Foreign net by counter',
            rows: [...byTicker.slice(0, 4), ...byTicker.slice(-3)].map((t) => ({
              label: t.code, value: t.foreignNetMn, display: fmtSignedRsM(t.foreignNetMn),
            })),
            source: SRC_MARKET,
            caption: 'Four largest buys and three largest sells, illustrative values',
          },
        },
      ],
    },
  ]
}

// "Liquidity" is one of Exhibit C's own tab names (its .dtabs strip:
// Overview / Sectors / Foreign flows / Liquidity / Client book), one of
// the two the pre-built three do not cover, which is exactly why it
// belongs among the buildable specs. Derives from turnoverMn only.
function liquiditySections(): DashSection[] {
  const totalTurnoverMn = TICKERS.reduce((s, t) => s + t.turnoverMn, 0)
  const avgTurnoverMn = totalTurnoverMn / TICKERS.length
  const byLiquidity = [...TICKERS].sort((a, b) => b.turnoverMn - a.turnoverMn)
  const mostLiquid = byLiquidity[0]
  const leastLiquid = byLiquidity[byLiquidity.length - 1]

  const kpis: KpiSpec[] = [
    { label: 'Total turnover', value: fmtRsM(totalTurnoverMn) },
    { label: 'Most liquid', value: mostLiquid.code, delta: fmtRsM(mostLiquid.turnoverMn) },
    { label: 'Least liquid', value: leastLiquid.code, delta: fmtRsM(leastLiquid.turnoverMn) },
    { label: 'Avg per counter', value: fmtRsM(avgTurnoverMn) },
  ]

  const sectorRows = groupSum(TICKERS, (t) => t.sector, (t) => t.turnoverMn)
    .sort((a, b) => b.value - a.value)

  // Ranked by turnover and split into equal thirds, not a hardcoded
  // "over Rs 100M is High" cutoff, so the boundary always reflects this
  // market's own spread rather than a number picked to fit it.
  const tierSize = Math.ceil(byLiquidity.length / 3)
  const tiers = [
    { name: 'High', members: byLiquidity.slice(0, tierSize) },
    { name: 'Medium', members: byLiquidity.slice(tierSize, tierSize * 2) },
    { name: 'Low', members: byLiquidity.slice(tierSize * 2) },
  ]

  return [
    {
      id: 'traded',
      title: 'Traded value',
      subtitle: 'Where turnover actually sat this month, sector by sector.',
      panels: [
        { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
        {
          id: 'sector-turnover',
          span: 2,
          body: {
            kind: 'bars',
            title: 'Turnover by sector',
            rows: sectorRows.map((s) => ({ label: s.key, value: s.value, display: fmtRsM(s.value) })),
            source: SRC_MARKET,
            caption: 'Traded value, illustrative values',
          },
        },
        {
          id: 'turnover-share',
          span: 1,
          body: {
            kind: 'donut',
            title: 'Share of turnover',
            rows: sectorRows.map((s) => ({
              label: s.key, value: s.value, display: fmtPct((s.value / totalTurnoverMn) * 100),
            })),
            centreValue: fmtRsM(totalTurnoverMn),
            centreLabel: 'traded',
            source: SRC_MARKET,
            caption: 'Sector share of total turnover, illustrative values',
          },
        },
        {
          id: 'most-liquid',
          span: 1,
          body: {
            kind: 'bars',
            title: 'Most liquid counters',
            rows: byLiquidity.slice(0, 5).map((t) => ({
              label: t.code, value: t.turnoverMn, display: fmtRsM(t.turnoverMn),
            })),
            source: SRC_MARKET,
            caption: 'Traded value, illustrative values',
          },
        },
      ],
    },
    {
      id: 'spread',
      title: 'How it is spread',
      subtitle: 'The gap between the names that trade and the names that do not.',
      panels: [
        {
          id: 'liquidity-tiers',
          span: 2,
          body: {
            kind: 'table',
            title: 'Liquidity tiers',
            columns: ['Tier', 'Counters', 'Share of turnover'],
            rows: tiers.map((t) => [
              t.name,
              String(t.members.length),
              fmtPct((t.members.reduce((s, m) => s + m.turnoverMn, 0) / totalTurnoverMn) * 100),
            ]),
            source: SRC_MARKET,
            caption: 'Ranked by turnover, split into equal thirds',
          },
        },
        {
          id: 'least-liquid',
          span: 2,
          body: {
            kind: 'bars',
            title: 'Thinnest counters',
            rows: [...byLiquidity].reverse().slice(0, 6).map((t) => ({
              label: t.code, value: t.turnoverMn, display: fmtRsM(t.turnoverMn),
            })),
            source: SRC_MARKET,
            caption: 'Lowest traded value first, illustrative values',
          },
        },
      ],
    },
  ]
}

// "Sectors" is Exhibit C's other uncovered tab name. Derives from pe and
// dividendYield only, the same two fields q02's chat answer already
// compares for two stocks; this is the identical comparison rolled up to
// sector averages instead.
function sectorValuationSections(): DashSection[] {
  const groups = new Map<Sector, typeof TICKERS>()
  for (const t of TICKERS) {
    const list = groups.get(t.sector) ?? []
    list.push(t)
    groups.set(t.sector, list)
  }
  const sectorStats = [...groups.entries()]
    .map(([sector, members]) => ({
      sector,
      avgPe: members.reduce((s, t) => s + t.pe, 0) / members.length,
      avgYield: members.reduce((s, t) => s + dividendYield(t), 0) / members.length,
    }))
    .sort((a, b) => b.avgPe - a.avgPe)

  const cheapestSector = [...sectorStats].sort((a, b) => a.avgPe - b.avgPe)[0]
  const richestSector = sectorStats[0]
  const highestYieldSector = [...sectorStats].sort((a, b) => b.avgYield - a.avgYield)[0]
  const lowestYieldSector = [...sectorStats].sort((a, b) => a.avgYield - b.avgYield)[0]

  const kpis: KpiSpec[] = [
    { label: 'Cheapest sector', value: cheapestSector.sector, delta: `${cheapestSector.avgPe.toFixed(1)}x avg P/E` },
    { label: 'Richest sector', value: richestSector.sector, delta: `${richestSector.avgPe.toFixed(1)}x avg P/E` },
    { label: 'Highest yield', value: highestYieldSector.sector, delta: `${fmtPct(highestYieldSector.avgYield)} avg yield` },
    { label: 'Lowest yield', value: lowestYieldSector.sector, delta: `${fmtPct(lowestYieldSector.avgYield)} avg yield` },
  ]

  const cheapestByPe = [...TICKERS].sort((a, b) => a.pe - b.pe).slice(0, 5)
  const highestYield = [...TICKERS].sort((a, b) => dividendYield(b) - dividendYield(a)).slice(0, 5)

  return [
    {
      id: 'valuation',
      title: 'Valuation',
      subtitle: 'What each sector costs, and what it pays back.',
      panels: [
        { id: 'kpis', span: 4, body: { kind: 'kpis', tiles: kpis } },
        {
          id: 'sector-valuation',
          span: 2,
          body: {
            kind: 'pairedBars',
            title: 'P/E against dividend yield, by sector',
            series: ['P/E (x)', 'Dividend yield'],
            rows: sectorStats.map((s) => ({
              label: s.sector,
              a: s.avgPe,
              b: s.avgYield,
              aDisplay: `${s.avgPe.toFixed(1)}x`,
              bDisplay: fmtPct(s.avgYield),
            })),
            source: SRC_MARKET,
            caption: 'Sector averages, illustrative values',
          },
        },
        {
          id: 'valuation-map',
          span: 2,
          body: {
            kind: 'scatter',
            title: 'Every counter, priced against its yield',
            xName: 'P/E',
            yName: 'Dividend yield',
            points: TICKERS.map((t) => ({
              label: t.code,
              group: t.sector,
              x: t.pe,
              y: dividendYield(t),
              xDisplay: `${t.pe.toFixed(1)}x`,
              yDisplay: fmtPct(dividendYield(t)),
            })),
            source: SRC_MARKET,
            caption: 'One dot per counter, low and left is cheap, illustrative values',
          },
        },
      ],
    },
    {
      id: 'extremes',
      title: 'Cheap and generous',
      subtitle: 'The counters at either end of the two measures.',
      panels: [
        {
          id: 'cheapest-pe',
          span: 2,
          body: {
            kind: 'bars',
            title: 'Cheapest by P/E',
            rows: cheapestByPe.map((t) => ({ label: t.code, value: t.pe, display: `${t.pe.toFixed(1)}x` })),
            source: SRC_MARKET,
            caption: 'Lowest multiple first, illustrative values',
          },
        },
        {
          id: 'highest-yield',
          span: 2,
          body: {
            kind: 'bars',
            title: 'Highest dividend yield',
            rows: highestYield.map((t) => ({
              label: t.code, value: dividendYield(t), display: fmtPct(dividendYield(t)),
            })),
            source: SRC_MARKET,
            caption: 'Dividend over price, illustrative values',
          },
        },
      ],
    },
  ]
}

export interface DashboardSpec {
  id: string
  text: string
  aliases: string[]
  title: string
  sections: () => DashSection[]
}

// The client document's own printed composer example, kept verbatim as
// the canonical phrasing (Exhibit C's placeholder: "foreign buying and
// selling by sector this quarter"). The other two are Exhibit C's own
// tab names the pre-built three do not cover (Liquidity, Sectors), which
// is exactly why they are the right things to be buildable on demand.
export const DASHBOARD_SPECS: DashboardSpec[] = [
  {
    id: 'foreign-by-sector',
    text: 'foreign buying and selling by sector this quarter',
    aliases: [
      'foreign buying and selling', 'foreign flow by sector',
      'foreign flows by sector', 'foreign net by sector',
    ],
    title: 'Foreign buying and selling by sector',
    sections: foreignBySectorSections,
  },
  {
    id: 'liquidity-by-counter',
    text: 'liquidity and turnover by counter',
    aliases: [
      'liquidity by counter', 'turnover by counter',
      'most liquid counters', 'liquidity dashboard',
    ],
    title: 'Liquidity and turnover by counter',
    sections: liquiditySections,
  },
  {
    id: 'sector-valuation',
    text: 'sector valuation, p/e against dividend yield',
    aliases: [
      'sector valuation', 'pe against dividend yield',
      'valuation by sector', 'sector pe and yield',
    ],
    title: 'Sector valuation, P/E against dividend yield',
    sections: sectorValuationSections,
  },
]

// Mirrors src/lib/match.ts's own normalise/exact/alias/fuzzy-score
// approach (same stop list, same 0.34 threshold) rather than inventing a
// second one, per the fix-round direction. Duplicated, not imported from
// there: match.ts sits in src/lib/, off limits to modify except by
// creating this one file, and mirroring keeps chat's own question
// matching completely insulated from anything this file does.
const SPEC_STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'what', 'which', 'how', 'me',
  'my', 'our', 'on', 'in', 'at', 'to', 'of', 'and', 'or', 'right', 'now',
  'show', 'this', 'that', 'for', 'vs', 'against', 'it', 'us', 'we', 'i',
])

function normaliseSpecText(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !SPEC_STOP.has(w))
}

const SPEC_MATCH_THRESHOLD = 0.34

export function matchDashboardSpec(input: string): DashboardSpec | null {
  const words = normaliseSpecText(input)
  if (words.length === 0) return null
  const joined = words.join(' ')

  for (const s of DASHBOARD_SPECS) {
    if (normaliseSpecText(s.text).join(' ') === joined) return s
  }
  for (const s of DASHBOARD_SPECS) {
    if (s.aliases.some((a) => joined.includes(normaliseSpecText(a).join(' ')))) return s
  }

  let best: { s: DashboardSpec; score: number } | null = null
  for (const s of DASHBOARD_SPECS) {
    const target = new Set([...normaliseSpecText(s.text), ...s.aliases.flatMap(normaliseSpecText)])
    const hits = words.filter((w) => target.has(w)).length
    const score = hits / words.length
    if (!best || score > best.score) best = { s, score }
  }

  return best && best.score >= SPEC_MATCH_THRESHOLD ? best.s : null
}

// Builds exactly the matched spec, under its own real title: the bug
// this round fixed was this function ignoring which spec matched (or
// whether one did at all) and always returning the same dashboard
// wearing whatever title the request happened to suggest.
export function buildDashboard(spec: DashboardSpec, query: string): Dashboard {
  return defineDashboard({
    id: `custom-${spec.id}-${Date.now()}`,
    title: spec.title,
    badge: 'Custom',
    description: query,
    // None of the three specs' section builders read a Filters argument
    // at all (they take none), so a built dashboard showing
    // Sector/Period controls would be exactly the dead-control defect
    // this fix round removed from Client Book and Firm Performance,
    // just one path over. Extending the same declaration here, beyond
    // the two dashboards the fix named, rather than leaving the
    // identical bug on the one path that happens not to have been
    // named.
    usesFilters: false,
    sections: spec.sections,
  })
}
