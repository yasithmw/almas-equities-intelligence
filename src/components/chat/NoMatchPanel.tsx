import { QUESTIONS } from '@/lib/questions'
import type { Question } from '@/lib/answers'
import styles from './NoMatchPanel.module.css'

// Free surface (design brief): leads with capability, never failure.
// "Here is what I can answer" plus the six as chips, no apology and no
// error styling, so an unrecognised question reads as an invitation
// rather than a dead end.
export default function NoMatchPanel({
  onPick, disabled,
}: { onPick: (q: Question) => void; disabled?: boolean }) {
  return (
    <div className={styles.panel}>
      <div className={styles.lead}>Here is what I can answer</div>
      <div className={styles.chips}>
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            className={styles.chip}
            disabled={disabled}
            onClick={() => onPick(q)}
          >
            {q.text}
          </button>
        ))}
      </div>
    </div>
  )
}
