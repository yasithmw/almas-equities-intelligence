import { TICKERS } from '@/lib/dataset'
import type { Filters } from '@/lib/dashboards'
import styles from './FilterBar.module.css'

// Ruling 7 (task-8 brief): "FilterBar uses real <label> plus <select>
// controls, styled to look like the client's .dhead chips ... the test
// drives them with selectOptions. Do not build a custom dropdown."
// The sector list is derived from the dataset (TICKERS' own sectors, in
// their first-seen order) rather than typed out again, so it can never
// drift from the six the dataset actually carries.
const SECTORS: Array<Filters['sector']> = [
  'All',
  ...Array.from(new Set(TICKERS.map((t) => t.sector))),
]
const PERIODS: Array<Filters['period']> = ['MTD', 'QTD', 'YTD']

export default function FilterBar({
  filters, onChange,
}: { filters: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className={styles.bar}>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>Sector</span>
        <span className={styles.selectWrap}>
          <select
            className={styles.select}
            aria-label="Sector"
            value={filters.sector}
            onChange={(e) => onChange({ ...filters, sector: e.target.value as Filters['sector'] })}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className={styles.caret} aria-hidden="true">&#9662;</span>
        </span>
      </label>
      <label className={styles.chip}>
        <span className={styles.chipLabel}>Period</span>
        <span className={styles.selectWrap}>
          <select
            className={styles.select}
            aria-label="Period"
            value={filters.period}
            onChange={(e) => onChange({ ...filters, period: e.target.value as Filters['period'] })}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className={styles.caret} aria-hidden="true">&#9662;</span>
        </span>
      </label>
    </div>
  )
}
