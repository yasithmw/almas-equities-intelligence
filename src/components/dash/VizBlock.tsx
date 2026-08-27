import type { Viz } from '@/lib/types'
import BarRow from './BarRow'
import SignedBars from './SignedBars'
import PairedBars from './PairedBars'
import LineChart from './LineChart'
import DataTable from './DataTable'
import Movers from './Movers'
import styles from './VizBlock.module.css'

interface Props {
  // MoversViz is the sixth Viz member (fix round 2: promoted into
  // lib/types.ts, where it now belongs alongside the other five), so
  // this no longer needs to widen to a second, feature-module-owned
  // type the way it did when MoversViz lived in lib/dashboards.ts.
  viz: Viz
  // Free surface (design brief, "Redacted rows"): "the panel header
  // carries a small mono REDACTED tag". VizBlock already owns the panel
  // header (.title, ported from .pc .pt), so this is the one place that
  // tag can sit next to a chart's own title rather than in a second,
  // competing wrapper. Optional and additive: every existing caller
  // that omits it renders exactly as before.
  tag?: string
}

export default function VizBlock({ viz, tag }: Props) {
  const maxBarValue =
    viz.kind === 'bars' ? Math.max(...viz.rows.map((x) => x.value)) || 1 : 1

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>{viz.title}</div>
        {tag && <span className={styles.tag}>{tag}</span>}
      </div>
      {/* Global constraint: no horizontal body scroll at 390px; wide
          content scrolls inside its own container. Invisible when
          content fits (most kinds); only a wide table (Client Book's
          four-column concentration flags) or a paired-bars legend on a
          narrow phone ever actually triggers it. */}
      <div className={styles.body}>
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
        {viz.kind === 'movers' && <Movers viz={viz} />}
      </div>
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
