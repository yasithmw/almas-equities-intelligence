import type { KpiSpec } from '@/lib/types'
import styles from './KpiTile.module.css'

function deltaClass(dir: KpiSpec['dir']) {
  if (dir === 'up') return `${styles.delta} ${styles.up}`
  if (dir === 'down') return `${styles.delta} ${styles.down}`
  return styles.delta
}

// Ruling R14: Exhibit C colours the Foreign net tile on the value itself
// (`<div class="kv" style="color:var(--up)">`), not on the delta line
// below it, so KpiSpec.valueDir drives the value's colour independently
// of dir/delta. Reuses the same .up / .down tokens the delta already
// uses, since the colour rule is identical either way.
function valueClass(valueDir: KpiSpec['valueDir']) {
  if (valueDir === 'up') return `${styles.value} ${styles.up}`
  if (valueDir === 'down') return `${styles.value} ${styles.down}`
  return styles.value
}

// The brief's own up example prefixes its delta with a filled triangle
// (Exhibit C, "&#9650; 0.6% today"). KpiSpec keeps direction separate from
// the delta text, so the tile supplies the glyph itself, and the down
// case takes the same triangle pointed the other way; the brief has no
// worked "down" example to port a code point from.
function arrow(dir: KpiSpec['dir']) {
  if (dir === 'up') return '▲ '
  if (dir === 'down') return '▼ '
  return ''
}

export default function KpiTile({ spec }: { spec: KpiSpec }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.label}>{spec.label}</div>
      <div className={valueClass(spec.valueDir)}>{spec.value}</div>
      {spec.delta && (
        <div className={deltaClass(spec.dir)}>
          {arrow(spec.dir)}
          {spec.delta}
        </div>
      )}
    </div>
  )
}
