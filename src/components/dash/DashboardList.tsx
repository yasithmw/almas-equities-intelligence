import type { Access } from '@/lib/types'
import type { Dashboard } from '@/lib/dashboards'
import LockedPanel from './LockedPanel'
import StatusPill from './StatusPill'
import styles from './DashboardList.module.css'

interface Props {
  dashboards: Dashboard[]
  openId: string
  accessOf: (dashboard: Dashboard) => Access
  allowedDeskLabel: (dashboard: Dashboard) => string
  onOpen: (id: string) => void
}

// "A Dashboards list you open one from" (task brief), replacing Exhibit
// C's own tab strip now that the mockup's five tabs have become three
// separate dashboards. Every card renders data-testid={'dash-card-' +
// id} (Ruling 7). A locked card (Ruling: "does not open") keeps its
// title and StatusPill in full, per the design brief's "Locked panel"
// spec, and swaps only the open action for the LockedPanel plate, so it
// is a real, honestly-labelled listing rather than a button pretending
// to work.
export default function DashboardList({ dashboards, openId, accessOf, allowedDeskLabel, onOpen }: Props) {
  return (
    <div className={styles.list} role="list" aria-label="Dashboards">
      {dashboards.map((d) => {
        const access = accessOf(d)
        const locked = access === 'locked'
        return (
          <div key={d.id} data-testid={`dash-card-${d.id}`} role="listitem" className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>{d.title}</span>
              <StatusPill tone={d.badge === 'Pre-built' ? 'ok' : 'ac'}>{d.badge}</StatusPill>
            </div>
            {locked ? (
              <LockedPanel allowedDeskLabel={allowedDeskLabel(d)} />
            ) : (
              // aria-label overrides the computed name outright (the same
              // device SuggestedQuestions already uses for its own grid
              // cells), so the accessible name is exactly the dashboard's
              // title regardless of how the visible description wraps.
              <button
                type="button"
                className={styles.open}
                aria-pressed={d.id === openId}
                aria-label={d.title}
                onClick={() => onOpen(d.id)}
              >
                <span aria-hidden="true">{d.description}</span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
