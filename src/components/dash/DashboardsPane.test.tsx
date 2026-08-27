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
    render(<DemoShell />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /dealing/i }))
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

  it('builds a fourth dashboard from a described request', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.type(
      screen.getByPlaceholderText(/describe a new dashboard/i),
      'foreign buying and selling by sector this quarter{Enter}',
    )
    vi.advanceTimersByTime(5000)
    await waitFor(() =>
      expect(screen.getByText(/Composed 4 widgets/i)).toBeDefined())
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /foreign buying and selling/i }))
        .toBeDefined())
  })

  // Fix round 1: the trigger case the coordinator flagged. A request
  // matching none of the three specs must never run the feed toward a
  // wrong dashboard; it gets the same "here is what I can build"
  // treatment chat gives an unmatched question.
  it('shows what it can build, not a wrong dashboard, for a request matching none of the three specs', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.type(
      screen.getByPlaceholderText(/describe a new dashboard/i),
      'hotel sector exposure{Enter}',
    )
    await waitFor(() =>
      expect(screen.getByText(/here is what I can build/i)).toBeDefined())
    expect(screen.queryByText(/Composed 4 widgets/i)).toBeNull()
    for (const name of [
      /foreign buying and selling by sector/i,
      /liquidity and turnover by counter/i,
      /sector valuation, p\/e against dividend yield/i,
    ]) {
      expect(screen.getByRole('button', { name })).toBeDefined()
    }
  })

  // The bug this round fixed: buildDashboard() always returned the same
  // dashboard regardless of which spec (if any) matched. A different
  // spec's own natural phrasing must build *that* dashboard, not the
  // foreign-flow one.
  it('builds the liquidity dashboard, not the foreign-flow one, from its own phrasing', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.type(
      screen.getByPlaceholderText(/describe a new dashboard/i),
      'liquidity by counter{Enter}',
    )
    vi.advanceTimersByTime(5000)
    await waitFor(() =>
      expect(screen.getByText(/Composed 4 widgets/i)).toBeDefined())
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /liquidity and turnover by counter/i }))
        .toBeDefined())
    expect(screen.queryByRole('heading', { name: /foreign buying and selling/i })).toBeNull()
  })

  it('builds the right dashboard from a no-match chip click', async () => {
    render(<DemoShell />)
    const user = await openDashboards()
    await user.type(
      screen.getByPlaceholderText(/describe a new dashboard/i),
      'hotel sector exposure{Enter}',
    )
    await waitFor(() =>
      expect(screen.getByText(/here is what I can build/i)).toBeDefined())
    await user.click(
      screen.getByRole('button', { name: /sector valuation, p\/e against dividend yield/i }),
    )
    vi.advanceTimersByTime(5000)
    await waitFor(() =>
      expect(screen.getByText(/Composed 4 widgets/i)).toBeDefined())
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /sector valuation, p\/e against dividend yield/i }))
        .toBeDefined())
  })
})
