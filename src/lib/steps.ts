import type { Mode, Step } from './types'

// Ruling R5: the fourth Deep step is a generic challenge, not "the sector
// mapping". STEPS is shared by every answer's Deep mode, and a sector-mapping
// challenge only makes sense for q01; q06 (brokerage revenue vs turnover) has
// no sector mapping to challenge at all. The answer-specific detail belongs
// in each answer's own `deep.correction` string (see answers.ts), and the
// statement it forced belongs in that question's trail (see trails.ts).
//
// ## Why these durations
//
// An answer in Auto takes about ten and a half seconds. That is the point:
// nothing real resolves a warehouse query, validates the result and composes
// a figure in under two seconds, and a demo that returns instantly reads as a
// canned screen rather than as work. It is also the time the reasoning trail
// needs to be watchable, since each step's generated statement now expands as
// that step runs and a client has to be able to read it.
//
// The ladder is the mode's own argument: Quick answers in about four seconds
// and skips validation, Auto takes ten and a half, and Deep takes about
// sixteen because it queries twice and argues with itself in between.
export const STEPS: Record<Mode, Step[]> = {
  quick: [
    { label: 'Planned 1 query', ms: 1300 },
    { label: 'Queried prices', ms: 3000 },
  ],
  auto: [
    { label: 'Planned 1 chart', ms: 1400 },
    { label: 'Queried dividends and prices', ms: 3800 },
    { label: 'Validated result', ms: 2400 },
    { label: 'Composed chart', ms: 2800 },
  ],
  deep: [
    { label: 'Planned 1 chart', ms: 1400 },
    { label: 'Queried dividends and prices', ms: 3800 },
    { label: 'Validated result', ms: 2000 },
    { label: 'Reviewer challenged the result', ms: 1800 },
    { label: 'Sent back', ms: 700 },
    { label: 'Re-queried with the correction', ms: 3000 },
    { label: 'Reviewer confirmed', ms: 1300 },
    { label: 'Composed chart', ms: 2200 },
  ],
}

export function totalMs(mode: Mode): number {
  return STEPS[mode].reduce((s, step) => s + step.ms, 0)
}
