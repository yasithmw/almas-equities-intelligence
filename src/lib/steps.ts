import type { Mode, Step } from './types'

// Ruling R5: the fourth Deep step is a generic challenge, not "the sector
// mapping". STEPS is shared by every answer's Deep mode, and a sector-mapping
// challenge only makes sense for q01; q06 (brokerage revenue vs turnover) has
// no sector mapping to challenge at all. The answer-specific detail belongs
// in each answer's own `deep.correction` string (see answers.ts), not here.
export const STEPS: Record<Mode, Step[]> = {
  quick: [
    { label: 'Planned 1 query', ms: 260 },
    { label: 'Queried prices', ms: 620 },
  ],
  auto: [
    { label: 'Planned 1 chart', ms: 260 },
    { label: 'Queried dividends and prices', ms: 640 },
    { label: 'Validated result', ms: 420 },
    { label: 'Composed chart', ms: 460 },
  ],
  deep: [
    { label: 'Planned 1 chart', ms: 260 },
    { label: 'Queried dividends and prices', ms: 640 },
    { label: 'Validated result', ms: 420 },
    { label: 'Reviewer challenged the result', ms: 780 },
    { label: 'Sent back', ms: 300 },
    { label: 'Re-queried with the correction', ms: 700 },
    { label: 'Reviewer confirmed', ms: 540 },
    { label: 'Composed chart', ms: 460 },
  ],
}

export function totalMs(mode: Mode): number {
  return STEPS[mode].reduce((s, step) => s + step.ms, 0)
}
