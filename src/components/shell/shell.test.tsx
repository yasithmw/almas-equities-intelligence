import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoShell from './DemoShell'

describe('shell', () => {
  it('shows the tenant mark and the account avatar, and no desk controls', () => {
    render(<DemoShell />)
    expect(screen.getByAltText('Almas Equities')).toBeDefined()
    expect(screen.getByLabelText('Account')).toBeDefined()
    // The header's desk switcher was removed at the user's request, so the
    // demo runs on the default desk. The scoping rules behind it are still
    // live (see desks.ts and the dashboards suite), just not switchable
    // from the chrome.
    expect(screen.queryByTestId('active-desk')).toBeNull()
    expect(screen.queryByText('A. Jayawardena')).toBeNull()
  })

  it('shows the demo band, with no way to dismiss it', () => {
    render(<DemoShell />)
    const band = screen.getByRole('note')
    expect(band.textContent).toMatch(/illustrative data, not Almas Equities data/i)
    expect(band.querySelector('button')).toBeNull()
  })

  it('routes between chat and dashboards from the sidebar', async () => {
    const user = userEvent.setup()
    render(<DemoShell />)
    await user.click(screen.getByRole('button', { name: /^dashboards$/i }))
    expect(screen.getByRole('heading', { name: /market overview/i })).toBeDefined()
    await user.click(screen.getByRole('button', { name: /^chat$/i }))
    expect(screen.getByPlaceholderText(/ask about any stock/i)).toBeDefined()
  })

  it('renders no em dash in its chrome', () => {
    const { container } = render(<DemoShell />)
    expect(container.textContent).not.toContain('\u2014')
  })
})
