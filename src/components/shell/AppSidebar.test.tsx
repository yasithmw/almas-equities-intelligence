import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppSidebar from './AppSidebar'
import { DemoProvider, useDemo } from './DemoContext'

// A test-only harness standing in for "a question got asked", so the
// sidebar's history rendering can be exercised without mounting the
// whole chat surface.
function AskHarness({ question }: { question: string }) {
  const { pushHistory } = useDemo()
  return (
    <button type="button" onClick={() => pushHistory(question)}>
      trigger ask
    </button>
  )
}

describe('AppSidebar history (Ruling R3)', () => {
  it('shows a placeholder, not a history list, before anything has been asked', () => {
    render(
      <DemoProvider>
        <AppSidebar />
      </DemoProvider>,
    )
    expect(screen.queryByTestId('rail-history')).toBeNull()
    expect(screen.getByText(/questions you ask appear here/i)).toBeDefined()
  })

  it('renders an asked question inside data-testid="rail-history" as a non-button row', async () => {
    const user = userEvent.setup()
    const question = 'Which listed bank stocks have the highest dividend yield right now?'
    render(
      <DemoProvider>
        <AskHarness question={question} />
        <AppSidebar />
      </DemoProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'trigger ask' }))

    const historyList = screen.getByTestId('rail-history')
    expect(historyList.textContent).toContain(question)
    // Ruling R3: history entries are not buttons, so a suggested
    // question that has also been asked still resolves to exactly one
    // button (the suggestion itself) rather than throwing on multiple
    // matches.
    expect(within(historyList).queryByRole('button')).toBeNull()
    expect(historyList.querySelector('button')).toBeNull()
  })

  it('does not duplicate the same question asked twice', async () => {
    const user = userEvent.setup()
    const question = 'What are foreign investors buying and selling this week?'
    render(
      <DemoProvider>
        <AskHarness question={question} />
        <AppSidebar />
      </DemoProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'trigger ask' }))
    await user.click(screen.getByRole('button', { name: 'trigger ask' }))

    const historyList = screen.getByTestId('rail-history')
    expect(within(historyList).getAllByText(question)).toHaveLength(1)
  })
})
