import type { LineViz } from '@/lib/types'
import styles from './LineChart.module.css'

const W = 520
const H = 150
const PAD = 8

// Each series can sit on its own scale entirely (Rs millions of brokerage
// revenue against Rs billions of market turnover, for instance), so the
// min and max are taken from that one series' own points, not from every
// point across every series. A shared scale would flatten whichever
// series has the smaller absolute range into a near-straight line.
function toPoints(points: number[]): string {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1

  return points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1 || 1)) * (W - PAD * 2)
      const y = H - PAD - ((p - min) / span) * (H - PAD * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function LineChart({ viz }: { viz: LineViz }) {
  return (
    <div className={styles.wrap}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {viz.series.map((s) => (
          <polyline
            key={s.name}
            points={toPoints(s.points)}
            fill="none"
            stroke={s.accent}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {viz.xLabels.length > 0 && (
        <div className={styles.xAxis}>
          {viz.xLabels.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      )}
      <div className={styles.legend}>
        {viz.series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.accent }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}
