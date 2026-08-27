import type { Filters } from '@/lib/dashboards'
import FilterBar from './FilterBar'
import StatusPill from './StatusPill'
import styles from './DashboardHeader.module.css'

interface Props {
  title: string
  badge: string
  // Fix round 2: Client Book and Firm Performance accept a filters
  // argument but never vary their panels by it, so FilterBar used to
  // render here unconditionally, as a live, clickable Sector/Period
  // control that did nothing on either. Each Dashboard now declares
  // usesFilters for itself; FilterBar renders only when it is true.
  usesFilters: boolean
  filters: Filters
  onFiltersChange: (next: Filters) => void
}

// Ports the client brief's .dhead (grep-verified): title in .dt, a
// status chip, then the filter chips pushed right by margin-left:auto
// on the first one. Exhibit C's own tab strip underneath .dhead
// (Overview / Sectors / Foreign flows / Liquidity / Client book) is
// deliberately not ported: the task brief calls those "tabs inside one
// dashboard in the mockup" and asks for three separate dashboards
// instead, which DashboardList (a persistent list you open one from)
// already is.
//
// Self-review, "remove one accessory": an earlier version also carried
// a "Your access only" pill here, borrowed from chat's own rescoped/
// redacted treatment. Cut: nothing it said was not already said better
// elsewhere (the account count and AUM already differ for a rescoped
// desk, the gain-and-loss panel already carries its own REDACTED tag,
// and a locked dashboard already gets LockedPanel's one sentence), so
// it was one more badge in a header that did not need it, this app's
// own instance of decoration competing with the things that actually
// carry information.
export default function DashboardHeader({
  title, badge, usesFilters, filters, onFiltersChange,
}: Props) {
  return (
    <div className={styles.dhead}>
      <h2 className={styles.dt}>{title}</h2>
      <StatusPill tone={badge === 'Pre-built' ? 'ok' : 'ac'}>{badge}</StatusPill>
      {usesFilters && (
        <div className={styles.filters}>
          <FilterBar filters={filters} onChange={onFiltersChange} />
        </div>
      )}
    </div>
  )
}
