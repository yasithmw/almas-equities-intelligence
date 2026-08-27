import type { DashboardSpec } from '@/lib/dashboards'
import styles from './NoMatchPanel.module.css'

// Mirrors chat's own NoMatchPanel (src/components/chat/NoMatchPanel.tsx)
// rather than reusing it: that component is hardcoded to QUESTIONS and
// the Question type, and it lives in src/components/chat/, off limits
// to modify. Same pattern instead: lead with capability, never failure,
// "Here is what I can build" plus the three specs as chips, no apology
// and no error styling, so a request this scripted demo cannot build
// (fix round 1's own trigger case: "hotel sector exposure") reads as an
// invitation, not a dead end and never a wrong dashboard under a
// right-sounding title.
export default function NoMatchPanel({
  specs, onPick, disabled,
}: { specs: DashboardSpec[]; onPick: (spec: DashboardSpec) => void; disabled?: boolean }) {
  return (
    <div className={styles.panel}>
      <div className={styles.lead}>Here is what I can build</div>
      <div className={styles.chips}>
        {specs.map((s) => (
          <button
            key={s.id}
            type="button"
            className={styles.chip}
            disabled={disabled}
            onClick={() => onPick(s)}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  )
}
