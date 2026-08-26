import type { Access, Account, DeskId } from './types'
import { ACCOUNTS } from './dataset'

export type DashboardId = 'market' | 'clients' | 'firm'

export interface Desk {
  id: DeskId
  label: string
  person: string
  role: string
}

export const DESKS: Desk[] = [
  { id: 'management', label: 'Management', person: 'A. Jayawardena', role: 'Management' },
  { id: 'dealing', label: 'Dealing', person: 'R. Fernando', role: 'Dealer' },
  { id: 'research', label: 'Research', person: 'M. Perera', role: 'Research' },
]

export const DEFAULT_DESK: DeskId = 'management'

const MATRIX: Record<DeskId, Record<DashboardId, Access>> = {
  management: { market: 'full', clients: 'full', firm: 'full' },
  dealing: { market: 'full', clients: 'rescoped', firm: 'locked' },
  research: { market: 'full', clients: 'redacted', firm: 'locked' },
}

export function dashboardAccess(desk: DeskId, dashboard: DashboardId): Access {
  return MATRIX[desk][dashboard]
}

export function visibleAccounts(desk: DeskId): Account[] {
  if (desk === 'dealing') {
    const person = DESKS.find((d) => d.id === 'dealing')!.person
    return ACCOUNTS.filter((a) => a.rm === person)
  }
  return ACCOUNTS
}

export function maskHolder(desk: DeskId, account: Account): string {
  return desk === 'research' ? 'Name withheld' : account.holder
}
