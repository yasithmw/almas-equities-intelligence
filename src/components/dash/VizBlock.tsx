import type { Viz } from '@/lib/types'
import BarRow from './BarRow'
import SignedBars from './SignedBars'
import PairedBars from './PairedBars'
import LineChart from './LineChart'
import DataTable from './DataTable'
import styles from './VizBlock.module.css'

export default function VizBlock({ viz }: { viz: Viz }) {
  const maxBarValue =
    viz.kind === 'bars' ? Math.max(...viz.rows.map((x) => x.value)) || 1 : 1

  return (
    <div className={styles.card}>
      <div className={styles.title}>{viz.title}</div>
      {viz.kind === 'bars' && (
        <div>
          {viz.rows.map((r) => (
            <BarRow
              key={r.label}
              label={r.label}
              display={r.display}
              pct={(r.value / maxBarValue) * 100}
            />
          ))}
        </div>
      )}
      {viz.kind === 'signedBars' && <SignedBars viz={viz} />}
      {viz.kind === 'pairedBars' && <PairedBars viz={viz} />}
      {viz.kind === 'line' && <LineChart viz={viz} />}
      {viz.kind === 'table' && <DataTable viz={viz} />}
      {/* Ruling R12: the left caption is this exhibit's own data source
          (market data, the firm's brokerage ledger, client records, ...),
          never a hardcoded label, so mislabelling a source is a type
          error rather than a silent copy mistake. */}
      <div className={styles.caption}>
        <span>{viz.source}</span>
        <span>{viz.caption}</span>
      </div>
    </div>
  )
}
