import type { TableViz } from '@/lib/types'

// The platform's own fleet-data-table: uppercase mono-tracked header
// row, zebra body, hover tint, tabular figures. Cells do not wrap, so
// an account number stays one token instead of breaking across two
// lines in a narrow tile; a table too wide for its tile scrolls inside
// its own container rather than pushing the page sideways.
export default function DataTable({ viz }: { viz: TableViz }) {
  return (
    <div className="overflow-x-auto">
      <table className="fleet-data-table">
        <thead>
          <tr>
            {viz.columns.map((c) => (
              <th key={c} scope="col" className="whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {viz.rows.map((row, i) => (
            <tr key={`${row[0]}-${i}`}>
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
