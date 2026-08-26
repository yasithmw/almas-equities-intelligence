import type { Question } from '@/lib/answers'
import styles from './SuggestedQuestions.module.css'

// Thematic desk eyebrow for each starter question. Two are taken
// directly from the brief's own copy rather than invented: q01 is the
// exact question Exhibit B's frozen screenshot shows the Dealing desk
// (R. Fernando) asking, and q04 is the client-gain question the same
// document's sub-bullet 01 names as "a dealer asks" while a client is
// on the line. q06 is forced to Management, the only desk that can
// ever see brokerage revenue (ANSWERS.q06.desks). The rest are spread
// across the three desks so the empty state reads as cross-desk, not
// as one team's tool.
const DESK_EYEBROW: Record<string, string> = {
  q01: 'Dealing',
  q02: 'Research',
  q03: 'Research',
  q04: 'Dealing',
  q05: 'Management',
  q06: 'Management',
}

interface Props {
  questions: Question[]
  variant: 'grid' | 'row'
  onPick: (q: Question) => void
  disabled?: boolean
}

// Free surface (design brief): the empty state reuses the document's
// own .ledger hairline-grid device (two-up, gap 0, odd/even hairline
// border) rather than a card grid, so the one wholly new surface still
// reads as this document's own grammar. Once the thread is no longer
// empty, the same list renders as a slim row of chips above the
// composer, filtered by the caller to the questions not yet asked.
export default function SuggestedQuestions({ questions, variant, onPick, disabled }: Props) {
  if (questions.length === 0) return null

  if (variant === 'row') {
    return (
      <div className={styles.row}>
        {questions.map((q) => (
          <button
            key={q.id}
            type="button"
            data-testid="suggested"
            className={styles.chip}
            disabled={disabled}
            onClick={() => onPick(q)}
          >
            {q.text}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {questions.map((q) => (
        <div key={q.id} className={styles.cell}>
          <button
            type="button"
            data-testid="suggested"
            className={styles.cellBtn}
            disabled={disabled}
            onClick={() => onPick(q)}
            // An explicit aria-label naming only the question, not the
            // question plus its desk eyebrow: the eyebrow text (Research
            // / Dealing / Management) is identical to the desk switcher's
            // own button names, and without this a query for "dealing"
            // would ambiguously match both this cell and the switcher.
            aria-label={q.text}
          >
            <span className={styles.eyebrow} aria-hidden="true">{DESK_EYEBROW[q.id] ?? 'Research'}</span>
            <span className={styles.qtext} aria-hidden="true">{q.text}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
