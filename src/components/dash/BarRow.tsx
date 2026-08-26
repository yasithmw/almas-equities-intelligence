import styles from './BarRow.module.css'

export default function BarRow({
  label, display, pct,
}: { label: string; display: string; pct: number }) {
  return (
    <div className={styles.row}>
      <span className={styles.name}>{label}</span>
      <span className={styles.track}>
        <i data-fill style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.value}>{display}</span>
    </div>
  )
}
