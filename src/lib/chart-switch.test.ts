import { describe, it, expect } from 'vitest'
import {
  RANKED_BAR_MAX_CATEGORIES, asBars, asLine, asTable, barShape,
  nativeType, parseCell, plottable, switchOptions,
} from './chart-switch'
import type { Viz } from './types'
import { ANSWERS } from './answers'

const bars: Viz = {
  kind: 'bars',
  title: 'Dividend yield, listed banks',
  rows: [
    { label: 'COMB', value: 9.4, display: '9.4%' },
    { label: 'HNB', value: 8.1, display: '8.1%' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

const signed: Viz = {
  kind: 'signedBars',
  title: 'Foreign net, this week',
  rows: [
    { label: 'COMB', value: 96, display: '+Rs 96M' },
    { label: 'NTB', value: -12, display: '−Rs 12M' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

const paired: Viz = {
  kind: 'pairedBars',
  title: 'COMB vs HNB',
  series: ['COMB', 'HNB'],
  rows: [
    { label: 'P/E (x)', a: 6.2, b: 5.4, aDisplay: '6.2x', bDisplay: '5.4x' },
    { label: 'Dividend yield', a: 9.4, b: 8.1, aDisplay: '9.4%', bDisplay: '8.1%' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

const line: Viz = {
  kind: 'line',
  title: 'Revenue against turnover',
  xLabels: ['Sep', 'Oct', 'Nov'],
  series: [
    { name: 'Brokerage revenue', points: [61.2, 64.8, 66.1], accent: '' },
    { name: 'Market turnover', points: [2.4, 2.6, 2.7], accent: '' },
  ],
  source: 'Source: your brokerage ledger',
  caption: 'Illustrative values',
}

const table: Viz = {
  kind: 'table',
  title: 'Gain since purchase, A/C 10482',
  columns: ['Holding', 'Gain', 'Gain %'],
  rows: [
    ['COMB', '+Rs 1.2M', '+8.4%'],
    ['JKH', '−Rs 0.3M', '−2.1%'],
  ],
  source: 'Source: your client records',
  caption: 'Illustrative values',
}

const movers: Viz = {
  kind: 'movers',
  title: 'Top movers',
  rows: [
    { code: 'JKH', value: 6.2, display: '+6.2%' },
    { code: 'DIAL', value: -3.1, display: '−3.1%' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

describe('parseCell', () => {
  it('reads a plain number', () => {
    expect(parseCell('9.4')).toBe(9.4)
  })

  // The copy rules use U+2212 MINUS in a negative figure, not a hyphen. A
  // parser that only knew the hyphen would read every loss in the demo as a
  // gain, which is the one arithmetic error nobody would notice in a chart.
  it('reads the MINUS sign the copy rules use, not just a hyphen', () => {
    expect(parseCell('−3.1%')).toBe(-3.1)
    expect(parseCell('-3.1%')).toBe(-3.1)
  })

  it('keeps a leading plus positive', () => {
    expect(parseCell('+6.2%')).toBe(6.2)
  })

  it('drops the currency prefix and the thousands separators', () => {
    expect(parseCell('+Rs 174,000')).toBe(174_000)
  })

  // Within one column the demo happens to use one unit throughout, but a
  // column that mixed them would rank 800K above 1.2M without this.
  it('scales the magnitude suffixes so mixed units still compare', () => {
    expect(parseCell('Rs 800K')).toBe(800_000)
    expect(parseCell('Rs 1.2M')).toBe(1_200_000)
    expect(parseCell('Rs 2.4Bn')).toBe(2_400_000_000)
    expect(parseCell('Rs 800K')! < parseCell('Rs 1.2M')!).toBe(true)
  })

  it('reads a multiple', () => {
    expect(parseCell('6.2x')).toBe(6.2)
  })

  it('returns null for a cell that holds no number', () => {
    expect(parseCell('Name withheld')).toBeNull()
    expect(parseCell('')).toBeNull()
  })
})

describe('nativeType', () => {
  it('names the type each figure kind was built as', () => {
    expect(nativeType(bars)).toBe('bar')
    expect(nativeType(signed)).toBe('bar')
    expect(nativeType(paired)).toBe('bar')
    expect(nativeType(line)).toBe('line')
    expect(nativeType(table)).toBe('table')
    expect(nativeType(movers)).toBe('list')
  })
})

describe('plottable', () => {
  it('reduces single-series bars to labels and one series', () => {
    const p = plottable(bars)!
    expect(p.labels).toEqual(['COMB', 'HNB'])
    expect(p.series).toHaveLength(1)
    expect(p.series[0].points).toEqual([9.4, 8.1])
    expect(p.series[0].displays).toEqual(['9.4%', '8.1%'])
    expect(p.hasNegative).toBe(false)
  })

  it('flags a set that crosses zero, which is what picks the signed renderer', () => {
    expect(plottable(signed)!.hasNegative).toBe(true)
  })

  it('keeps both measures of a paired figure, with their own cells', () => {
    const p = plottable(paired)!
    expect(p.series.map((s) => s.name)).toEqual(['COMB', 'HNB'])
    expect(p.series[1].displays).toEqual(['5.4x', '8.1%'])
  })

  it('takes a line figure straight, one series per line', () => {
    const p = plottable(line)!
    expect(p.labels).toEqual(['Sep', 'Oct', 'Nov'])
    expect(p.series.map((s) => s.name)).toEqual(['Brokerage revenue', 'Market turnover'])
  })

  it('takes a movers list as a ranked series over its tickers', () => {
    const p = plottable(movers)!
    expect(p.labels).toEqual(['JKH', 'DIAL'])
    expect(p.series[0].displays).toEqual(['+6.2%', '−3.1%'])
    expect(p.hasNegative).toBe(true)
  })

  it('reads a table\'s numeric columns as series, keeping their own cells', () => {
    const p = plottable(table)!
    expect(p.labels).toEqual(['COMB', 'JKH'])
    expect(p.series.map((s) => s.name)).toEqual(['Gain', 'Gain %'])
    expect(p.series[0].points).toEqual([1_200_000, -300_000])
    expect(p.series[0].displays).toEqual(['+Rs 1.2M', '−Rs 0.3M'])
  })

  // A column with one unparseable cell would plot a hole where that row is,
  // and a chart with a silent gap is worse than a column that was not offered.
  it('drops a column that does not parse all the way down', () => {
    const withWords: Viz = {
      ...table,
      columns: ['Holding', 'Gain', 'Flag'],
      rows: [['COMB', '+Rs 1.2M', 'Above threshold'], ['JKH', '−Rs 0.3M', 'Below']],
    }
    expect(plottable(withWords)!.series.map((s) => s.name)).toEqual(['Gain'])
  })

  it('returns nothing for a table with no numeric column at all', () => {
    const words: Viz = {
      ...table,
      columns: ['Manager', 'Flag'],
      rows: [['D. Silva', 'Above threshold']],
    }
    expect(plottable(words)).toBeNull()
  })

  it('stops at two series, since the demo draws at most two value axes', () => {
    const three: Viz = {
      ...table,
      columns: ['Holding', 'A', 'B', 'C'],
      rows: [['COMB', '1', '2', '3']],
    }
    expect(plottable(three)!.series).toHaveLength(2)
  })
})

describe('switchOptions', () => {
  it('offers bar, line, area and table, and marks the current one', () => {
    const options = switchOptions(bars, 'bar')
    expect(options.map((o) => o.type)).toEqual(['bar', 'line', 'area', 'table'])
    expect(options.filter((o) => o.isCurrent).map((o) => o.type)).toEqual(['bar'])
  })

  it('puts a figure\'s own type first when it is not one of the four', () => {
    const options = switchOptions(movers, 'list')
    expect(options.map((o) => o.type)).toEqual(['list', 'bar', 'line', 'area', 'table'])
    expect(options[0].isCurrent).toBe(true)
  })

  it('follows the selection, not the figure', () => {
    const options = switchOptions(bars, 'area')
    expect(options.filter((o) => o.isCurrent).map((o) => o.type)).toEqual(['area'])
  })

  // The product gates the same affordance the same way: SWITCH_ELIGIBLE_CURRENT
  // excludes the widgets there is nothing to switch. An empty list means the
  // header renders no switcher at all.
  it('offers nothing for a figure with no numbers in it', () => {
    const words: Viz = {
      ...table,
      columns: ['Manager', 'Flag'],
      rows: [['D. Silva', 'Above threshold']],
    }
    expect(switchOptions(words, 'table')).toEqual([])
  })
})

describe('projections', () => {
  it('carries the figure\'s own cells into the table, never reformatted', () => {
    const t = asTable(signed, plottable(signed)!)
    expect(t.columns).toEqual(['Name', 'Value'])
    expect(t.rows).toEqual([['COMB', '+Rs 96M'], ['NTB', '−Rs 12M']])
    expect(t.source).toBe(signed.source)
  })

  it('names both series as the table\'s columns', () => {
    expect(asTable(table, plottable(table)!).columns).toEqual(['Name', 'Gain', 'Gain %'])
  })

  it('picks the signed bar renderer when the set crosses zero', () => {
    expect(asBars(signed, plottable(signed)!).kind).toBe('signedBars')
    expect(asBars(bars, plottable(bars)!).kind).toBe('bars')
  })

  it('turns any figure into lines over its own labels', () => {
    const l = asLine(bars, plottable(bars)!)
    expect(l.xLabels).toEqual(['COMB', 'HNB'])
    expect(l.series[0].points).toEqual([9.4, 8.1])
  })
})

describe('barShape', () => {
  it('ranks a short single-series set', () => {
    expect(barShape(plottable(bars)!)).toBe('ranked')
  })

  // Two series never take the grouped-bars renderer, however few categories
  // there are: it hides its value axis, and a projection cannot promise the
  // two measures are the same size. Feeding it 174,000 against 15.8 drew the
  // percentages nought pixels tall.
  it('columns a two-series set however short it is', () => {
    expect(barShape(plottable(paired)!)).toBe('columns')
    expect(barShape(plottable(table)!)).toBe('columns')
  })

  it('gives a two-series projection one axis per series, so neither flattens', () => {
    const l = asLine(table, plottable(table)!)
    expect(l.series.map((s) => s.name)).toEqual(['Gain', 'Gain %'])
    // The two ranges differ by four orders of magnitude, which is exactly the
    // case a single shared axis cannot draw.
    expect(Math.max(...l.series[0].points)).toBeGreaterThan(1_000_000)
    expect(Math.max(...l.series[1].points)).toBeLessThan(100)
  })

  // Twelve months of revenue drawn as twelve stacked rows reads as a list, not
  // a chart, so a wide set goes to a column axis instead.
  it('columns a set with more categories than a ranked list reads', () => {
    const wide: Viz = {
      ...bars,
      rows: Array.from({ length: RANKED_BAR_MAX_CATEGORIES + 1 }, (_, i) => ({
        label: `M${i}`, value: i + 1, display: `${i + 1}`,
      })),
    }
    expect(barShape(plottable(wide)!)).toBe('columns')
  })
})

// The switcher exists for the demo's own six questions, so every figure any of
// them can return has to be switchable. A figure the menu cannot offer anything
// for would silently lose its controls in front of a client.
describe('the six questions', () => {
  const vizzes = Object.values(ANSWERS).flatMap((a) =>
    [a.quick, a.auto, a.deep].map((v) => v.viz).filter((v): v is Viz => Boolean(v)),
  )

  it('finds a figure to check', () => {
    expect(vizzes.length).toBeGreaterThan(0)
  })

  it('can plot and switch every figure the answers return', () => {
    for (const viz of vizzes) {
      expect(plottable(viz), viz.title).not.toBeNull()
      expect(switchOptions(viz, nativeType(viz)).length, viz.title).toBeGreaterThan(1)
    }
  })
})
