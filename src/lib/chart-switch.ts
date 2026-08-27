import type {
  BarsViz, LineViz, SignedBarsViz, TableViz, Viz,
} from './types'

/**
 * Chart-type switching policy for the demo's widget header.
 *
 * The real product has this control (`src/lib/chart-switch.ts` and
 * `components/widgets/chart-type-menu.tsx` in gf-app-dashboard): a widget in a
 * chat answer carries a type switcher, and the widget decides from its own LIVE
 * data shape which targets are offered. Two outcomes exist there:
 *
 *   - "in-place"     the current data already supports the target, so the chart
 *                    re-renders client side. No backend round trip.
 *   - "orchestrator" the target needs a reshape the frontend cannot fake, so it
 *                    sends a new chat turn and the agent re-defines the widget.
 *
 * THE DEMO OFFERS IN-PLACE ONLY. There is no agent behind it, so an
 * "orchestrator" row would be a menu item that promises a re-query and does
 * nothing. Everything this menu offers, it draws. That is the one deliberate
 * divergence from the product's menu, and it is a subtraction rather than an
 * invention.
 *
 * The four targets are the ones the demo's own renderers can honestly draw from
 * any of its figures. Pie, donut, radar and scatter are in the product's
 * vocabulary and are absent here for the same reason: nothing in this demo draws
 * them, and a menu that lists them would be listing furniture.
 */

/**
 * A type the menu can name. The first four are TARGETS, offered on every
 * figure that holds numbers. The rest appear only as the type a figure already
 * is: a donut is honest only where the parts sum to the centre, a scatter needs
 * both an x and a y measure, and a spark row needs its own history, so none of
 * the three can be projected onto an arbitrary figure. The product draws the
 * same line, routing its unprojectable targets back through the agent instead;
 * with no agent here they are simply not offered.
 */
export type ChartType =
  | 'bar' | 'line' | 'area' | 'table'
  | 'list' | 'donut' | 'scatter' | 'spark'

/** Menu order, matching the product's `CHART_SWITCH_TARGETS` ordering. */
const TARGET_ORDER: ChartType[] = ['bar', 'line', 'area', 'table']

const LABEL: Record<ChartType, string> = {
  bar: 'Bar',
  line: 'Line',
  area: 'Area',
  table: 'Table',
  list: 'List',
  donut: 'Donut',
  scatter: 'Scatter',
  spark: 'Stats',
}

export interface ChartSwitchOption {
  type: ChartType
  label: string
  isCurrent: boolean
}

export interface PlotSeries {
  name: string
  points: number[]
  /** The figure's own formatted cells, carried so a projection never reformats. */
  displays: string[]
}

/** A figure reduced to labels and one or two numeric series. */
export interface Plottable {
  labels: string[]
  series: PlotSeries[]
  hasNegative: boolean
}

/**
 * The single-series measure name. The product takes this from the series
 * metadata; a one-series demo figure has none, and 'Value' is what its own
 * off-screen table already calls that column, so the two agree.
 */
const VALUE = 'Value'

/**
 * The number inside a formatted cell.
 *
 * Only the table figures need this: their rows are display strings, because a
 * table is what the answer was built to be. Everything else already carries
 * numbers. Handles the sign glyphs the copy rules use (U+2212 MINUS in a
 * negative figure, a leading + on a signed one), the currency words, and the
 * magnitude suffixes, so a column mixing "Rs 800K" with "Rs 1.2M" compares
 * correctly rather than putting 800 above 1.2.
 */
export function parseCell(cell: string): number | null {
  const cleaned = cell.replace(/−/g, '-').replace(/,/g, '').trim()
  const m = /^([+-]?)\s*(?:Rs\.?\s*)?([0-9]*\.?[0-9]+)\s*(bn|b|m|k|%|x)?/i.exec(cleaned)
  if (!m) return null
  const [, sign, digits, suffix] = m
  const scale =
    suffix?.toLowerCase() === 'bn' || suffix?.toLowerCase() === 'b' ? 1e9
    : suffix?.toLowerCase() === 'm' ? 1e6
    : suffix?.toLowerCase() === 'k' ? 1e3
    : 1
  const value = Number(digits) * scale
  return sign === '-' ? -value : value
}

/** Display strings for a series that carries only numbers. */
function numberCells(points: number[]): string[] {
  return points.map((p) => p.toLocaleString('en-US', { maximumFractionDigits: 1 }))
}

/**
 * The type this figure was BUILT as, which is the type its own renderer draws.
 * Selecting it returns the card to the drawing the answer was designed around,
 * rather than to a reconstruction of it.
 */
export function nativeType(viz: Viz): ChartType {
  switch (viz.kind) {
    case 'line': return 'line'
    case 'area': return 'area'
    case 'table': return 'table'
    case 'movers': return 'list'
    case 'donut': return 'donut'
    case 'scatter': return 'scatter'
    case 'spark': return 'spark'
    default: return 'bar'
  }
}

/** The figure as labels and numeric series, or null when it holds no numbers. */
export function plottable(viz: Viz): Plottable | null {
  switch (viz.kind) {
    case 'bars':
    case 'signedBars': {
      const points = viz.rows.map((r) => r.value)
      return {
        labels: viz.rows.map((r) => r.label),
        series: [{ name: VALUE, points, displays: viz.rows.map((r) => r.display) }],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'pairedBars': {
      const [a, b] = viz.series
      const points = [...viz.rows.map((r) => r.a), ...viz.rows.map((r) => r.b)]
      return {
        labels: viz.rows.map((r) => r.label),
        series: [
          { name: a, points: viz.rows.map((r) => r.a), displays: viz.rows.map((r) => r.aDisplay) },
          { name: b, points: viz.rows.map((r) => r.b), displays: viz.rows.map((r) => r.bDisplay) },
        ],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'line': {
      const points = viz.series.flatMap((s) => s.points)
      return {
        labels: viz.xLabels,
        series: viz.series.map((s) => ({
          name: s.name, points: s.points, displays: numberCells(s.points),
        })),
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'movers': {
      const points = viz.rows.map((r) => r.value)
      return {
        labels: viz.rows.map((r) => r.code),
        series: [{ name: VALUE, points, displays: viz.rows.map((r) => r.display) }],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'area': {
      const points = viz.series.flatMap((s) => s.points)
      return {
        labels: viz.xLabels,
        // Already the normalised shape: name, points and the figure's own cells.
        series: viz.series.map((s) => ({
          name: s.name, points: s.points, displays: s.displays,
        })),
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'donut': {
      const points = viz.rows.map((r) => r.value)
      return {
        labels: viz.rows.map((r) => r.label),
        series: [{ name: VALUE, points, displays: viz.rows.map((r) => r.display) }],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'scatter': {
      // The two measures become the two series, so the pair a scatter plots
      // against each other can also be read side by side.
      const points = [...viz.points.map((p) => p.x), ...viz.points.map((p) => p.y)]
      return {
        labels: viz.points.map((p) => p.label),
        series: [
          {
            name: viz.xName,
            points: viz.points.map((p) => p.x),
            displays: viz.points.map((p) => p.xDisplay),
          },
          {
            name: viz.yName,
            points: viz.points.map((p) => p.y),
            displays: viz.points.map((p) => p.yDisplay),
          },
        ],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'spark': {
      // A spark row states its level as a formatted string and carries the
      // history that produced it. The level is what the other types plot; the
      // history is the one thing only a sparkline shows, which is why 'spark'
      // is not a target.
      const parsed = viz.rows.map((r) => parseCell(r.value))
      if (parsed.some((v) => v === null)) return null
      const points = parsed as number[]
      return {
        labels: viz.rows.map((r) => r.label),
        series: [{ name: VALUE, points, displays: viz.rows.map((r) => r.value) }],
        hasNegative: points.some((p) => p < 0),
      }
    }
    case 'table': {
      // Column one is the label; every other column is a series, but only if
      // EVERY cell in it parses. A column with one unparseable cell would plot
      // a hole, so the column is dropped instead.
      const series: PlotSeries[] = []
      for (let c = 1; c < viz.columns.length; c += 1) {
        const displays = viz.rows.map((r) => r[c] ?? '')
        const parsed = displays.map(parseCell)
        if (parsed.some((p) => p === null)) continue
        series.push({ name: viz.columns[c], points: parsed as number[], displays })
      }
      if (series.length === 0) return null
      // Two axes are the most the demo's charts draw. A third measure would
      // need a third scale, and the reader would have no way to tell which
      // line belonged to which.
      const kept = series.slice(0, 2)
      return {
        labels: viz.rows.map((r) => r[0]),
        series: kept,
        hasNegative: kept.some((s) => s.points.some((p) => p < 0)),
      }
    }
  }
}

/**
 * The menu's rows, or an empty list when this figure holds nothing to plot. An
 * empty list means no switcher is rendered at all, which is the product's own
 * behaviour for a figure with nothing to switch to (`SWITCH_ELIGIBLE_CURRENT`
 * excludes single-value cards for the same reason).
 */
export function switchOptions(viz: Viz, current: ChartType): ChartSwitchOption[] {
  if (!plottable(viz)) return []
  const native = nativeType(viz)
  const types = TARGET_ORDER.includes(native) ? TARGET_ORDER : [native, ...TARGET_ORDER]
  return types.map((type) => ({
    type,
    label: LABEL[type],
    isCurrent: type === current,
  }))
}

/** The figure as a table: the labels column, then each series' own cells. */
export function asTable(viz: Viz, plot: Plottable): TableViz {
  return {
    kind: 'table',
    title: viz.title,
    columns: ['Name', ...plot.series.map((s) => s.name)],
    rows: plot.labels.map((label, i) => [label, ...plot.series.map((s) => s.displays[i] ?? '')]),
    source: viz.source,
    caption: viz.caption,
  }
}

/**
 * The figure as ranked horizontal bars, which is what the demo's Bars and
 * SignedBars draw. Used only for a SINGLE-series figure: two series over the
 * same categories is what PairedBars is for, and a figure with more points than
 * a ranked list wants goes to the column chart instead. `barShape` decides.
 */
export function asBars(viz: Viz, plot: Plottable): BarsViz | SignedBarsViz {
  const [s] = plot.series
  const rows = plot.labels.map((label, i) => ({
    label,
    value: s.points[i],
    display: s.displays[i] ?? '',
  }))
  return {
    kind: plot.hasNegative ? 'signedBars' : 'bars',
    title: viz.title,
    rows,
    source: viz.source,
    caption: viz.caption,
  } as BarsViz | SignedBarsViz
}

/** The figure as one line per series over the labels. */
export function asLine(viz: Viz, plot: Plottable): LineViz {
  return {
    kind: 'line',
    title: viz.title,
    xLabels: plot.labels,
    series: plot.series.map((s) => ({ name: s.name, points: s.points, accent: '' })),
    source: viz.source,
    caption: viz.caption,
  }
}

/**
 * Above this many categories, a ranked horizontal bar chart stops being one:
 * twelve months of revenue drawn as twelve stacked rows reads as a list, and
 * every label sits sideways to the series it belongs to. Wider figures take the
 * column chart, which is what the product's own renderer picks for a temporal
 * axis. Below it, horizontal ranked bars, the platform default for a category
 * set.
 */
export const RANKED_BAR_MAX_CATEGORIES = 8

export type BarShape = 'ranked' | 'columns'

/**
 * Ranked horizontal bars, or columns on a value axis.
 *
 * TWO series always take columns, never the grouped-bars renderer, even
 * though that one draws exactly this shape. PairedBars hides its value axis on
 * purpose: it was built for two measures of comparable size, P/E around 6
 * against a yield around 9, where a shared numeric axis would invite reading
 * one as the other. Feed it a projection and that precondition is gone. The
 * account-gain table pairs a gain in rupees, 174,000, with a gain in percent,
 * 15.8, and on one hidden axis the percentages are nought pixels tall: three
 * value labels floating over no bars at all. Columns give each series its own
 * axis, which is the only honest way to draw a pair whose units you do not
 * control. Same reasoning as ProjectedChart's area, same trap.
 */
export function barShape(plot: Plottable): BarShape {
  if (plot.labels.length > RANKED_BAR_MAX_CATEGORIES) return 'columns'
  return plot.series.length > 1 ? 'columns' : 'ranked'
}
