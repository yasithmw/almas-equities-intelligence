import { describe, it, expect } from 'vitest'
import { matchQuestion } from './match'
import { QUESTIONS } from './questions'

describe('matchQuestion', () => {
  it('matches every preset by its exact text', () => {
    for (const q of QUESTIONS) {
      expect(matchQuestion(q.text)?.id).toBe(q.id)
    }
  })

  it('ignores case, punctuation and stray whitespace', () => {
    expect(matchQuestion('  WHICH LISTED BANK STOCKS HAVE THE HIGHEST DIVIDEND YIELD RIGHT NOW??  ')?.id)
      .toBe('q01')
  })

  it('matches on an alias', () => {
    expect(matchQuestion('bank dividend')?.id).toBe('q01')
    expect(matchQuestion('foreign flows')?.id).toBe('q03')
    expect(matchQuestion('10482')?.id).toBe('q04')
  })

  it('matches a loosely worded question by keyword overlap', () => {
    expect(matchQuestion('which banks pay the best dividend')?.id).toBe('q01')
    expect(matchQuestion('what is our revenue doing vs turnover')?.id).toBe('q06')
  })

  it('returns null for anything unrelated', () => {
    expect(matchQuestion('what is the weather in Colombo')).toBeNull()
    expect(matchQuestion('')).toBeNull()
    expect(matchQuestion('asdfgh')).toBeNull()
  })
})
