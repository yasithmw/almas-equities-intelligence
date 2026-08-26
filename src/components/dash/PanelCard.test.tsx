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
    expect((container.firstElementChild as HTMLElement).style.gridColumn).toBe('span 1')
  })

  it('spans the requested number of grid columns', () => {
    const { container } = render(
      <PanelCard span={2}>
        <span>x</span>
      </PanelCard>,
    )
    expect((container.firstElementChild as HTMLElement).style.gridColumn).toBe('span 2')
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
    expect(container.firstElementChild!.className).toBe('')
  })
})
