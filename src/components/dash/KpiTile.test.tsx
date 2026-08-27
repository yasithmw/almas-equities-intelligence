import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import KpiTile from './KpiTile'
import type { KpiSpec } from '@/lib/types'

describe('KpiTile', () => {
  it('renders the label and value', () => {
    const { getByText } = render(<KpiTile spec={{ label: 'ASPI', value: '16,240' }} />)
    expect(getByText('ASPI')).toBeDefined()
    expect(getByText('16,240')).toBeDefined()
  })

  // The direction glyph is a real icon rather than a text triangle, so it
  // is asserted as one: the delta line carries its tone class and an svg.
  it('renders an up delta with its arrow', () => {
    const spec: KpiSpec = { label: 'ASPI', value: '16,240', delta: '0.6% today', dir: 'up' }
    const { getByText, container } = render(<KpiTile spec={spec} />)
    const delta = getByText('0.6% today')
    expect(delta.className).toContain('text-success')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders a down delta with its arrow', () => {
    const spec: KpiSpec = { label: 'Turnover', value: 'Rs 2.6B', delta: '4.1% today', dir: 'down' }
    const { getByText, container } = render(<KpiTile spec={spec} />)
    const delta = getByText('4.1% today')
    expect(delta.className).toContain('text-danger')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('omits the delta line, and its arrow, entirely when no delta is given', () => {
    const { container } = render(<KpiTile spec={{ label: 'Turnover', value: 'Rs 3.2B' }} />)
    expect(container.textContent).toBe('TurnoverRs 3.2B')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('Ruling R14: colours the value itself up when valueDir is "up", matching Exhibit C\'s Foreign net tile', () => {
    const spec: KpiSpec = { label: 'Foreign net', value: '+Rs 412M', valueDir: 'up' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('+Rs 412M').className).toContain('text-success')
  })

  it('Ruling R14: colours the value itself down when valueDir is "down"', () => {
    const spec: KpiSpec = { label: 'Foreign net', value: '−Rs 88M', valueDir: 'down' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('\u2212Rs 88M').className).toContain('text-danger')
  })

  it('leaves the value uncoloured when valueDir is not set', () => {
    const { getByText } = render(<KpiTile spec={{ label: 'ASPI', value: '16,240' }} />)
    const value = getByText('16,240')
    expect(value.className).not.toContain('text-success')
    expect(value.className).not.toContain('text-danger')
    expect(value.className).toContain('text-foreground')
  })

  it('never renders an em dash', () => {
    const spec: KpiSpec = { label: 'Turnover', value: 'Rs 3.2B', delta: 'vs Rs 2.8B avg' }
    const { container } = render(<KpiTile spec={spec} />)
    expect(container.textContent).not.toContain('—')
  })
})
