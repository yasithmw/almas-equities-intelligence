import type { SignedBarsViz } from '@/lib/types'
import styles from './SignedBars.module.css'

export default function SignedBars({ viz }: { viz: SignedBarsViz }) {
  const maxAbs = Math.max(...viz.rows.map((r) => Math.abs(r.value))) || 1

  return (
    <div>
      {viz.rows.map((r) => {
        const sign = r.value < 0 ? 'neg' : 'pos'
        const pct = (Math.abs(r.value) / maxAbs) * 50

        return (
          <div className={styles.row} key={r.label}>
            <span className={styles.name}>{r.label}</span>
            <span className={styles.track}>
              <i className={styles.mid} />
              <i
                data-sign={sign}
                className={sign === 'pos' ? styles.pos : styles.neg}
                style={
                  sign === 'pos'
                    ? { left: '50%', width: `${pct}%` }
                    : { right: '50%', width: `${pct}%` }
                }
              />
            </span>
            <span className={sign === 'pos' ? styles.valuePos : styles.valueNeg}>
              {r.display}
            </span>
          </div>
        )
      })}
    </div>
  )
}
