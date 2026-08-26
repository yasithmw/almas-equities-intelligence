import type { PairedBarsViz } from '@/lib/types'
import styles from './PairedBars.module.css'

export default function PairedBars({ viz }: { viz: PairedBarsViz }) {
  const maxVal = Math.max(...viz.rows.flatMap((r) => [r.a, r.b])) || 1

  return (
    <div>
      <div className={styles.legend}>
        <span>
          <i className={styles.swatchA} />
          {viz.series[0]}
        </span>
        <span>
          <i className={styles.swatchB} />
          {viz.series[1]}
        </span>
      </div>
      {viz.rows.map((r) => (
        <div className={styles.group} key={r.label}>
          <div className={styles.label}>{r.label}</div>
          <div className={styles.pairRow}>
            <span className={styles.track}>
              <i
                className={styles.fillA}
                style={{ width: `${(r.a / maxVal) * 100}%` }}
              />
            </span>
            <span className={styles.value}>{r.aDisplay}</span>
          </div>
          <div className={styles.pairRow}>
            <span className={styles.track}>
              <i
                className={styles.fillB}
                style={{ width: `${(r.b / maxVal) * 100}%` }}
              />
            </span>
            <span className={styles.value}>{r.bDisplay}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
