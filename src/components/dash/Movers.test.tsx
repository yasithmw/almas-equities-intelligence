import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Movers from './Movers'
import type { MoversViz } from '@/lib/types'

const viz: MoversViz = {
  kind: 'movers',
  title: 'Top movers',
  rows: [
    { code: 'JKH', value: 6.2, display: '+6.2%' },
    { code: 'DIAL', value: -3.1, display: '−3.1%' },
  ],
  source: 'Source: your market data',
  caption: 'Illustrative values',
}

const ledgerViz: MoversViz = {
  kind: 'movers',
  title: 'Unrealised gain and loss',
  rows: [
    { code: 'A/C 10482', name: 'K. Wijesinghe', value: 219000, display: '+Rs 219,000' },
    { code: 'A/C 11907', name: 'Name withheld', nameMuted: true, value: 324000, display: '+Rs 324,000' },
  ],
  source: 'Source: your client records',
  caption: 'Illustrative values',
}

describe('Movers', () => {
  it('renders a ticker and its signed value, with no bar', () => {
    const { container } = render(<Movers viz={viz} />)
    expect(screen.getByText('JKH')).toBeDefined()
    expect(screen.getByText('+6.2%')).toBeDefined()
    expect(container.querySelector('[data-fill]')).toBeNull()
    expect(container.querySelector('i')).toBeNull()
  })

  it('colours a gain up and a loss down', () => {
    render(<Movers viz={viz} />)
    expect(screen.getByText('+6.2%').className).toContain('text-success')
    expect(screen.getByText('\u22123.1%').className).toContain('text-danger')
  })

  it('renders a second, optional line for a name', () => {
    render(<Movers viz={ledgerViz} />)
    expect(screen.getByText('K. Wijesinghe')).toBeDefined()
  })

  it('mutes a withheld name so a masked row still reads normally, just quieter', () => {
    render(<Movers viz={ledgerViz} />)
    expect(screen.getByText('Name withheld').className).toContain('italic')
  })

  it('omits the name line entirely when no name is given', () => {
    const { rerender } = render(<Movers viz={viz} />)
    expect(screen.queryAllByTestId('mover-name')).toHaveLength(0)
    rerender(<Movers viz={ledgerViz} />)
    expect(screen.queryAllByTestId('mover-name')).toHaveLength(2)
  })
})
