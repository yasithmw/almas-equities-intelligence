import { describe, it, expect } from 'vitest'
import { STEPS, totalMs } from './steps'

describe('STEPS', () => {
  it("rounds auto's total to 1.8s, the elapsed time Exhibit B prints on that exact answer", () => {
    // Document-fidelity claim: the client's own Exhibit B badges this answer
    // "1.8 s". If a future edit retunes a step's ms and this drifts, the
    // demo's own timer would contradict the client's document on screen.
    expect((totalMs('auto') / 1000).toFixed(1)).toBe('1.8')
  })

  it('gives quick 2 steps, auto 4, and deep 8, with deep doing more steps than auto', () => {
    expect(STEPS.quick).toHaveLength(2)
    expect(STEPS.auto).toHaveLength(4)
    expect(STEPS.deep).toHaveLength(8)
    // "Deep does more work than Auto" is itself a demo claim, not just a
    // side effect of today's specific step list.
    expect(STEPS.deep.length).toBeGreaterThan(STEPS.auto.length)
  })

  it('Ruling R5: keeps the Deep challenge step generic, never question-specific sector wording', () => {
    expect(STEPS.deep.map((s) => s.label)).toContain('Reviewer challenged the result')
    // Guards against a well-meaning future edit reintroducing
    // question-specific wording ("the sector mapping") into a step list
    // that q06 (brokerage revenue vs turnover) and every other answer share.
    expect(JSON.stringify(STEPS)).not.toContain('sector mapping')
  })

  it('gives every step a positive duration, so none can land instantly and break the staggered reveal', () => {
    for (const mode of ['quick', 'auto', 'deep'] as const) {
      for (const step of STEPS[mode]) {
        expect(step.ms).toBeGreaterThan(0)
      }
    }
  })
})
