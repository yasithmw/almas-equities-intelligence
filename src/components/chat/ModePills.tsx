'use client'

import type { Mode } from '@/lib/types'
import { useDemo } from '../shell/DemoContext'
import styles from './ModePills.module.css'

const MODES: { id: Mode; label: string }[] = [
  { id: 'quick', label: 'Quick' },
  { id: 'auto', label: 'Auto' },
  { id: 'deep', label: 'Deep' },
]

// Ports the client brief's .modes / .mode / .mode.on (grep-verified, the
// exec summary's chat composer footer) as three real buttons rather than
// static spans, since a demo has to let you actually change depth. Reads
// mode/setMode straight from DemoContext, the same pattern DeskSwitcher
// already established for its own desk buttons.
export default function ModePills() {
  const { mode, setMode } = useDemo()

  return (
    <div className={styles.modes} role="group" aria-label="Answer depth">
      {MODES.map((m) => {
        const on = m.id === mode
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={on}
            className={on ? `${styles.mode} ${styles.on}` : styles.mode}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
