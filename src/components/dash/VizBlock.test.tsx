import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VizBlock from './VizBlock'
import type { Viz } from '@/lib/types'

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

const zeroBars: Viz = {
  kind: 'bars',
  title: 'Dividend yield, listed banks',
  rows: [
    { label: 'COMB', value: 0, display: '0.0%' },
    { label: 'HNB', value: 0, display: '0.0%' },
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

const pairedBars: Viz = {
  kind: 'pairedBars',
  title: 'Turnover by ticker, this month against last',
  series: ['This month', 'Last month'],
  rows: [
    { label: 'COMB', a: 412, b: 366, aDisplay: 'Rs 412M', bDisplay: 'Rs 366M' },
    { label: 'JKH', a: 356, b: 298, aDisplay: 'Rs 356M', bDisplay: 'Rs 298M' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

const line: Viz = {
  kind: 'line',
  title: 'Revenue against turnover',
  xLabels: ['Sep', 'Oct', 'Nov'],
  series: [
    { name: 'Brokerage revenue', points: [61.2, 64.8, 66.1], accent: 'var(--navy)' },
    { name: 'Market turnover', points: [2.4, 2.6, 2.7], accent: 'var(--aqua)' },
  ],
  source: 'Source: your market data',
  caption: 'Each series scaled to its own range, values are illustrative',
}

const table: Viz = {
  kind: 'table',
  title: 'Gain since purchase',
  columns: ['Holding', 'Gain'],
  rows: [['COMB', '+Rs 174,000']],
  source: 'Source: your market data',
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

describe('VizBlock', () => {
  it('renders bar rows with their labels and values', () => {
    render(<VizBlock viz={bars} />)
    expect(screen.getByText('Dividend yield, listed banks')).toBeDefined()
    expect(screen.getByText('COMB')).toBeDefined()
    expect(screen.getByText('9.4%')).toBeDefined()
  })

  it('scales the longest bar to full width', () => {
    const { container } = render(<VizBlock viz={bars} />)
    const fills = container.querySelectorAll('[data-fill]')
    expect(fills[0].getAttribute('style')).toContain('100%')
  })

  it('guards an all-zero bars set: fills are empty, not NaN%', () => {
    const { container } = render(<VizBlock viz={zeroBars} />)
    const fills = container.querySelectorAll('[data-fill]')
    expect(fills.length).toBe(2)
    for (const fill of fills) {
      const style = fill.getAttribute('style') ?? ''
      expect(style).not.toContain('NaN')
      expect(style).toContain('0%')
    }
  })

  it('marks negative signed bars so they can be styled apart', () => {
    const { container } = render(<VizBlock viz={signed} />)
    expect(container.querySelectorAll('[data-sign="neg"]').length).toBe(1)
    expect(container.querySelectorAll('[data-sign="pos"]').length).toBe(1)
  })

  it('renders both series names and their value columns, for paired bars', () => {
    render(<VizBlock viz={pairedBars} />)
    expect(screen.getByText('This month')).toBeDefined()
    expect(screen.getByText('Last month')).toBeDefined()
    expect(screen.getByText('Rs 412M')).toBeDefined()
    expect(screen.getByText('Rs 366M')).toBeDefined()
  })

  it('draws one polyline per line series', () => {
    const { container } = render(<VizBlock viz={line} />)
    expect(container.querySelectorAll('polyline').length).toBe(2)
  })

  it('normalises each line series to its own range, so a smaller-scale series is not flattened', () => {
    const { container } = render(<VizBlock viz={line} />)
    const polylines = container.querySelectorAll('polyline')
    // series[1] (market turnover, ~2.4 to 2.7) sits on a wholly different
    // scale from series[0] (brokerage revenue, ~61 to 66). Under a single
    // shared min/max the turnover polyline would collapse to a near-flat
    // line at the bottom of the chart; independent normalisation keeps it
    // spread across the same vertical range as the revenue line.
    const ysOf = (el: Element) =>
      el
        .getAttribute('points')!
        .split(' ')
        .map((pt) => parseFloat(pt.split(',')[1]))
    const spread = (ys: number[]) => Math.max(...ys) - Math.min(...ys)
    const revenueSpread = spread(ysOf(polylines[0]))
    const turnoverSpread = spread(ysOf(polylines[1]))
    expect(turnoverSpread).toBeGreaterThan(20)
    expect(Math.abs(turnoverSpread - revenueSpread)).toBeLessThan(5)
  })

  it('renders a table with its columns', () => {
    render(<VizBlock viz={table} />)
    expect(screen.getByText('Holding')).toBeDefined()
    expect(screen.getByText('+Rs 174,000')).toBeDefined()
  })

  it('always renders the caption, for every kind', () => {
    for (const viz of [bars, signed, pairedBars, line, table, movers]) {
      const { unmount } = render(<VizBlock viz={viz} />)
      expect(screen.getByText(viz.caption)).toBeDefined()
      unmount()
    }
  })

  // Ruling 7 (task-8 brief): the movers gap. Ticker plus signed value,
  // no bar, routed through VizBlock the same as every other kind.
  it('renders movers with their ticker and signed value, no bar', () => {
    const { container } = render(<VizBlock viz={movers} />)
    expect(screen.getByText('Top movers')).toBeDefined()
    expect(screen.getByText('JKH')).toBeDefined()
    expect(screen.getByText('+6.2%')).toBeDefined()
    expect(container.querySelector('[data-fill]')).toBeNull()
  })

  it('renders no optional tag by default', () => {
    render(<VizBlock viz={bars} />)
    expect(screen.queryByText('Redacted')).toBeNull()
  })

  it('renders the optional tag next to the title when given one', () => {
    render(<VizBlock viz={table} tag="Redacted" />)
    expect(screen.getByText('Redacted')).toBeDefined()
  })

  it('renders each viz\'s own source as the left caption, never a hardcoded label', () => {
    const clientSourced: Viz = { ...table, source: 'Source: your client records' }
    render(<VizBlock viz={clientSourced} />)
    expect(screen.getByText('Source: your client records')).toBeDefined()
    expect(screen.queryByText('Source: your market data')).toBeNull()
  })

  it('never renders an em dash', () => {
    const { container } = render(<VizBlock viz={signed} />)
    expect(container.textContent).not.toContain('—')
  })
})
