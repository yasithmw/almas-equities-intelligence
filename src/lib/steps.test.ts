import { describe, it, expect } from 'vitest'
import { STEPS, totalMs } from './steps'

describe('STEPS', () => {
  it('answers in Auto in the ten to eleven second band the demo is paced to', () => {
    // The pace is a demo claim, not an implementation detail: an answer that
    // resolves in under two seconds reads as a canned screen, and the
    // reasoning trail needs long enough for a client to read the statement
    // each step expands. Ruling R27 retired the earlier "must round to 1.8s"
    // assertion, which pinned this to a figure printed in the executive
    // summary's exhibit; the exhibits are no longer the authority.
    expect(totalMs('auto')).toBeGreaterThanOrEqual(10_000)
    expect(totalMs('auto')).toBeLessThanOrEqual(11_000)
  })

  it('keeps the mode ladder ordered, since the ladder is what the modes argue', () => {
    expect(totalMs('quick')).toBeLessThan(totalMs('auto'))
    expect(totalMs('auto')).toBeLessThan(totalMs('deep'))
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
