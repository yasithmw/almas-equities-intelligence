import { describe, it, expect } from 'vitest'
import { ANSWERS, resolveAnswer } from './answers'
import { QUESTIONS } from './questions'

describe('answer library', () => {
  it('has one answer per question', () => {
    expect(Object.keys(ANSWERS).sort()).toEqual(QUESTIONS.map((q) => q.id).sort())
  })

  it('gives every answer all three modes', () => {
    for (const a of Object.values(ANSWERS)) {
      expect(a.quick.text.length).toBeGreaterThan(0)
      expect(a.auto.text.length).toBeGreaterThan(0)
      expect(a.deep.text.length).toBeGreaterThan(0)
    }
  })

  it('gives quick no chart and auto a chart', () => {
    for (const a of Object.values(ANSWERS)) {
      expect(a.quick.viz).toBeNull()
      expect(a.auto.viz).not.toBeNull()
    }
  })

  it('makes deep differ from auto, not just add steps', () => {
    for (const a of Object.values(ANSWERS)) {
      expect(a.deep.text).not.toBe(a.auto.text)
      expect(a.deep.correction.length).toBeGreaterThan(0)
    }
  })

  it('captions every chart', () => {
    for (const a of Object.values(ANSWERS)) {
      for (const v of [a.auto.viz, a.deep.viz]) {
        if (v) expect(v.caption.length).toBeGreaterThan(0)
      }
    }
  })

  it('uses no em dash anywhere in its copy', () => {
    expect(JSON.stringify(ANSWERS)).not.toContain('—')
  })
})

describe('resolveAnswer', () => {
  it('answers an open question for every desk', () => {
    for (const desk of ['management', 'dealing', 'research'] as const) {
      expect(resolveAnswer('q01', desk, 'auto').state).toBe('answered')
    }
  })

  it('redacts the account question for research', () => {
    expect(resolveAnswer('q04', 'dealing', 'auto').state).toBe('answered')
    expect(resolveAnswer('q04', 'management', 'auto').state).toBe('answered')
    expect(resolveAnswer('q04', 'research', 'auto').state).toBe('redacted')
  })

  it('denies the revenue question outside management', () => {
    expect(resolveAnswer('q06', 'management', 'auto').state).toBe('answered')
    expect(resolveAnswer('q06', 'dealing', 'auto').state).toBe('denied')
    expect(resolveAnswer('q06', 'research', 'auto').state).toBe('denied')
  })

  it('carries the correction only in deep mode', () => {
    const auto = resolveAnswer('q01', 'management', 'auto')
    const deep = resolveAnswer('q01', 'management', 'deep')
    expect(auto.state === 'answered' && auto.correction).toBeUndefined()
    expect(deep.state === 'answered' && deep.correction).toBeTruthy()
  })
})
