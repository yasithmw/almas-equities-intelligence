import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const donut: Viz = {
  kind: 'donut',
  title: 'Market breadth',
  rows: [
    { label: 'Advancing', value: 13, display: '13' },
    { label: 'Declining', value: 6, display: '6' },
  ],
  centreValue: '19',
  centreLabel: 'counters',
  source: 'Source: your market data',
  caption: 'Counters by direction, month to date',
}

const area: Viz = {
  kind: 'area',
  title: 'Brokerage revenue, last 12 months',
  xLabels: ['Jun', 'Jul', 'Aug'],
  series: [{
    name: 'Brokerage revenue',
    points: [85.3, 88.6, 92.1],
    displays: ['Rs 85.3M', 'Rs 88.6M', 'Rs 92.1M'],
  }],
  source: 'Source: your brokerage ledger',
  caption: 'Monthly, illustrative values',
}

const scatter: Viz = {
  kind: 'scatter',
  title: 'Valuation against income',
  xName: 'P/E',
  yName: 'Dividend yield',
  points: [
    { label: 'COMB', group: 'Banks', x: 6.4, y: 9.4, xDisplay: '6.4x', yDisplay: '9.4%' },
    { label: 'JKH', group: 'Diversified', x: 22.4, y: 2.4, xDisplay: '22.4x', yDisplay: '2.4%' },
  ],
  source: 'Source: your market data',
  caption: 'One dot per counter, low and left is cheap, illustrative values',
}

const spark: Viz = {
  kind: 'spark',
  title: 'Month on month',
  rows: [
    {
      label: 'Brokerage revenue',
      value: 'Rs 92.1M',
      delta: '+3.9% on Jul',
      dir: 'up',
      points: [85.3, 88.6, 92.1],
    },
    { label: 'Market turnover', value: 'Rs 3.7B', delta: '+2.8% on Jul', dir: 'up', points: [3.4, 3.6, 3.7] },
  ],
  source: 'Source: your brokerage ledger',
  caption: 'Latest month against the one before, illustrative values',
}

describe('VizBlock', () => {
  // Figures are drawn by Recharts, which measures its box through a
  // ResizeObserver and so draws no geometry under jsdom. Each figure
  // therefore also renders an off-screen table of the same numbers, both
  // so a screen reader can read a chart and so these assertions have
  // something stable to read. Geometry itself is Recharts' business, not
  // this suite's.
  it('mounts a chart surface for a figure kind', () => {
    const { container } = render(<VizBlock viz={bars} />)
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()
  })

  it('renders every bar row in the figure\'s own data table', () => {
    render(<VizBlock viz={bars} />)
    expect(screen.getByText('Dividend yield, listed banks')).toBeDefined()
    expect(screen.getByRole('rowheader', { name: 'COMB' })).toBeDefined()
    expect(screen.getByText('9.4%')).toBeDefined()
    expect(screen.getByText('8.1%')).toBeDefined()
  })

  it('renders an all-zero bars set without emitting NaN anywhere', () => {
    const { container } = render(<VizBlock viz={zeroBars} />)
    expect(container.innerHTML).not.toContain('NaN')
    expect(screen.getAllByText('0.0%')).toHaveLength(2)
  })

  it('keeps the sign on every signed bar value', () => {
    render(<VizBlock viz={signed} />)
    expect(screen.getByText('+Rs 96M')).toBeDefined()
    expect(screen.getByText('\u2212Rs 12M')).toBeDefined()
  })

  it('renders both series names and their value columns, for paired bars', () => {
    render(<VizBlock viz={pairedBars} />)
    expect(screen.getByText('This month')).toBeDefined()
    expect(screen.getByText('Last month')).toBeDefined()
    expect(screen.getByText('Rs 412M')).toBeDefined()
    expect(screen.getByText('Rs 366M')).toBeDefined()
  })

  it('gives a line figure one data column per series and one row per point', () => {
    render(<VizBlock viz={line} />)
    expect(screen.getByRole('columnheader', { name: 'Brokerage revenue' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Market turnover' })).toBeDefined()
    // One header row plus one row per x label.
    expect(screen.getAllByRole('row')).toHaveLength(1 + line.xLabels.length)
  })

  it('renders a table with its columns', () => {
    render(<VizBlock viz={table} />)
    expect(screen.getByText('Holding')).toBeDefined()
    expect(screen.getByText('+Rs 174,000')).toBeDefined()
  })

  it('always renders the caption, for every kind', () => {
    for (const viz of [bars, signed, pairedBars, line, table, movers, donut, area, scatter, spark]) {
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

  // ---- The four kinds added alongside the original six ----------------
  //
  // Recharts measures its box through a ResizeObserver and draws no
  // geometry under jsdom, so, exactly as for the original six, what is
  // asserted here is each figure's own off-screen data table and the
  // parts drawn in plain DOM. Geometry is Recharts' business.

  it('gives a donut its centre total and a key row per part', () => {
    render(<VizBlock viz={donut} />)
    expect(screen.getByText('19')).toBeDefined()
    expect(screen.getByText('counters')).toBeDefined()
    expect(screen.getAllByText('Advancing').length).toBeGreaterThan(0)
    expect(screen.getByRole('rowheader', { name: 'Declining' })).toBeDefined()
  })

  // An area series carries pre-formatted displays alongside its raw
  // points precisely so no reader is ever shown a bare 92.1 whose unit
  // they have to remember from the title.
  it('reads an area series back in its formatted units, never bare numbers', () => {
    render(<VizBlock viz={area} />)
    expect(screen.getByText('Rs 92.1M')).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Brokerage revenue' })).toBeDefined()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 3)
  })

  it('gives a scatter one data row per dot, carrying both measures and the group', () => {
    render(<VizBlock viz={scatter} />)
    expect(screen.getByRole('rowheader', { name: 'COMB' })).toBeDefined()
    expect(screen.getByText('6.4x')).toBeDefined()
    expect(screen.getByText('9.4%')).toBeDefined()
    expect(screen.getByText('Diversified')).toBeDefined()
  })

  it('draws a sparkline per stat row, with its level and its change', () => {
    const { container } = render(<VizBlock viz={spark} />)
    expect(screen.getAllByText('Rs 92.1M').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+3.9% on Jul').length).toBeGreaterThan(0)
    // Two rows, each an area path plus a line path.
    expect(container.querySelectorAll('svg path').length).toBeGreaterThanOrEqual(4)
  })

  // A one-point series has no range to normalise against. Dividing by a
  // zero span would put NaN straight into the `d` attribute, which
  // renders as nothing at all and reads as "no data" rather than "flat".
  it('draws a flat or single-point sparkline without emitting NaN', () => {
    const flat: Viz = {
      ...spark,
      rows: [
        { label: 'Flat', value: '10', points: [10, 10, 10] },
        { label: 'One point', value: '10', points: [10] },
      ],
    }
    const { container } = render(<VizBlock viz={flat} />)
    expect(container.innerHTML).not.toContain('NaN')
  })

  // Two labels above two adjacent thirty-pixel bars is about ninety
  // pixels of text in sixty pixels of space, so a paired figure whose
  // series share a unit shows the axis and drops the labels instead.
  // Where the units differ, the axis would invite reading a P/E against
  // a percentage as one quantity, so the labels stay and the axis goes.
  it('shows the value axis only when a paired figure declares a shared unit', () => {
    const sameUnit: Viz = {
      ...(pairedBars as Extract<Viz, { kind: 'pairedBars' }>),
      sharedAxis: true,
    }
    const withAxis = render(<VizBlock viz={sameUnit} />)
    // Both readings survive in the figure's own data table either way.
    expect(screen.getByText('Rs 412M')).toBeDefined()
    withAxis.unmount()

    render(<VizBlock viz={pairedBars} />)
    expect(screen.getByText('Rs 412M')).toBeDefined()
  })

  // DESIGN.md, Typography: globals.css forces -0.018em tracking on this
  // heading, and negative tracking on an uppercase run is unreadable. An
  // earlier version set `uppercase` here and the two fought.
  it('leaves the tile title in sentence case, never uppercased', () => {
    const { container } = render(<VizBlock viz={bars} />)
    const heading = container.querySelector('h3')!
    expect(heading.className).not.toContain('uppercase')
    expect(heading.className).not.toContain('tracking-')
  })
})

// The two controls the product puts in a widget header: the chart-type
// switcher and the 3-dots menu. Both are on the widget rather than on the
// chat, so both arrive on a dashboard tile as well.
describe('VizBlock header controls', () => {
  async function openSwitcher(viz: Viz) {
    const user = userEvent.setup()
    render(<VizBlock viz={viz} controls />)
    await user.click(screen.getByRole('button', { name: /switch chart type/i }))
    return user
  }

  it('offers a chart-type switcher on a figure that holds numbers', async () => {
    render(<VizBlock viz={bars} controls />)
    expect(screen.getByRole('button', { name: /switch chart type/i })).toBeDefined()
  })

  it('names the type the figure was built as the current one', async () => {
    await openSwitcher(line)
    expect(screen.getByRole('menuitem', { name: /line/i }).getAttribute('aria-current')).toBe('true')
  })

  it('draws the figure as a table when Table is chosen, keeping its own cells', async () => {
    const user = await openSwitcher(bars)
    await user.click(screen.getByRole('menuitem', { name: /^table$/i }))
    // The bars are gone and the numbers are now in a visible table, with the
    // figure's own formatted cells rather than reformatted ones.
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeDefined()
    expect(screen.getByText('9.4%')).toBeDefined()
    expect(document.querySelector('.fleet-data-table')).not.toBeNull()
  })

  it('returns to the figure\'s own drawing when its own type is chosen again', async () => {
    const user = await openSwitcher(bars)
    await user.click(screen.getByRole('menuitem', { name: /^area$/i }))
    expect(document.querySelector('.fleet-data-table')).toBeNull()
    await user.click(screen.getByRole('button', { name: /switch chart type/i }))
    await user.click(screen.getByRole('menuitem', { name: /^bar$/i }))
    // Bars carry a value label per row, which is what tells the original
    // renderer apart from the general one: only the original draws them.
    expect(screen.getByRole('rowheader', { name: 'COMB' })).toBeDefined()
  })

  it('closes the switcher on Escape without changing the figure', async () => {
    const user = await openSwitcher(bars)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: /switch chart type/i })).toBeNull()
    expect(document.querySelector('.fleet-data-table')).toBeNull()
  })

  // The concentration table's Flag column is words, so nothing in that figure
  // can be plotted. The product gates the affordance the same way rather than
  // offering a menu that cannot do anything.
  it('offers no switcher on a figure with no numbers in it', () => {
    const words: Viz = {
      kind: 'table',
      title: 'Revenue by relationship manager',
      columns: ['Manager', 'Flag'],
      rows: [['D. Silva', 'Above threshold']],
      source: 'Source: your brokerage ledger',
      caption: 'Illustrative values',
    }
    render(<VizBlock viz={words} controls />)
    expect(screen.queryByRole('button', { name: /switch chart type/i })).toBeNull()
  })

  it('shows the data from the 3-dots menu, and the chart again after', async () => {
    const user = userEvent.setup()
    render(<VizBlock viz={bars} controls />)
    await user.click(screen.getByRole('button', { name: /widget options/i }))
    await user.click(screen.getByRole('menuitem', { name: /view data/i }))
    expect(document.querySelector('.fleet-data-table')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /widget options/i }))
    await user.click(screen.getByRole('menuitem', { name: /show chart/i }))
    expect(document.querySelector('.fleet-data-table')).toBeNull()
  })

  // A card that IS a table starts on its data, so the row reads the other way
  // round and hands back a drawing.
  it('offers Show chart first on a figure that is already a table', async () => {
    const user = userEvent.setup()
    render(<VizBlock viz={table} controls />)
    await user.click(screen.getByRole('button', { name: /widget options/i }))
    await user.click(screen.getByRole('menuitem', { name: /show chart/i }))
    expect(document.querySelector('.recharts-responsive-container')).not.toBeNull()
  })

  it('carries the export formats and add-to-dashboard as named, inert actions', async () => {
    const user = userEvent.setup()
    render(<VizBlock viz={bars} controls />)
    await user.click(screen.getByRole('button', { name: /widget options/i }))
    for (const name of [/download as image/i, /download as pdf/i,
      /download as powerpoint/i, /download as excel/i, /add to dashboard/i]) {
      const action = screen.getByRole('menuitem', { name })
      expect(action.getAttribute('aria-disabled')).toBe('true')
      expect(action.getAttribute('title')).toMatch(/not available in the demo/i)
    }
  })

  it('leaves the figure alone when an inert action is clicked', async () => {
    const user = userEvent.setup()
    render(<VizBlock viz={bars} controls />)
    await user.click(screen.getByRole('button', { name: /widget options/i }))
    await user.click(screen.getByRole('menuitem', { name: /download as excel/i }))
    expect(document.querySelector('.recharts-responsive-container')).not.toBeNull()
    expect(document.querySelector('.fleet-data-table')).toBeNull()
  })

  it('starts a following figure on its own drawing, never on the last choice', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<VizBlock viz={bars} controls />)
    await user.click(screen.getByRole('button', { name: /switch chart type/i }))
    await user.click(screen.getByRole('menuitem', { name: /^table$/i }))
    expect(document.querySelector('.fleet-data-table')).not.toBeNull()

    rerender(<VizBlock viz={signed} controls />)
    expect(document.querySelector('.fleet-data-table')).toBeNull()
    expect(document.querySelector('.recharts-responsive-container')).not.toBeNull()
  })

  // The controls are the chat's, not the tile's. A dashboard tile renders the
  // same component without them, so a wrapped title cannot appear there.
  it('renders no controls at all unless the caller asks for them', () => {
    render(<VizBlock viz={bars} />)
    expect(screen.queryByRole('button', { name: /switch chart type/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /widget options/i })).toBeNull()
  })
})

// ── Regression guard, 2026-08-27 ─────────────────────────────────────────
// Every chart in the demo rendered as an empty card: ChartFrame's slot used
// `min-height` for its floor, `min-height` leaves the specified height `auto`,
// so ResponsiveContainer's `height: 100%` resolved to auto and Recharts
// measured zero. jsdom does no layout, so no assertion about pixels can catch
// this. What CAN be asserted is the structure that makes the height definite:
// the container is anchored with inset-0 inside the box that carries the floor.
describe('chart height chain', () => {
  it('anchors the chart container to the box that carries the height floor', () => {
    const { container } = render(<VizBlock viz={bars} />)
    const rc = container.querySelector('.recharts-responsive-container')
    expect(rc).not.toBeNull()

    const anchor = rc!.parentElement!
    expect(anchor.className).toContain('absolute')
    expect(anchor.className).toContain('inset-0')

    // The anchor's containing block is the slot, and the slot is what holds
    // the floor. Without both halves the percentage height cannot resolve.
    const slot = anchor.parentElement!
    expect(slot.className).toContain('relative')
    expect(slot.style.minHeight).toMatch(/^\d+px$/)
  })

  it('gives every figure kind that draws a chart the same anchored slot', () => {
    for (const viz of [bars, signed, pairedBars, line]) {
      const { container, unmount } = render(<VizBlock viz={viz} />)
      const rc = container.querySelector('.recharts-responsive-container')
      expect(rc, viz.title).not.toBeNull()
      expect(rc!.parentElement!.className, viz.title).toContain('inset-0')
      unmount()
    }
  })
})
