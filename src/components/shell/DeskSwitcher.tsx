'use client'

import { DESKS } from '@/lib/desks'
import { useDemo } from './DemoContext'
import styles from './DeskSwitcher.module.css'

// Semantic colour rule (design brief): aqua is Almas's own side of the
// story, and the desk switcher plus the active-desk indicator are named
// together as the example, because the desks are Almas's own people.
// Ruling R1: rather than adding a separate "active desk" pill next to a
// switcher that repeats every person's name, the switcher's own active
// button doubles as that indicator, carrying data-testid="active-desk".
// That keeps the top bar from showing the same name twice.
export default function DeskSwitcher() {
  const { desk, setDesk } = useDemo()

  return (
    <div className={styles.switcher} role="group" aria-label="Desk">
      {DESKS.map((d) => {
        const active = d.id === desk
        return (
          <button
            key={d.id}
            type="button"
            aria-pressed={active}
            aria-label={`${d.label}, ${d.person}`}
            data-testid={active ? 'active-desk' : undefined}
            className={active ? `${styles.btn} ${styles.active}` : styles.btn}
            onClick={() => setDesk(d.id)}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{d.label}</span>
            <span className={styles.initial} aria-hidden="true">{d.label.charAt(0)}</span>
            <span className={styles.person}>{d.person}</span>
          </button>
        )
      })}
    </div>
  )
}
