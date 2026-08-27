import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoShell from '../shell/DemoShell'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

async function openDashboards() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('button', { name: /^dashboards$/i }))
  return user
}

describe('dashboards pane', () => {
  it('lists the three dashboards', async () => {
    render(<DemoShell />)
    await openDashboards()
    for (const name of [/market overview/i, /client book/i, /firm performance/i]) {
      expect(screen.getByRole('button', { name })).toBeDefined()
    }
  })

  it('locks Firm Performance on the dealing desk and says which desk can view it', async () => {
    render(<DemoShell initialDesk="dealing" />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /^dashboards$/i }))
    const card = screen.getByTestId('dash-card-firm')
    expect(card.textContent).toMatch(/switch desk to view/i)
  })

  it('leaves Firm Performance open on management', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.click(screen.getByRole('button', { name: /firm performance/i }))
    await waitFor(() =>
      expect(screen.getByText(/MTD brokerage revenue/i)).toBeDefined())
  })

  it('recomputes panels when the sector filter changes', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.click(screen.getByRole('button', { name: /market overview/i }))
    const before = screen.getByTestId('panel-movers').textContent
    await user.selectOptions(screen.getByLabelText(/sector/i), 'Banks')
    await waitFor(() =>
      expect(screen.getByTestId('panel-movers').textContent).not.toBe(before))
  })

  // Fix round 2: Client Book and Firm Performance accepted a filters
  // argument but never varied their panels by it, so Sector/Period
  // rendered as live, clickable controls a client could click within
  // ten seconds of opening either and see nothing happen. Removed
  // rather than faked: neither renders a <select> at all now, while
  // Market Overview (which genuinely recomputes on Sector/Period,
  // proven above) still does.
  it('shows no filter controls on Client Book or Firm Performance, but keeps them on Market Overview', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    const back = () => user.click(screen.getByRole('button', { name: /all dashboards/i }))

    await user.click(screen.getByRole('button', { name: /client book/i }))
    expect(document.querySelectorAll('select').length).toBe(0)
    await back()

    await user.click(screen.getByRole('button', { name: /firm performance/i }))
    expect(document.querySelectorAll('select').length).toBe(0)
    await back()

    await user.click(screen.getByRole('button', { name: /market overview/i }))
    expect(document.querySelectorAll('select').length).toBe(2)
  })
})
