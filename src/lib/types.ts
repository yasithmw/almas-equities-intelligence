export type DeskId = 'management' | 'dealing' | 'research'
export type Mode = 'quick' | 'auto' | 'deep'
export type Access = 'full' | 'rescoped' | 'redacted' | 'locked'

export type Sector =
  | 'Banks' | 'Diversified' | 'Telco' | 'Hotels' | 'Manufacturing' | 'Insurance'

export interface Ticker {
  code: string
  name: string
  sector: Sector
  price: number
  mtdPct: number
  dividend: number
  pe: number
  turnoverMn: number
  foreignNetMn: number
}

export interface IndexPoint { session: number; aspi: number; sl20: number }

export interface Holding { code: string; qty: number; avgCost: number }

export interface Account {
  id: string
  holder: string
  rm: string
  holdings: Holding[]
}

export interface RevenueMonth { month: string; revenueMn: number; turnoverBn: number }

export interface Step {
  label: string
  ms: number
  // What the agent emitted under this step, expandable in the feed. Prose
  // in `detail`, a generated statement in `sql`. The platform's own feed
  // distinguishes the two the same way and renders a statement through
  // formatSqlBlock in a monospace pre; see lib/trails.ts for where these
  // come from and components/chat/ActivityFeed.tsx for how they render.
  detail?: string
  sql?: string
}

export interface KpiSpec {
  label: string
  value: string
  delta?: string
  dir?: 'up' | 'down' | 'flat'
  valueDir?: 'up' | 'down'
}

export interface BarsViz {
  kind: 'bars'
  title: string
  rows: { label: string; value: number; display: string }[]
  source: string
  caption: string
}

export interface PairedBarsViz {
  kind: 'pairedBars'
  title: string
  series: [string, string]
  rows: { label: string; a: number; b: number; aDisplay: string; bDisplay: string }[]
  source: string
  caption: string
}

export interface SignedBarsViz {
  kind: 'signedBars'
  title: string
  rows: { label: string; value: number; display: string }[]
  source: string
  caption: string
}

export interface LineViz {
  kind: 'line'
  title: string
  xLabels: string[]
  series: { name: string; points: number[]; accent: string }[]
  source: string
  caption: string
}

export interface TableViz {
  kind: 'table'
  title: string
  columns: string[]
  rows: string[][]
  source: string
  caption: string
}

// Promoted from src/lib/dashboards.ts (fix round 2, the "movers gap":
// label plus signed coloured value, no bar, exactly Exhibit C's
// .mv/.tk/.g/.r). It used to live in dashboards.ts alone so as not to
// touch this file, which forced VizBlock's prop to widen to
// `Viz | MoversViz` imported from a feature module, a shared primitive
// depending on that module. Sixth Viz member now, same as any other.
export interface MoversRow {
  code: string
  name?: string
  nameMuted?: boolean
  value: number
  display: string
}

export interface MoversViz {
  kind: 'movers'
  title: string
  rows: MoversRow[]
  source: string
  caption: string
}

export type Viz =
  | BarsViz | PairedBarsViz | SignedBarsViz | LineViz | TableViz | MoversViz

export type PanelBody = { kind: 'kpis'; tiles: KpiSpec[] } | Viz

export interface Panel { id: string; span: 1 | 2 | 4; body: PanelBody }
