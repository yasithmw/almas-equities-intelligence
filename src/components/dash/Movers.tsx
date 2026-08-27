import type { MoversViz } from '@/lib/types'
import styles from './Movers.module.css'

// Solves the movers gap (task brief, "a gap carried from Task 4, now
// yours to solve"): no existing primitive renders "label plus signed
// coloured value, with no bar", which is exactly Exhibit C's .mv row
// (.tk the ticker, .g the gain, .r the loss). Ported directly, not
// invented: grep-verified against the live document.
//
// One row shape serves two panels that are the same underlying idea:
// Market Overview's top movers (code only) and Client Book's unrealised
// gain and loss (code plus a maskable second line, the holder's name).
// The second line has no class of its own to port, since no mover row
// in the document carries one; it reuses the app's own faint/ink-2 text
// ramp rather than inventing a colour.
export default function Movers({ viz }: { viz: MoversViz }) {
  return (
    <div>
      {viz.rows.map((r, i) => {
        const sign = r.value < 0 ? 'neg' : 'pos'
        return (
          <div className={styles.mv} key={`${r.code}-${i}`}>
            <span className={styles.label}>
              <span className={styles.tk}>{r.code}</span>
              {r.name && (
                <span className={r.nameMuted ? `${styles.name} ${styles.muted}` : styles.name}>
                  {r.name}
                </span>
              )}
            </span>
            <span
              data-sign={sign}
              className={sign === 'pos' ? styles.g : styles.r}
            >
              {r.display}
            </span>
          </div>
        )
      })}
    </div>
  )
}
