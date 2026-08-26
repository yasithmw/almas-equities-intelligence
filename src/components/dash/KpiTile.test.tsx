import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import KpiTile from './KpiTile'
import styles from './KpiTile.module.css'
import type { KpiSpec } from '@/lib/types'

describe('KpiTile', () => {
  it('renders the label and value', () => {
    const { getByText } = render(<KpiTile spec={{ label: 'ASPI', value: '16,240' }} />)
    expect(getByText('ASPI')).toBeDefined()
    expect(getByText('16,240')).toBeDefined()
  })

  it('renders an up delta with its arrow', () => {
    const spec: KpiSpec = { label: 'ASPI', value: '16,240', delta: '0.6% today', dir: 'up' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('▲ 0.6% today')).toBeDefined()
  })

  it('renders a down delta with its arrow', () => {
    const spec: KpiSpec = { label: 'Turnover', value: 'Rs 2.6B', delta: '4.1% today', dir: 'down' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('▼ 4.1% today')).toBeDefined()
  })

  it('omits the delta line entirely when no delta is given', () => {
    const { container } = render(<KpiTile spec={{ label: 'Turnover', value: 'Rs 3.2B' }} />)
    expect(container.textContent).not.toContain('▲')
    expect(container.textContent).not.toContain('▼')
  })

  it('Ruling R14: colours the value itself up when valueDir is "up", matching Exhibit C\'s Foreign net tile', () => {
    const spec: KpiSpec = { label: 'Foreign net', value: '+Rs 412M', valueDir: 'up' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('+Rs 412M').className).toContain(styles.up)
  })

  it('Ruling R14: colours the value itself down when valueDir is "down"', () => {
    const spec: KpiSpec = { label: 'Foreign net', value: '−Rs 88M', valueDir: 'down' }
    const { getByText } = render(<KpiTile spec={spec} />)
    expect(getByText('−Rs 88M').className).toContain(styles.down)
  })

  it('leaves the value uncoloured when valueDir is not set', () => {
    const { getByText } = render(<KpiTile spec={{ label: 'ASPI', value: '16,240' }} />)
    const value = getByText('16,240')
    expect(value.className).not.toContain(styles.up)
    expect(value.className).not.toContain(styles.down)
  })

  it('never renders an em dash', () => {
    const spec: KpiSpec = { label: 'Turnover', value: 'Rs 3.2B', delta: 'vs Rs 2.8B avg' }
    const { container } = render(<KpiTile spec={spec} />)
    expect(container.textContent).not.toContain('—')
  })
})
