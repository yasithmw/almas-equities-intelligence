import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import PanelCard from './PanelCard'

describe('PanelCard', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <PanelCard>
        <span>Inner content</span>
      </PanelCard>,
    )
    expect(getByText('Inner content')).toBeDefined()
  })

  it('spans one grid column by default', () => {
    const { container } = render(
      <PanelCard>
        <span>x</span>
      </PanelCard>,
    )
    expect(container.firstElementChild!.className).toContain('col-span-1')
  })

  // The span used to be an inline `gridColumn: span N`, a single fixed
  // number that could not narrow: a span-4 KPI row inside the two-column
  // grid asked for four tracks that were not there and pushed the page
  // sideways. Each width is declared per breakpoint now, so the widest
  // panel is full width in all three grids and overflows none of them.
  it('spans the requested width at xl, and never more than the grid has at each breakpoint', () => {
    const { container } = render(
      <PanelCard span={4}>
        <span>x</span>
      </PanelCard>,
    )
    const className = container.firstElementChild!.className
    expect(className).toContain('col-span-1')
    expect(className).toContain('md:col-span-2')
    expect(className).toContain('xl:col-span-4')
    expect((container.firstElementChild as HTMLElement).style.gridColumn).toBe('')
  })

  it('Ruling R13: renders a data-testid when one is supplied', () => {
    const { container } = render(
      <PanelCard testId="panel-market">
        <span>x</span>
      </PanelCard>,
    )
    expect(container.firstElementChild!.getAttribute('data-testid')).toBe('panel-market')
  })

  it('Ruling R13: renders no data-testid when none is supplied', () => {
    const { container } = render(
      <PanelCard>
        <span>x</span>
      </PanelCard>,
    )
    expect(container.firstElementChild!.hasAttribute('data-testid')).toBe(false)
  })

  it('Ruling R13: owns no chrome of its own (no border, padding or background), that is VizBlock/KpiTile\'s job', () => {
    const { container } = render(
      <PanelCard>
        <span>x</span>
      </PanelCard>,
    )
    // Layout only: a column span and a min-width reset, nothing that
    // draws. Border, background, padding, radius and shadow belong to
    // VizBlock and KpiTile, which is the whole of Ruling R13.
    for (const chrome of ['border', 'bg-', 'p-', 'px-', 'py-', 'rounded', 'shadow', 'ring']) {
      expect(container.firstElementChild!.className).not.toContain(chrome)
    }
  })
})
