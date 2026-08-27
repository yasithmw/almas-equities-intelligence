import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoShell from '../shell/DemoShell'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

async function ask(label: RegExp) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('button', { name: label }))
  return user
}

// `shouldAdvanceTime: true` ties the fake clock to real elapsed wall
// time, which is what actually lets a suggested question's typewriter
// effect (18ms per character, from useTypewriter) and the feed's own
// timers land: `vi.advanceTimersByTime` alone does not reliably fast
// forward through timers a still-running callback schedules next (the
// composer's typed-out text, then the feed's own step timeouts), so
// every wait below gets a budget sized to the real time the sequence
// underneath it actually needs, not the testing-library default of
// 1000ms. q01's question is 67 characters (1206ms to type) plus this
// 300ms send pause plus Auto's 1780ms feed is 3286ms; a wide, uniform
// margin is simpler and more robust than trimming each one to the wire.
const ASK_TIMEOUT = 6000

describe('chat', () => {
  it('offers exactly six suggested questions on the empty state', () => {
    render(<DemoShell />)
    expect(screen.getAllByTestId('suggested')).toHaveLength(6)
  })

  it('types the clicked question into the composer before sending', async () => {
    render(<DemoShell />)
    await ask(/highest dividend yield/i)
    const box = screen.getByPlaceholderText(/ask about any stock/i) as HTMLInputElement
    await waitFor(() => expect(box.value.length).toBeGreaterThan(0), { timeout: ASK_TIMEOUT })
    await waitFor(
      () =>
        expect(box.value).toBe(
          'Which listed bank stocks have the highest dividend yield right now?',
        ),
      { timeout: ASK_TIMEOUT },
    )
  })

  it('ticks the feed steps in order, not all at once', async () => {
    render(<DemoShell />)
    await ask(/highest dividend yield/i)
    await waitFor(
      () => expect(screen.getByText('Planned 1 chart')).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
    expect(screen.queryByText('Composed chart')).toBeNull()
    vi.advanceTimersByTime(3000)
    await waitFor(
      () => expect(screen.getByText('Composed chart')).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
  })

  it('shows a chart in auto mode and none in quick', async () => {
    const { unmount } = render(<DemoShell />)
    await ask(/highest dividend yield/i)
    vi.advanceTimersByTime(3000)
    await waitFor(
      () => expect(screen.getByText('Dividend yield, listed banks')).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
    unmount()

    render(<DemoShell />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('radio', { name: /^quick$/i }))
    await user.click(screen.getByRole('button', { name: /highest dividend yield/i }))
    vi.advanceTimersByTime(3000)
    await waitFor(() =>
      expect(screen.queryByText('Dividend yield, listed banks')).toBeNull())
  }, ASK_TIMEOUT + 2000)

  // Ruling R5: the brief's own test asserted
  // /Reviewer challenged the sector mapping/i, a label that no longer
  // exists. STEPS.deep's fourth step is the generic "Reviewer
  // challenged the result" (steps.ts), because STEPS is shared by every
  // answer's Deep mode and a sector-mapping challenge is nonsense for,
  // say, the revenue question. The question-specific detail lives in
  // q01's own deep.correction, rendered by AnswerBlock, so this checks
  // both: the generic step label, and that correction text. Deep's own
  // total (4100ms) plus the 1206ms typed question and the 300ms send
  // pause is 5606ms of real time, over vitest's 5000ms default test
  // timeout, so this test is given an explicit, longer one.
  it('deep mode runs more steps and returns a different answer than auto', async () => {
    render(<DemoShell />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('radio', { name: /^deep$/i }))
    await user.click(screen.getByRole('button', { name: /highest dividend yield/i }))
    vi.advanceTimersByTime(6000)
    await waitFor(
      () => expect(screen.getByText(/Reviewer challenged the result/i)).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
    await waitFor(
      () => expect(screen.getByText(/reviewer moved NTB from Diversified to Banks/i)).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
  }, ASK_TIMEOUT + 4000)

  // Fix (Task 8 stabilisation): this carried ASK_TIMEOUT + 2000 (8000ms)
  // until the build-a-dashboard flow gave the suite a second consumer of
  // real timers alongside this one; under the full suite's resulting
  // parallel load that budget occasionally was not enough, an infra flake
  // (it passes in 2.66s in isolation), not a regression in the denial
  // path itself. Bumped to match its neighbour above, ASK_TIMEOUT + 4000.
  it('declines the revenue question on the dealing desk', async () => {
    render(<DemoShell initialDesk="dealing" />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /brokerage revenue/i }))
    vi.advanceTimersByTime(3000)
    await waitFor(
      () => expect(screen.getByText(/switch desk to view it/i)).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
  }, ASK_TIMEOUT + 4000)

  it('offers the six as chips when a typed question does not match', async () => {
    render(<DemoShell />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.type(
      screen.getByPlaceholderText(/ask about any stock/i),
      'what is the weather in Colombo{Enter}',
    )
    vi.advanceTimersByTime(1500)
    await waitFor(() =>
      expect(screen.getByText(/here is what I can answer/i)).toBeDefined())
  })

  it('adds the asked question to the rail history', async () => {
    render(<DemoShell />)
    await ask(/highest dividend yield/i)
    vi.advanceTimersByTime(3000)
    await waitFor(
      () =>
        expect(screen.getByTestId('rail-history').textContent)
          .toMatch(/dividend yield/i),
      { timeout: ASK_TIMEOUT },
    )
  }, ASK_TIMEOUT + 2000)

  it('renders no em dash', async () => {
    const { container } = render(<DemoShell />)
    await ask(/highest dividend yield/i)
    vi.advanceTimersByTime(3000)
    await waitFor(
      () => expect(container.textContent).not.toContain('—'),
      { timeout: ASK_TIMEOUT },
    )
  }, ASK_TIMEOUT + 2000)

  // Ruling R20: "New chat" has to actually start a new chat, not just
  // switch to a view that may already hold a thread. Asks a question,
  // lets it resolve, then proves the thread is genuinely empty again
  // (back to all six suggested questions, the resolved chart gone)
  // after clicking New chat.
  it('New chat clears the thread back to the six-question empty state', async () => {
    render(<DemoShell />)
    await ask(/highest dividend yield/i)
    vi.advanceTimersByTime(3000)
    await waitFor(
      () => expect(screen.getByText('Dividend yield, listed banks')).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: /new chat/i }))

    expect(screen.queryByText('Dividend yield, listed banks')).toBeNull()
    expect(screen.getAllByTestId('suggested')).toHaveLength(6)
  }, ASK_TIMEOUT + 2000)

  // Review round 1, Important 1: ActivityFeed's elapsed-time interval
  // was only cleared on unmount, not on completion. A resolved,
  // collapsed turn stays mounted for the rest of the thread's life, so
  // every answered turn leaked a live 100ms interval. vi.getTimerCount()
  // after a turn fully resolves is the direct check: zero means nothing
  // is still ticking underneath the collapsed feed.
  it('leaves no interval running once a turn has resolved', async () => {
    render(<DemoShell />)
    await ask(/highest dividend yield/i)
    await waitFor(
      () => expect(screen.getByText('Dividend yield, listed banks')).toBeDefined(),
      { timeout: ASK_TIMEOUT },
    )
    expect(vi.getTimerCount()).toBe(0)
  }, ASK_TIMEOUT + 2000)

  // Review round 1, Important 2: the composer's <input> had
  // outline:none with no :focus-visible replacement, so a keyboard
  // user tabbing into the demo's primary control got no visible focus
  // indication at all. jsdom does not reliably evaluate :focus-visible
  // against getComputedStyle, so this reads the actual compiled CSS
  // rule for the input's own class out of the injected stylesheets,
  // the same way the browser will, rather than asserting on a pseudo-
  // class match jsdom cannot be trusted to compute.
  it('gives the composer a visible focus treatment', () => {
    render(<DemoShell />)
    const box = screen.getByPlaceholderText(/ask about any stock/i)
    // Tailwind utilities are compiled by the build, not by vitest, so the
    // check is that the box declares a focus treatment at all: reading a
    // compiled rule out of document.styleSheets would only ever assert
    // that the test runner does not compile CSS.
    const shell = box.closest('.prompt-box')
    expect(shell).not.toBeNull()
    expect(shell!.className).toMatch(/focus-within:ring-2/)
  })
})
