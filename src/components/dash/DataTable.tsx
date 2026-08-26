import type { TableViz } from '@/lib/types'
import styles from './DataTable.module.css'

// Figures and tickers read in the mono face throughout the brief (.bn,
// .bv, .tk, .sv, .dqt .tr .mono); TableViz carries plain strings with no
// per-column type flag, so a cell that opens on a digit or a sign
// (including the U+2212 minus used for negative currency) gets that
// treatment here too.
const looksNumeric = (cell: string) => /^[+\-−0-9]/.test(cell)

export default function DataTable({ viz }: { viz: TableViz }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {viz.columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {viz.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className={looksNumeric(cell) ? styles.mono : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
