import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoShell from './DemoShell'

describe('shell', () => {
  it('opens on the management desk', () => {
    render(<DemoShell />)
    expect(screen.getByRole('button', { name: /management/i })).toHaveProperty(
      'ariaPressed', 'true',
    )
  })

  it('shows the demo band, with no way to dismiss it', () => {
    render(<DemoShell />)
    const band = screen.getByRole('note')
    expect(band.textContent).toMatch(/illustrative data, not Almas Equities data/i)
    expect(band.querySelector('button')).toBeNull()
  })

  // Ruling R1: the brief's own assertion here, `getByText('R. Fernando')`,
  // passes even without the click, because the dealing desk's own switcher
  // button renders "R. Fernando" unconditionally (Task brief step 4:
  // DeskSwitcher shows label and person per desk). It also risks throwing
  // on multiple matches once the active-desk indicator exists alongside
  // the switcher. TopBar exposes the active desk via data-testid instead,
  // so the assertion actually exercises the click.
  it('switches desk when another is chosen', async () => {
    const user = userEvent.setup()
    render(<DemoShell />)
    await user.click(screen.getByRole('button', { name: /dealing/i }))
    expect(screen.getByTestId('active-desk').textContent).toContain('R. Fernando')
  })

  it('routes between chat and dashboards from the rail', async () => {
    const user = userEvent.setup()
    render(<DemoShell />)
    await user.click(screen.getByRole('button', { name: /^dashboards$/i }))
    expect(screen.getByRole('heading', { name: /market overview/i })).toBeDefined()
    await user.click(screen.getByRole('button', { name: /^chat$/i }))
    expect(screen.getByPlaceholderText(/ask about any stock/i)).toBeDefined()
  })

  it('renders no em dash in its chrome', () => {
    const { container } = render(<DemoShell />)
    expect(container.textContent).not.toContain('—')
  })
})
