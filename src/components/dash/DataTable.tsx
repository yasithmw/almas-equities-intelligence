import type { TableViz } from '@/lib/types'
import { cn } from '@/lib/utils'

// Beyond this many rows a table stops being a tile and starts being a
// page: nineteen counters at roughly thirty-four pixels a row is six
// hundred pixels of one widget, which pushes everything under it out of
// reach. Longer tables scroll inside themselves against a pinned header
// instead, so the section keeps its shape and no row is hidden.
const SCROLL_AFTER_ROWS = 10

// The platform's own fleet-data-table: uppercase mono-tracked header
// row, zebra body, hover tint, tabular figures. Cells do not wrap, so
// an account number stays one token instead of breaking across two
// lines in a narrow tile; a table too wide for its tile scrolls inside
// its own container rather than pushing the page sideways.
export default function DataTable({ viz }: { viz: TableViz }) {
  const scrolls = viz.rows.length > SCROLL_AFTER_ROWS

  return (
    <div
      className={cn('overflow-x-auto', scrolls && 'max-h-[26rem] overflow-y-auto')}
      // A scrolling region has to be reachable and announced; a table
      // that fits does not need either, and a stray tabbable div would
      // just be one more stop on the way to the next control.
      {...(scrolls
        ? { tabIndex: 0, role: 'group', 'aria-label': `${viz.title}, scrollable` }
        : {})}
    >
      <table className="fleet-data-table">
        <thead className={cn(scrolls && 'sticky top-0 z-10 bg-card')}>
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
