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
  // True where the two series are the SAME unit (two rupee prices), in
  // which case a shared value axis is honest and the per-bar labels come
  // off. Left false where they are not (a P/E against a percentage), and
  // the axis stays hidden so nobody reads 6.2 against 9.4 as one
  // quantity. See PairedBars.tsx.
  sharedAxis?: boolean
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

// ---------------------------------------------------------------------------
// Four figure kinds added alongside the original six, each because the
// dataset genuinely supports it and because it reads differently from a
// bar. A dashboard of twelve horizontal bar charts is a wall, not an
// argument.
// ---------------------------------------------------------------------------

// A share of one whole. Only ever used where the parts really do sum to
// the centre figure, so the ring is a true part-to-whole reading rather
// than a decorative pie.
export interface DonutViz {
  kind: 'donut'
  title: string
  // `tone` is for the rings whose parts genuinely mean up, down and
  // neither (market breadth is the only one so far). Left off, the parts
  // are categories and take the categorical inks instead: a sector drawn
  // in danger red would read as a sector in trouble.
  rows: { label: string; value: number; display: string; tone?: 'up' | 'down' | 'flat' }[]
  centreValue: string
  centreLabel: string
  source: string
  caption: string
}

// A quantity over time, filled to the baseline. Two series stack, which
// is only honest where they are parts of one total; where they are not,
// use a line with an axis each (see LineViz).
export interface AreaViz {
  kind: 'area'
  title: string
  xLabels: string[]
  series: { name: string; points: number[]; displays: string[] }[]
  stacked?: boolean
  source: string
  caption: string
}

// Two measures per name, one dot each, grouped by a third categorical
// (sector). The only figure here that answers "is the cheap one also the
// generous one", which no ranked bar can.
export interface ScatterViz {
  kind: 'scatter'
  title: string
  xName: string
  yName: string
  points: {
    label: string
    group: string
    x: number
    y: number
    xDisplay: string
    yDisplay: string
  }[]
  source: string
  caption: string
}

// A compact stat list where each row carries its own history as a
// sparkline. Where a KPI tile states a level, this states the level and
// the shape that produced it, in the same width.
export interface SparkViz {
  kind: 'spark'
  title: string
  rows: {
    label: string
    value: string
    delta?: string
    dir?: 'up' | 'down' | 'flat'
    points: number[]
  }[]
  source: string
  caption: string
}

export type Viz =
  | BarsViz | PairedBarsViz | SignedBarsViz | LineViz | TableViz | MoversViz
  | DonutViz | AreaViz | ScatterViz | SparkViz

export type PanelBody = { kind: 'kpis'; tiles: KpiSpec[] } | Viz

// Span 3 joined 1, 2 and 4 when the grid stopped being a single flat
// wall: a section whose row is one wide figure plus one narrow companion
// needs 3 + 1, and forcing that to 2 + 2 gave the companion more room
// than it had anything to put in.
export interface Panel { id: string; span: 1 | 2 | 3 | 4; body: PanelBody }

// A dashboard is read top to bottom as an argument, not scanned as a
// grid, so its panels arrive already grouped. Each section states what
// question its tiles answer; the pane draws the ordinal and the count.
export interface Section {
  id: string
  title: string
  subtitle: string
  panels: Panel[]
}
