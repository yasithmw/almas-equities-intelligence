import { QUESTIONS } from './questions'
import type { Question } from './answers'

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'what', 'which', 'how', 'me',
  'my', 'our', 'on', 'in', 'at', 'to', 'of', 'and', 'or', 'right', 'now',
  'show', 'this', 'that', 'for', 'vs', 'against', 'it', 'us', 'we', 'i',
])

function normalise(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

const THRESHOLD = 0.34

export function matchQuestion(input: string): Question | null {
  const words = normalise(input)
  if (words.length === 0) return null
  const joined = words.join(' ')

  // Exact full-text equality is checked as one complete pass over every
  // question before aliases are considered at all. q01 and q02 both end
  // their canonical text in "...dividend yield", so q01's alias 'dividend
  // yield' is a literal substring of q02's own full question; interleaving
  // the exact check and the alias check per-question (checking q01's alias
  // before ever reaching q02's exact check) lets that shared vocabulary
  // steal the match. Exact text is the strongest possible signal, so it
  // must win over every alias, not just the aliases of earlier questions.
  for (const q of QUESTIONS) {
    if (normalise(q.text).join(' ') === joined) return q
  }
  for (const q of QUESTIONS) {
    if (q.aliases.some((a) => joined.includes(normalise(a).join(' ')))) return q
  }

  let best: { q: Question; score: number } | null = null
  for (const q of QUESTIONS) {
    const target = new Set([...normalise(q.text), ...q.aliases.flatMap(normalise)])
    const hits = words.filter((w) => target.has(w)).length
    const score = hits / words.length
    if (!best || score > best.score) best = { q, score }
  }

  return best && best.score >= THRESHOLD ? best.q : null
}
