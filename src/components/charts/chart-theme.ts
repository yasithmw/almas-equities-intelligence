export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
];

export const SEMANTIC_COLORS = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
} as const;

export const AXIS_COLOR = "hsl(var(--muted-foreground))";

/** The two inks a label drawn ON a mark can take.
 *
 *  LITERALS, and deliberately not theme tokens — which is why they live here
 *  rather than inline in a chart. They are chosen by measuring the contrast
 *  against a background the CALLER supplied, by any of THREE routes:
 *  `config.negativeColor` on a negative bar, an explicit `series.color`, or a
 *  literal sitting in `config.colorPalette`. The last two are the only ones a
 *  STACKED segment can reach — `negativeColor` never gets there, because the
 *  `<Cell>` loop that applies it is gated on `!isStacked`.
 *
 *  What all three share is that the fill resolves to a LITERAL, and a literal
 *  is the same colour in both themes, so the ink must be too. `AXIS_COLOR` is
 *  a token that goes LIGHT in dark theme, which on a pale fill is the very
 *  failure the contrast check exists to prevent. (xreview R3, widened R8) */
export const ON_MARK_LIGHT_INK = "#fff";
export const ON_MARK_DARK_INK = "#1a1a1a";
export const GRID_COLOR = "hsl(var(--border))";

/** Weight applied to X/Y axis tick labels — semibold so the scale reads
 *  confidently without competing with the plotted marks. */
export const AXIS_TICK_WEIGHT = 600;

/** Shared X/Y (and polar) axis tick-label style: muted gray + semibold.
 *  Charts pass their density font size; color and weight stay consistent
 *  across every chart type so axis scales read the same everywhere. */
export function axisTick(fontSize: number): { fill: string; fontSize: number; fontWeight: number } {
  return { fill: AXIS_COLOR, fontSize, fontWeight: AXIS_TICK_WEIGHT };
}
export const TOOLTIP_BG = "hsl(var(--popover))";
export const TOOLTIP_BORDER = "hsl(var(--border))";
export const TOOLTIP_TEXT = "hsl(var(--popover-foreground))";

export function getSeriesColor(index: number, palette?: string[]): string {
  const colors = palette ?? CHART_COLORS;
  return colors[index % colors.length];
}

/**
 * Resolve the color for a series, honoring an explicit per-series `color`
 * (e.g. set by the "change this chart to red" chat mutation, which writes
 * `SeriesConfig.color`) before falling back to the palette-by-index default.
 * Charts must call THIS, not `getSeriesColor`, wherever a series can carry
 * its own color — otherwise an explicit color is silently ignored.
 */
export function resolveSeriesColor(
  series: { color?: string } | undefined,
  index: number,
  palette?: string[],
): string {
  return series?.color ?? getSeriesColor(index, palette);
}

/** Sanitize an arbitrary dataKey into an SVG-safe id fragment.
 *  SVG url() references terminate at whitespace, so `id="grad-Bc Hydro"`
 *  combined with `fill="url(#grad-Bc Hydro)"` resolves to `#grad-Bc` and
 *  the fill silently falls back to black. Replace any char outside
 *  [A-Za-z0-9_-] with `_` so id and reference always match. */
export function slugifyId(key: string): string {
  return key.replace(/[^A-Za-z0-9_-]/g, "_");
}

const _PALETTE_OFFSETS = [0, 2, 5, 7, 3, 9, 1, 6, 4, 8] as const;

export function getWidgetPalette(widgetIndex: number): string[] {
  const offset = _PALETTE_OFFSETS[widgetIndex % _PALETTE_OFFSETS.length];
  return CHART_COLORS.map((_, i) => CHART_COLORS[(i + offset) % CHART_COLORS.length]);
}

// ---------------------------------------------------------------------------
// Temporal column detection — mirrors backend _TEMPORAL_KEY_RE / _DATE_VALUE_RE
// in app/agents/ui/widget_agent.py.  Used to suppress comma-formatting on
// year/date columns (e.g. "2025" should stay "2025", not "2,025").
// ---------------------------------------------------------------------------

const _TEMPORAL_KEY_RE = /(?:^date$|^year$|^month$|^quarter$|^year_month$|^week$|^day$|^period$|^timestamp$|^time$|^yr$|^qtr$|_date$|_month$|_year$|_quarter$|_week$|install_year)/i;
const _DATE_VALUE_RE = /^\d{4}[-/]\d{2}|^\d{2}\/\d{2}\/\d{4}|^Q[1-4]\s*\d{4}|^\d{4}\s*Q[1-4]|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|^\d{4}-W\d{2}/i;

/** Check if a column name represents a temporal/date dimension. */
export function isTemporalColumn(key: string): boolean {
  return _TEMPORAL_KEY_RE.test(key);
}

/** Check if a string value looks like a date/time literal. */
export function isTemporalValue(value: string): boolean {
  return _DATE_VALUE_RE.test(value);
}

// Identifier-like columns (truck_number, case_number, UnitId, mastertag,
// serials…) are LABELS, not quantities — "2,659" is wrong for truck 2659.
// Ends-with match so count-style names (number_of_trips) keep formatting.
// snake_case / start-anchored suffixes, any casing (truck_number, Truck_Number)
const _IDENTIFIER_SNAKE_RE =
  /(?:^|_)(?:id|uuid|guid|number|num|no|imei|serial|mastertag|zip|zipcode|phone|account)$/i;
// camelCase suffixes, case-sensitive so "casino"/"piano" style words can't match
const _IDENTIFIER_CAMEL_RE = /[a-z](?:Id|ID|Uuid|Guid|Number|Num|No)$/;

/** Check if a column name represents an identifier (render verbatim, no
 *  thousands separators). */
export function isIdentifierColumn(key: string): boolean {
  return _IDENTIFIER_SNAKE_RE.test(key) || _IDENTIFIER_CAMEL_RE.test(key);
}

/**
 * Build a Set of dataKeys whose values should be rendered verbatim
 * (no comma grouping, no abbreviation).  Includes:
 * - xAxis.dataKey when the column name matches _TEMPORAL_KEY_RE
 * - Any key whose first sample value matches _DATE_VALUE_RE
 */
export function detectTemporalKeys(
  config: { xAxis?: { dataKey?: string }; [k: string]: unknown },
  sampleRow?: Record<string, unknown>,
): Set<string> {
  const keys = new Set<string>();
  const xKey = config.xAxis?.dataKey;
  if (xKey && isTemporalColumn(xKey)) keys.add(xKey);
  if (sampleRow) {
    for (const [k, v] of Object.entries(sampleRow)) {
      if (typeof v === "string" && isTemporalValue(v)) keys.add(k);
      if (isTemporalColumn(k)) keys.add(k);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Temporal ORDERING
// ---------------------------------------------------------------------------
// Detection (isTemporalColumn / isTemporalValue) decides WHETHER an axis is a
// time dimension; the helpers below decide the ORDER. Any chart whose axis is
// a year / quarter / month / year-quarter / year-month / week / day / date
// should read left-to-right chronologically regardless of the row order the
// backend happened to return.
//
// Within a single axis every value shares one format (you never mix "Q1 2024"
// with "Jan"), so each branch of the key function only needs to be internally
// monotonic — it does NOT need to be comparable across formats.

const _MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Map a temporal-looking value to a monotonic numeric sort key, or `null` when
 * it doesn't parse as a recognised time form. Handles:
 *  - quarter: "Q1 2024" / "Q1-2024" / "2024 Q1" / "2024-Q1" / "2024Q1"
 *  - ISO week: "2024-W05" / "2024W5"
 *  - month name (± year): "Jan", "January", "Sept 2024", "Feb-2024"
 *  - pure integers: year "2023", year_month "202401", month/day numbers
 *  - anything Date.parse understands: "2024-01", "2024-01-15",
 *    "01/15/2024", "January 15, 2024", ISO timestamps
 */
export function temporalSortKey(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s) return null;

  // Quarter — leading "Qn": "Q1 2024" / "Q1-2024"
  let m = s.match(/^Q([1-4])[\s\-/_]*(\d{4})$/i);
  if (m) return Number(m[2]) * 4 + (Number(m[1]) - 1);
  // Quarter — leading year: "2024 Q1" / "2024-Q1" / "2024Q1"
  m = s.match(/^(\d{4})[\s\-/_]*Q([1-4])$/i);
  if (m) return Number(m[1]) * 4 + (Number(m[2]) - 1);

  // ISO week — "2024-W05" / "2024W5"
  m = s.match(/^(\d{4})[-\s_]?W(\d{1,2})$/i);
  if (m) return Number(m[1]) * 54 + Number(m[2]);

  // Month name (full or abbreviated), optional trailing year. The full-string
  // anchor + explicit month vocabulary keeps non-month categories that merely
  // start with a month prefix (e.g. "Marketing") from being mistaken for a
  // month.
  m = s.match(
    /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\.?[\s\-,/_]*(\d{4})?$/i,
  );
  if (m) {
    const mi = _MONTH_INDEX[m[1].slice(0, 3).toLowerCase()];
    if (mi != null) return (m[2] ? Number(m[2]) : 0) * 12 + mi;
  }

  // Pure integer — year "2023", year_month "202401", bare month/day number.
  if (/^\d+$/.test(s)) return Number(s);

  // Fallback: real dates / timestamps.
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return t;

  return null;
}

/** Ascending comparator for two time-axis values. Falls back to a stable
 *  lexicographic compare when either side isn't a recognised time form so a
 *  stray non-temporal value can't scramble the ordering. */
export function compareTemporal(a: unknown, b: unknown): number {
  const ka = temporalSortKey(a);
  const kb = temporalSortKey(b);
  if (ka != null && kb != null) return ka - kb;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

/** Majority-of-sample temporal test: true when more than half of the first few
 *  non-empty values parse as a recognised time form. Sampling several values
 *  (not just the first) stops a leading placeholder ("N/A", "Total", "") from
 *  masking a genuine time axis, while the majority threshold stops a lone
 *  date-like string from flipping a categorical axis into missorted order. */
function majorityTemporal(values: Iterable<unknown>, sampleSize = 8): boolean {
  let seen = 0;
  let temporal = 0;
  for (const v of values) {
    if (v == null || v === "") continue;
    seen++;
    if (typeof v === "string" && isTemporalValue(v)) temporal++;
    if (seen >= sampleSize) break;
  }
  return seen > 0 && temporal * 2 > seen;
}

/** Whether the `xKey` axis of `data` is a time dimension — by column name
 *  (isTemporalColumn) or, failing that, by the shape of a SAMPLE of its values
 *  (majorityTemporal, so a leading placeholder can't mask the axis). */
export function isTemporalAxis(
  data: Record<string, unknown>[],
  xKey: string,
): boolean {
  if (isTemporalColumn(xKey)) return true;
  return majorityTemporal(data.map((r) => r?.[xKey]));
}

/** Return `data` sorted ascending along the temporal `xKey` axis. When the
 *  axis isn't temporal the original array is returned untouched (callers keep
 *  their own ordering — e.g. bar charts sort non-temporal axes by metric). A
 *  copy is made only when a sort actually happens. */
export function sortByTemporalAxis(
  data: Record<string, unknown>[],
  xKey: string,
): Record<string, unknown>[] {
  if (data.length < 2 || !isTemporalAxis(data, xKey)) return data;
  return [...data].sort((a, b) => compareTemporal(a[xKey], b[xKey]));
}

/** Sort a list of axis labels (e.g. heatmap column / row headers) ascending
 *  when the `key` names a time dimension or the labels themselves look
 *  temporal; otherwise return them unchanged. */
export function sortLabelsIfTemporal(labels: string[], key: string): string[] {
  if (labels.length < 2) return labels;
  const temporal = isTemporalColumn(key) || majorityTemporal(labels);
  return temporal ? [...labels].sort(compareTemporal) : labels;
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

export function formatCompact(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  if (abs >= 10_000) return `${(n / 1_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatCurrency(value: number | string, currency = "$"): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${currency}${(n / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`;
  if (abs >= 1_000_000) return `${currency}${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  return `${currency}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number | string, decimals = 2): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals })}%`;
}

export function formatNumber(value: unknown, format?: string): string {
  if (value == null) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  switch (format) {
    case "currency":
      return formatCurrency(n);
    case "percent":
    case "percentage":
      return formatPercentage(n);
    case "compact":
      return formatCompact(n);
    default:
      return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

// ---------------------------------------------------------------------------
// Format inference — when the backend doesn't send an explicit `format`,
// infer it from the dataKey name so that KPI values still render with $ / %.
// ---------------------------------------------------------------------------

const _CURRENCY_KEY_RE = /(?:^|_)(cost|costs|price|prices|revenue|revenues|amount|amounts|spend|spending|savings|saving|profit|profits|loss|losses|income|expense|expenses|paid|owed|payment|payments|tco|lcoe|capex|opex|budget|value_usd|usd|dollars?)(?:$|_)/i;
// NOTE: include BOTH US (``utilization``) AND UK (``utilisation``)
// spellings — the lakehouse uses UK conventions in column names
// (``avg_utilisation``, ``utilisation_percent``) while the chart vocab
// leaned US-only. Also catches ``reduction`` (``idle_reduction``,
// ``cohort_idle_reduction``) which is always a percentage in our
// domain.
const _PERCENT_KEY_RE = /(?:^|_)(pct|percent|percentage|rate|ratio|utilization|utilisation|reduction|efficiency|availability|uptime|downtime|soc|soh|margin|adoption|coverage|share|fraction)(?:$|_)/i;

/** Union of every ``format`` string the renderer / formatNumber accepts.
 *  Kept as a named alias because ``inferFormatFromKey`` returns this and
 *  the KPI card uses it to disambiguate percent / currency / numeric
 *  rendering. ``"percent"`` and ``"percentage"`` are BOTH valid — the
 *  seed migrations use the short form, the chart-config type uses the
 *  long form. Both route to ``formatPercentage`` inside ``formatNumber``. */
export type ResolvedFormat =
  | "currency"
  | "percent"
  | "percentage"
  | "number"
  | "decimal"
  | "compact"
  | undefined;

/**
 * Infer a number format from a dataKey name when no explicit format is set.
 * Returns the provided `explicit` format if present, otherwise falls back to
 * "currency" / "percentage" based on common naming conventions, else undefined.
 */
export function inferFormatFromKey(
  key: string | undefined,
  explicit?: string,
): ResolvedFormat {
  if (explicit && explicit !== "number") return explicit as ResolvedFormat;
  if (!key) return explicit as ResolvedFormat;
  if (_CURRENCY_KEY_RE.test(key)) return "currency";
  if (_PERCENT_KEY_RE.test(key)) return "percentage";
  return explicit as ResolvedFormat;
}

/** Resolve a valueFormat string into a tick/label formatter function. */
export function resolveFormatter(format?: string): (value: number | string) => string {
  switch (format) {
    case "currency":
      return formatCurrency;
    case "percent":
    case "percentage":
      return formatPercentage;
    case "compact":
      return formatCompact;
    // "decimal" is emitted by the backend's infer_value_format (alongside
    // compact / currency / number / percent) but had no case here, so it fell
    // through to formatCompact and rendered 12345.67 as "12.3K". That affects
    // any axis fed a decimal format, not just the combo secondary axis.
    case "decimal":
    case "number":
      return (v) => {
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isNaN(n)) return String(v);
        return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
      };
    default:
      return formatCompact;
  }
}

/**
 * A formatter that renders EVERY value in a series with the SAME grammar.
 *
 * `formatCompact` and `formatCurrency` pick their unit per value, so a single
 * chart shows "42.3K" beside "9,047.02" — the 10,000 threshold falls between two
 * bars and the reader is asked to compare a scaled number with an unscaled one.
 * Currency has the same seam plus a second one: it prints cents at every
 * magnitude, so a dollar bar reads "$9,047.02" when the cents are noise.
 *
 * The unit is chosen ONCE from the largest magnitude in the data and applied to
 * all of it, which is what makes the labels comparable at a glance. Precision
 * follows the unit rather than the value: scaled units keep one decimal (42.3K,
 * 9.0K), and an unscaled series keeps decimals only when they carry information
 * — a value under 1,000 where the data is not whole numbers.
 *
 * Pass the values the chart actually plots. With none (or all non-finite) this
 * degrades to `resolveFormatter`'s per-value behaviour, so a caller that cannot
 * supply them is no worse off than before.
 */
export function resolveUniformFormatter(
  format: string | undefined,
  values: readonly (number | string | null | undefined)[],
): (value: number | string) => string {
  const isCurrency = format === "currency";
  if (!isCurrency && format !== "compact" && format !== undefined) {
    // percent / decimal / number already render one way at every magnitude.
    return resolveFormatter(format);
  }
  // `null` must be dropped BEFORE Number(), which turns it into 0 — a finite
  // value that then counts toward the peak. A series of gaps would pick the
  // unscaled unit off a peak of zero and render every real label unscaled.
  const nums = values
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => (typeof v === "number" ? v : Number(v)))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return resolveFormatter(format);

  const peak = Math.max(...nums.map(Math.abs));
  // Each format keeps ITS OWN tiers. `formatCurrency` has never had a K tier —
  // it prints "$42,300" in full and only scales at 1M — so borrowing compact's
  // K here silently restyled every currency chart in the 10k–1M range, which is
  // most of them, for a fix that was only ever about cents. (xreview D2)
  const [divisor, suffix] =
    peak >= 1_000_000_000 ? [1_000_000_000, "B"] as const
    : peak >= 1_000_000 ? [1_000_000, "M"] as const
    // Compact's own K threshold, so a compact chart whose values all sit on one
    // side of it is untouched by this function.
    : !isCurrency && peak >= 10_000 ? [1_000, "K"] as const
    : [1, ""] as const;
  const prefix = isCurrency ? "$" : "";
  // SCALED: one decimal, pinned (min === max) so 42.3K and 9.0K line up.
  // UNSCALED: max-only, matching `formatCompact` / `formatCurrency` digit for
  // digit — the earlier version forced 0 decimals for any peak >= 1,000, which
  // quietly dropped precision in a range the comment claimed was unchanged
  // (9,047.02 -> "9,047"). Cents still go from a DOLLAR series at that scale;
  // that was the actual complaint. (xreview D5)
  const decimals = suffix ? 1 : isCurrency ? (peak >= 1_000 ? 0 : 2) : 2;

  return (value: number | string): string => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    if (n === 0) return `${prefix}0`;
    const scaled = n / divisor;
    // A value orders of magnitude below the peak rounds away at the shared
    // precision, and "$0.0B" for a real $12,000,000 bar is a worse lie than the
    // mixed units this function exists to remove. Say "below the resolution of
    // this axis" instead — and never emit a signed zero. (xreview D3, D6)
    if (Number(scaled.toFixed(decimals)) === 0) {
      const floor = `${prefix}${(1 / 10 ** decimals).toFixed(decimals)}${suffix}`;
      return n > 0 ? `<${floor}` : `>-${floor}`;
    }
    return `${prefix}${scaled.toLocaleString("en-US", {
      ...(suffix ? { minimumFractionDigits: decimals } : {}),
      maximumFractionDigits: decimals,
    })}${suffix}`;
  };
}

/**
 * Display text for a CATEGORICAL axis label that arrived as a number.
 *
 * Crosstab axes (heatmap rows/columns) stringify whatever the query returned,
 * so a numeric dimension carries its IEEE-754 tail into the header —
 * "0.30000000000000004" for a 0.3 bin edge. This trims that tail WITHOUT
 * touching anything else: an integer label is an identity (a year, a bin
 * index, an asset number) and keeps its digits verbatim — no thousands
 * grouping, so 2026 never becomes "2,026" — and a non-numeric label is
 * returned as-is.
 *
 * It trims the NOISE, not the PRECISION. A fixed 2-decimal clamp would render
 * the bin edges 0.301 and 0.302 as the same "0.3" — two different columns
 * under one header, which is worse than the tail it was fixing. Rounding to
 * 12 significant digits kills the binary-representation tail (a double carries
 * ~15-17) while leaving every digit the query actually meant.
 *
 * Display only. The caller keeps the raw string as its lookup key, exactly as
 * the idle-reduction grid does with its month labels.
 */
export function formatCategoryLabel(label: string): string {
  if (label.trim() === "") return label;
  const n = Number(label);
  if (!Number.isFinite(n) || Number.isInteger(n)) return label;
  return String(Number(n.toPrecision(12)));
}

export function percentOfTotal(value: number, data: Record<string, unknown>[], dataKey: string): string {
  const total = data.reduce((sum, row) => sum + Number(row[dataKey] ?? 0), 0);
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function hasNegativeValues(data: Record<string, unknown>[], keys: string[]): boolean {
  return data.some((row) => keys.some((k) => Number(row[k] ?? 0) < 0));
}

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: 8,
  fontSize: 12,
  color: TOOLTIP_TEXT,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

export const ANIMATION_DEFAULTS = {
  duration: 600,
  easing: "ease-out" as const,
};

export const DENSITY = {
  compact: {
    fontSize: 10,
    axisFontSize: 10,
    axisWidth: 36,
    marginLeft: -8,
    chartHeight: "h-52",
    barMaxSize: 36,
    pieInnerRadius: 28,
    pieOuterRadius: 44,
    dotRadius: 2,
    strokeWidth: 2,
  },
  comfortable: {
    fontSize: 12,
    axisFontSize: 11,
    axisWidth: 44,
    marginLeft: 0,
    chartHeight: "h-80",
    barMaxSize: 48,
    pieInnerRadius: 48,
    pieOuterRadius: 72,
    dotRadius: 3,
    strokeWidth: 2.75,
  },
} as const;

export type Density = keyof typeof DENSITY;

export function truncateLabel(label: string, maxLength = 14): string {
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 1) + "…";
}

/** Words a title-case pass leaves lowercase when they aren't leading. */
const LABEL_SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or",
  "per", "the", "to", "vs", "with",
]);

/** Tokens that are ACRONYMS in this domain, so title case would mangle them
 *  ("pa_resolved" → "Pa Resolved"). Lowercase keys; the whole token must
 *  match, so "spend" is untouched by "sp". */
const LABEL_ACRONYMS = new Set([
  "pa", "sp", "hcp", "dci", "id", "npi", "ndc", "icd", "rx", "gi", "ae",
  "us", "uk", "ytd", "mtd", "qtd", "roi", "kpi", "sla",
  "emr", "ehr", "sql", "url", "utc", "hcpcs", "poc", "sku", "eob", "oop",
]);

/**
 * Turn a machine identifier into something a reader can take at face value:
 * `referral_to_sp` → "Referral to SP", `episodes` → "Episodes".
 *
 * Applied at RENDER time, to axis category values and to legend / tooltip
 * series names, because that is where the raw value reaches the user. The
 * strings involved are SQL column names and Gold-layer enum values — the
 * planner names a series when it can, but a category value comes straight out
 * of the warehouse, so nothing upstream ever gets a chance to phrase it.
 * (The export paths — PDF/PPTX/XLSX — already do exactly this via their own
 * `humanizeKey`, so the live chart was the odd one out.)
 *
 * Deliberately conservative — a label the user has already written, or one that
 * isn't an identifier at all, survives untouched. It rewrites EXACTLY ONE shape
 * and passes everything else through verbatim:
 *
 *     lowercase alphabetic words, joined by single `_` or `-`
 *
 * which is the one form that is never intentional in a rendered label. So prose
 * ("Mean days on therapy"), deliberate casing ("mLPerKg", "CP-211210"), dates
 * ("2024-01"), numbers, emails, paths, region codes ("us-west-2"), gene symbols
 * ("ugt1a1"), period labels ("q1_2024") and internal fields ("_id") all pass
 * through — not because each is listed, but because none of them is that shape.
 */
export function humanizeLabel(value: unknown): string {
  if (value == null) return "";
  const raw = String(value);
  const s = raw.trim();
  // ONE anchored shape test, deliberately, rather than a list of things to
  // reject. Two rounds of review found holes in the list — a digit anywhere
  // (`cp-211210` → "Cp 211210", `ugt1a1` → "Ugt1a1", a gene), a leading
  // separator (`_id` → "ID"), a trailing one (`id_` → "ID"), a doubled one
  // (`a__b` → "A B") — because every guard added covered one more spelling of
  // "not a phrase" and the next one was always still open. Stating the shape
  // that IS admissible closes all of them at once: lowercase alphabetic words,
  // single separators between them, nothing else. Everything a list would have
  // had to name — prose, deliberate casing, emails, URLs, paths, dates,
  // numbers, ids, region codes, gene symbols, period labels — fails it.
  //
  // It costs `age_band_1_5`, which stays raw. A label left alone is
  // recoverable; a corrupted identifier is not. (xreview R2, R3)
  if (!/^[a-z]+([_-][a-z]+)*$/.test(s)) return raw;

  const parts = s.split(/[_-]/);
  return parts
    .map((word, i) => {
      if (LABEL_ACRONYMS.has(word)) return word.toUpperCase();
      if (i > 0 && LABEL_SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

