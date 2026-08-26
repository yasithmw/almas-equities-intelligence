import type { DeskId, Mode, Viz } from './types'
import {
  TICKERS, ACCOUNTS, REVENUE,
  dividendYield, sectorPerformance, foreignFlowByTicker, accountGain,
} from './dataset'
import { DESKS } from './desks'

export interface Question { id: string; text: string; aliases: string[] }
export interface AnswerVariant { text: string; viz: Viz | null }
export interface Answer {
  id: string
  desks: DeskId[]
  redactedFor: DeskId[]
  quick: AnswerVariant
  auto: AnswerVariant
  deep: AnswerVariant & { correction: string }
  redacted: AnswerVariant | null
  denied: string
}
export type Resolved =
  | { state: 'answered'; variant: AnswerVariant; correction?: string }
  | { state: 'redacted'; variant: AnswerVariant }
  | { state: 'denied'; message: string }

const ALL: DeskId[] = DESKS.map((d) => d.id)

// ---------------------------------------------------------------------------
// Formatting helpers. Every number that reaches copy or a chart is computed
// from TICKERS, ACCOUNTS or REVENUE at module load, never typed in as a bare
// literal, so prose and chart can never disagree with each other.
// ---------------------------------------------------------------------------

// Unsigned percentage for a chart cell whose sign is never meaningful
// (a dividend yield is never negative).
function pctCell(n: number): string {
  return `${n.toFixed(1)}%`
}

// Signed percentage for a chart cell where the sign carries information
// (a flow or a month-on-month move). U+2212 minus, matching the convention
// already established by KpiTile and the VizBlock fixtures.
function signedPctCell(n: number): string {
  const sign = n < 0 ? '−' : '+'
  return `${sign}${Math.abs(n).toFixed(1)}%`
}

// Signed Rs millions for a chart cell, e.g. "+Rs 142M" / "−Rs 18M".
function signedMnCell(n: number): string {
  const sign = n < 0 ? '−' : '+'
  return `${sign}Rs ${Math.abs(Math.round(n))}M`
}

// Signed full rupee amount for a chart cell, comma separated.
function signedLkrCell(n: number): string {
  const sign = n < 0 ? '−' : '+'
  return `${sign}Rs ${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}

// Full rupee amount for prose, no sign glyph: pairs with a verb ("is up",
// "fell") that already carries the direction, so the sentence never shows
// a doubled-up sign and a word both saying the same thing.
function lkrWord(n: number): string {
  return `Rs ${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}

// Unsigned percentage spelled out for prose, matching the word "percent"
// the client's own document uses (q01's mandated Auto text says "5 percent",
// never "5%"); the "%" glyph is reserved for chart cells.
function pctWord(n: number): string {
  return `${Math.abs(n).toFixed(1)} percent`
}

// "A, B and C" for a natural-language list; also handles 1 and 2 items.
function naturalJoin(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// Small whole-number counts (how many sectors, how many months, how many
// counters) are spelled out in prose, matching the register of q01's own
// mandated text ("Four listed banks", "two clear 8 percent") rather than
// mixing in bare digits; measured quantities (percentages, ratios, currency)
// stay numerals throughout and are untouched by this helper.
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
]
function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}
function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)
}

// A sector name that already ends in "s" (Banks, Hotels) takes a bare
// apostrophe ("Hotels' average"), not a doubled "'s" ("Hotels's average").
function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`
}

// ---------------------------------------------------------------------------
// q01: bank dividend yields
// ---------------------------------------------------------------------------

const banks = TICKERS.filter((t) => t.sector === 'Banks')
  .sort((a, b) => dividendYield(b) - dividendYield(a))
const comb = TICKERS.find((t) => t.code === 'COMB')!
const hnb = TICKERS.find((t) => t.code === 'HNB')!
const clearFivePct = banks.filter((t) => dividendYield(t) >= 5).length
const clearEightPct = banks.filter((t) => dividendYield(t) >= 8).length

function bankYields(): Viz {
  return {
    kind: 'bars',
    title: 'Dividend yield, listed banks',
    rows: banks.map((t) => ({
      label: t.code,
      value: dividendYield(t),
      display: pctCell(dividendYield(t)),
    })),
    source: 'Source: your market data',
    caption: 'Illustrative values',
  }
}

// ---------------------------------------------------------------------------
// q02: COMB vs HNB, P/E and dividend yield
// ---------------------------------------------------------------------------

function combHnbPeYield(): Viz {
  return {
    kind: 'pairedBars',
    title: 'COMB vs HNB, P/E and dividend yield',
    series: ['COMB', 'HNB'],
    rows: [
      {
        label: 'P/E (x)',
        a: comb.pe,
        b: hnb.pe,
        aDisplay: `${comb.pe.toFixed(1)}x`,
        bDisplay: `${hnb.pe.toFixed(1)}x`,
      },
      {
        label: 'Dividend yield',
        a: dividendYield(comb),
        b: dividendYield(hnb),
        aDisplay: pctCell(dividendYield(comb)),
        bDisplay: pctCell(dividendYield(hnb)),
      },
    ],
    source: 'Source: your market data',
    caption: 'Illustrative values',
  }
}

// ---------------------------------------------------------------------------
// q03: foreign flows this week
// ---------------------------------------------------------------------------

const foreignFlow = foreignFlowByTicker()
const topBuys = foreignFlow.slice(0, 4)
const topSells = foreignFlow.slice(-3)
const netForeignMn = TICKERS.reduce((s, t) => s + t.foreignNetMn, 0)
const buyerCount = TICKERS.filter((t) => t.foreignNetMn > 0).length
const sellerCount = TICKERS.filter((t) => t.foreignNetMn < 0).length

function foreignFlows(): Viz {
  return {
    kind: 'signedBars',
    title: 'Foreign net, this week',
    rows: [...topBuys, ...topSells].map((t) => ({
      label: t.code,
      value: t.foreignNetMn,
      display: signedMnCell(t.foreignNetMn),
    })),
    source: 'Source: your market data',
    caption: 'Illustrative values',
  }
}

// ---------------------------------------------------------------------------
// q04: A/C 10482 gain since purchase
// ---------------------------------------------------------------------------

const account10482 = ACCOUNTS.find((a) => a.id === 'A/C 10482')!
const gainRows = [...accountGain(account10482)].sort((a, b) => b.gainLkr - a.gainLkr)
const [topGain, midGain, lastGain] = gainRows
const totalGainLkr = gainRows.reduce((s, r) => s + r.gainLkr, 0)
const totalCostLkr = account10482.holdings.reduce((s, h) => s + h.avgCost * h.qty, 0)
const totalGainPct = (totalGainLkr / totalCostLkr) * 100

function accountGainTable(): Viz {
  return {
    kind: 'table',
    title: 'Gain since purchase, A/C 10482',
    columns: ['Holding', 'Gain', 'Gain %'],
    rows: gainRows.map((r) => [r.code, signedLkrCell(r.gainLkr), signedPctCell(r.gainPct)]),
    source: 'Source: your client records',
    caption: 'Illustrative values',
  }
}

function accountGainTableRedacted(): Viz {
  return {
    kind: 'table',
    title: 'Gain since purchase, holder withheld',
    columns: ['Holding', 'Gain', 'Gain %'],
    rows: gainRows.map((r) => [r.code, signedLkrCell(r.gainLkr), signedPctCell(r.gainPct)]),
    source: 'Source: your client records',
    caption: 'Account number and holder withheld for Research',
  }
}

// ---------------------------------------------------------------------------
// q05: sectors driving the ASPI this month
// ---------------------------------------------------------------------------

const sectorPerf = sectorPerformance()
const leadSector = sectorPerf[0]
const laggingSectors = sectorPerf.filter((s) => s.mtdPct < 0)
const midSectors = sectorPerf.slice(1, sectorPerf.length - laggingSectors.length)
const thinnestInLead = [...TICKERS]
  .filter((t) => t.sector === leadSector.sector)
  .sort((a, b) => a.turnoverMn - b.turnoverMn)[0]

function sectorDrivers(): Viz {
  return {
    kind: 'signedBars',
    title: 'Sector performance, month to date',
    rows: sectorPerf.map((s) => ({
      label: s.sector,
      value: s.mtdPct,
      display: signedPctCell(s.mtdPct),
    })),
    source: 'Source: your market data',
    caption: 'Illustrative values',
  }
}

// ---------------------------------------------------------------------------
// q06: brokerage revenue vs turnover
// ---------------------------------------------------------------------------

const revFirst = REVENUE[0]
const revLast = REVENUE[REVENUE.length - 1]
const revPrev = REVENUE[REVENUE.length - 2]
const revenueGrowthPct = ((revLast.revenueMn - revFirst.revenueMn) / revFirst.revenueMn) * 100
const turnoverGrowthPct = ((revLast.turnoverBn - revFirst.turnoverBn) / revFirst.turnoverBn) * 100
const captureRatePct = (r: { revenueMn: number; turnoverBn: number }) =>
  (r.revenueMn / (r.turnoverBn * 1000)) * 100
const avgCapturePct = REVENUE.reduce((s, r) => s + captureRatePct(r), 0) / REVENUE.length
const momRevenuePct = ((revLast.revenueMn - revPrev.revenueMn) / revPrev.revenueMn) * 100
const momTurnoverPct = ((revLast.turnoverBn - revPrev.turnoverBn) / revPrev.turnoverBn) * 100

function revenueVsTurnover(): Viz {
  return {
    kind: 'line',
    title: 'Revenue against turnover',
    xLabels: REVENUE.map((r) => r.month),
    series: [
      { name: 'Brokerage revenue', points: REVENUE.map((r) => r.revenueMn), accent: 'var(--navy)' },
      { name: 'Market turnover', points: REVENUE.map((r) => r.turnoverBn), accent: 'var(--aqua)' },
    ],
    source: 'Source: your brokerage ledger',
    caption: 'Each series scaled to its own range, values are illustrative',
  }
}

// ---------------------------------------------------------------------------
// The answer library
// ---------------------------------------------------------------------------

export const ANSWERS: Record<string, Answer> = {
  q01: {
    id: 'q01',
    desks: ALL,
    redactedFor: [],
    quick: {
      text: `${banks[0].code} leads at ${pctWord(dividendYield(banks[0]))}, then ${banks[1].code} at ${pctWord(dividendYield(banks[1]))}.`,
      viz: null,
    },
    auto: {
      // Verbatim, matching the client's own document (Exhibit B). Do not paraphrase.
      text: 'Ranked by latest declared dividend over the current price. Four listed banks clear 5 percent, and two clear 8 percent.',
      viz: bankYields(),
    },
    deep: {
      text: `Ranked by latest declared dividend over the current price. The reviewer caught NTB counted under Diversified rather than Banks, so it is now included: ${numberWord(clearFivePct)} listed banks clear 5 percent and ${numberWord(clearEightPct)} clear 8 percent.`,
      viz: bankYields(),
      correction: 'Reviewer moved NTB from Diversified to Banks, which changed the count above 5 percent from three to four.',
    },
    redacted: null,
    denied: '',
  },

  q02: {
    id: 'q02',
    desks: ALL,
    redactedFor: [],
    quick: {
      text: `HNB is the cheaper stock at ${hnb.pe.toFixed(1)} times earnings against COMB's ${comb.pe.toFixed(1)}, but COMB pays the bigger dividend at ${pctWord(dividendYield(comb))} to HNB's ${pctWord(dividendYield(hnb))}.`,
      viz: null,
    },
    auto: {
      text: `On trailing price to earnings, HNB trades at ${hnb.pe.toFixed(1)} times against COMB's ${comb.pe.toFixed(1)}, the cheaper of the two on earnings. On dividend yield, COMB leads at ${pctWord(dividendYield(comb))} against HNB's ${pctWord(dividendYield(hnb))}, so COMB pays more of its price back each year. Neither wins on both counts: HNB on the multiple, COMB on the income.`,
      viz: combHnbPeYield(),
    },
    deep: {
      text: `On trailing price to earnings, HNB trades at ${hnb.pe.toFixed(1)} times against COMB's ${comb.pe.toFixed(1)}, the cheaper of the two on earnings. The reviewer flagged that the first pull priced HNB's yield off its first interim dividend alone, before the second interim was declared; recalculated on the full trailing dividend, HNB still yields ${pctWord(dividendYield(hnb))} against COMB's ${pctWord(dividendYield(comb))}, so the ranking holds.`,
      viz: combHnbPeYield(),
      correction: `Reviewer caught the draft pricing HNB's yield off its first interim dividend alone instead of the full trailing declared dividend; recalculated on the correct basis, HNB's yield held at ${pctWord(dividendYield(hnb))}.`,
    },
    redacted: null,
    denied: '',
  },

  q03: {
    id: 'q03',
    desks: ALL,
    redactedFor: [],
    quick: {
      text: `Foreign investors were net buyers this week: ${topBuys[0].code} led inflows at ${lkrWord(topBuys[0].foreignNetMn)} million, while ${topSells[topSells.length - 1].code} saw the biggest outflow at ${lkrWord(Math.abs(topSells[topSells.length - 1].foreignNetMn))} million.`,
      viz: null,
    },
    auto: {
      text: `${capitalize(numberWord(buyerCount))} counters saw net foreign buying against ${numberWord(sellerCount)} with net selling, for a net inflow of ${lkrWord(netForeignMn)} million across the board. ${naturalJoin(topBuys.map((t) => t.code))} drew the largest inflows; ${naturalJoin([...topSells].reverse().map((t) => t.code))} were sold down the hardest.`,
      viz: foreignFlows(),
    },
    deep: {
      text: `${capitalize(numberWord(buyerCount))} counters saw net foreign buying against ${numberWord(sellerCount)} with net selling, for a net inflow of ${lkrWord(netForeignMn)} million across the board. The reviewer caught a ${topBuys[0].code} block trade booked on both the buying and selling custodian legs, which would have overstated its inflow; with the duplicate leg removed, ${topBuys[0].code} still leads at ${lkrWord(topBuys[0].foreignNetMn)} million, ahead of ${naturalJoin(topBuys.slice(1).map((t) => t.code))}, while ${naturalJoin([...topSells].reverse().map((t) => t.code))} were sold down the hardest.`,
      viz: foreignFlows(),
      correction: `Reviewer caught a ${topBuys[0].code} block trade booked on both the buying and selling custodian legs, which would have doubled its net figure; removing the duplicate leg confirmed ${topBuys[0].code}'s inflow at ${lkrWord(topBuys[0].foreignNetMn)} million.`,
    },
    redacted: null,
    denied: '',
  },

  q04: {
    id: 'q04',
    desks: ALL,
    redactedFor: ['research'],
    quick: {
      text: `A/C 10482 is up ${lkrWord(totalGainLkr)} since purchase, led by ${topGain.code} at ${lkrWord(topGain.gainLkr)}.`,
      viz: null,
    },
    auto: {
      text: `Across A/C 10482's ${numberWord(account10482.holdings.length)} holdings, the account is up ${lkrWord(totalGainLkr)} since purchase, a gain of ${pctWord(totalGainPct)} on cost. ${topGain.code} contributes the most at plus ${lkrWord(topGain.gainLkr)} (${pctWord(topGain.gainPct)}), ${midGain.code} is up ${lkrWord(midGain.gainLkr)} (${pctWord(midGain.gainPct)}), and ${lastGain.code} is essentially flat at plus ${lkrWord(lastGain.gainLkr)} (${pctWord(lastGain.gainPct)}).`,
      viz: accountGainTable(),
    },
    deep: {
      text: `Across A/C 10482's ${numberWord(account10482.holdings.length)} holdings, the account is up ${lkrWord(totalGainLkr)} since purchase, a gain of ${pctWord(totalGainPct)} on cost. The reviewer flagged that the ${midGain.code} leg was still showing at the order price because that trade had not yet reached T+3 settlement; checked against the settled position, the holding and its ${lkrWord(midGain.gainLkr)} gain stand as booked. ${topGain.code} contributes the most at plus ${lkrWord(topGain.gainLkr)} (${pctWord(topGain.gainPct)}), and ${lastGain.code} is essentially flat at plus ${lkrWord(lastGain.gainLkr)} (${pctWord(lastGain.gainPct)}).`,
      viz: accountGainTable(),
      correction: `Reviewer held the ${midGain.code} leg back pending T+3 settlement confirmation before releasing the total; the settled position matched the order, so the ${lkrWord(midGain.gainLkr)} gain stood unchanged.`,
    },
    redacted: {
      text: `Research sees this book without the account number or client name. The ${numberWord(account10482.holdings.length)} holdings are up ${lkrWord(totalGainLkr)} since purchase in aggregate.`,
      viz: accountGainTableRedacted(),
    },
    denied: '',
  },

  q05: {
    id: 'q05',
    desks: ALL,
    redactedFor: [],
    quick: {
      text: `${leadSector.sector} leads at plus ${leadSector.mtdPct.toFixed(1)} percent month to date; ${naturalJoin(laggingSectors.map((s) => s.sector))} ${laggingSectors.length === 1 ? 'is' : 'are'} the only ${laggingSectors.length === 1 ? 'sector' : 'sectors'} in the red, at minus ${Math.abs(laggingSectors[laggingSectors.length - 1].mtdPct).toFixed(1)} percent.`,
      viz: null,
    },
    auto: {
      text: `Across all ${numberWord(sectorPerf.length)} sectors, ${leadSector.sector} is driving the index this month at plus ${leadSector.mtdPct.toFixed(1)} percent, followed by ${naturalJoin(midSectors.map((s) => `${s.sector} at plus ${s.mtdPct.toFixed(1)} percent`))}. ${naturalJoin(laggingSectors.map((s) => s.sector))} ${laggingSectors.length === 1 ? 'is' : 'are'} the only ${laggingSectors.length === 1 ? 'sector' : 'sectors'} down, at minus ${Math.abs(laggingSectors[laggingSectors.length - 1].mtdPct).toFixed(1)} percent.`,
      viz: sectorDrivers(),
    },
    deep: {
      text: `Across all ${numberWord(sectorPerf.length)} sectors, ${leadSector.sector} is driving the index this month at plus ${leadSector.mtdPct.toFixed(1)} percent, followed by ${naturalJoin(midSectors.map((s) => `${s.sector} at plus ${s.mtdPct.toFixed(1)} percent`))}. The reviewer flagged that ${thinnestInLead.code}, the thinnest traded counter in ${leadSector.sector}, was still carrying a delayed print when the sector average was first drawn; refreshed to the session close, ${possessive(leadSector.sector)} average holds at plus ${leadSector.mtdPct.toFixed(1)} percent and ${naturalJoin(laggingSectors.map((s) => s.sector))} remains the only ${laggingSectors.length === 1 ? 'sector' : 'sectors'} down, at minus ${Math.abs(laggingSectors[laggingSectors.length - 1].mtdPct).toFixed(1)} percent.`,
      viz: sectorDrivers(),
      correction: `Reviewer caught ${thinnestInLead.code} pricing off a delayed feed print rather than the session close before the ${leadSector.sector} average was drawn; refreshing to the close left the sector average unchanged at plus ${leadSector.mtdPct.toFixed(1)} percent.`,
    },
    redacted: null,
    denied: '',
  },

  q06: {
    id: 'q06',
    desks: ['management'],
    redactedFor: [],
    quick: {
      text: `Brokerage revenue is up ${revenueGrowthPct.toFixed(0)} percent over the past ${numberWord(REVENUE.length)} months, tracking a bit behind turnover's ${turnoverGrowthPct.toFixed(0)} percent growth.`,
      viz: null,
    },
    auto: {
      text: `Over the past ${numberWord(REVENUE.length)} months, brokerage revenue grew ${revenueGrowthPct.toFixed(0)} percent against turnover's ${turnoverGrowthPct.toFixed(0)} percent, so revenue has held close to ${avgCapturePct.toFixed(1)} percent of turnover throughout rather than pulling away in either direction. The most recent month reversed that gap slightly: revenue rose ${momRevenuePct.toFixed(1)} percent against turnover's ${momTurnoverPct.toFixed(1)} percent.`,
      viz: revenueVsTurnover(),
    },
    deep: {
      text: `Over the past ${numberWord(REVENUE.length)} months, brokerage revenue grew ${revenueGrowthPct.toFixed(0)} percent against turnover's ${turnoverGrowthPct.toFixed(0)} percent, so revenue has held close to ${avgCapturePct.toFixed(1)} percent of turnover throughout. The reviewer checked that the turnover series was booked under the house definition, which excludes crossings, before letting the capture rate through; it was, so the ${avgCapturePct.toFixed(1)} percent capture rate and the most recent month's revenue growth of ${momRevenuePct.toFixed(1)} percent against turnover's ${momTurnoverPct.toFixed(1)} percent both stand.`,
      viz: revenueVsTurnover(),
      correction: 'Reviewer verified turnover was booked under the house definition, which excludes crossings, before the capture rate was allowed through; a crossings-inclusive feed would have understated the rate.',
    },
    redacted: null,
    denied: 'Brokerage revenue sits with management. Switch desk to view it.',
  },
}

export function resolveAnswer(id: string, desk: DeskId, mode: Mode): Resolved {
  const answer = ANSWERS[id]
  if (!answer) return { state: 'denied', message: 'No answer for that question.' }
  if (!answer.desks.includes(desk)) {
    return { state: 'denied', message: answer.denied }
  }
  if (answer.redactedFor.includes(desk) && answer.redacted) {
    return { state: 'redacted', variant: answer.redacted }
  }
  if (mode === 'deep') {
    return { state: 'answered', variant: answer.deep, correction: answer.deep.correction }
  }
  return { state: 'answered', variant: answer[mode] }
}
