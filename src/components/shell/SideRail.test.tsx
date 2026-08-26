import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SideRail from './SideRail'
import { DemoProvider, useDemo } from './DemoContext'

// A test-only harness: Task 6 has no UI of its own that calls
// pushHistory (that arrives with Task 7's real ChatPane), so this
// stands in for "a question got asked" to exercise the rail's history
// rendering in isolation.
function AskHarness({ question }: { question: string }) {
  const { pushHistory } = useDemo()
  return (
    <button type="button" onClick={() => pushHistory(question)}>
      trigger ask
    </button>
  )
}

describe('SideRail history (Ruling R3)', () => {
  it('shows no Today group or rail-history list before anything has been asked', () => {
    render(
      <DemoProvider>
        <SideRail />
      </DemoProvider>,
    )
    expect(screen.queryByTestId('rail-history')).toBeNull()
    expect(screen.queryByText('Today')).toBeNull()
  })

  it('renders an asked question inside data-testid="rail-history" as a non-button row', async () => {
    const user = userEvent.setup()
    const question = 'Which listed bank stocks have the highest dividend yield right now?'
    render(
      <DemoProvider>
        <AskHarness question={question} />
        <SideRail />
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
        <SideRail />
      </DemoProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'trigger ask' }))
    await user.click(screen.getByRole('button', { name: 'trigger ask' }))

    const historyList = screen.getByTestId('rail-history')
    expect(within(historyList).getAllByText(question)).toHaveLength(1)
  })
})
