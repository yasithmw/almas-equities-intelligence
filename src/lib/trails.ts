import type { Step } from './types'

/**
 * The reasoning trail behind each answer: what the agent resolved, the
 * statement it generated, what the validator checked, and, in Deep, the
 * statement it generated again after the reviewer sent the first one back.
 *
 * ## Where the shape comes from
 *
 * The platform's own feed (gf-app-dashboard, components/chat/
 * agent-activity-feed.tsx) hangs an expandable detail off a step and
 * decides how to render it by whether that detail IS the generated query:
 * prose goes in a `.agent-thinking-block`, a statement goes in a
 * `<pre class="agent-step-detail agent-step-detail--sql">` through
 * `formatSqlBlock`. This demo carries the same two fields per step and
 * renders them through the same ported formatter.
 *
 * ## Where the SQL's dialect and naming come from
 *
 * Both are taken from queries the agent workforce actually generated, in
 * gf-agent-workforce/tests/experiments. They are T-SQL against the Fabric
 * warehouse: `SELECT TOP n`, `CAST(ROUND(x, 1) AS DECIMAL(10,1))`,
 * `DATEADD`, `CAST(GETDATE() AS DATE)`. Tables are schema-qualified as
 * `<tenant>gold.gold_<domain>_<grain>`, exactly as
 * `viatecgold.gold_asset_daily_kpi` is in that corpus, so Almas's gold
 * layer reads `almasgold.gold_security_daily_kpi`.
 *
 * A trailing note in square brackets on its own line is also the
 * platform's own device, from `_display_sql`: it explains something the
 * governance layer did to the statement rather than something the analyst
 * asked for. The real one is `[row bound: 200 max; ...]`; the desk-scope
 * note here is the same idea applied to row-level scoping.
 *
 * ## What is real and what is not
 *
 * The dialect, the naming convention, the governance notes and the shape
 * of the trail are the platform's. The Almas tables and every number in
 * them are invented, like the rest of this demo. Nothing here executes:
 * the answers are scripted, and the demo band says so on every screen.
 *
 * The gold tables these statements read, as one coherent model:
 *
 *   gold_security_daily_kpi           session_date, ticker, security_name,
 *                                     sector, close_price,
 *                                     dividend_declared_ttm, pe_ratio,
 *                                     turnover_lkr, foreign_net_lkr,
 *                                     mtd_change_pct, index_weight_pct,
 *                                     last_trade_date
 *   gold_security_dividend_declared   ticker, declared_date,
 *                                     dividend_per_share_lkr, basis
 *   gold_security_foreign_flow_daily  session_date, ticker, leg_type,
 *                                     net_lkr
 *   gold_client_holding_daily         session_date, account_no,
 *                                     client_name, relationship_manager,
 *                                     ticker, quantity, avg_cost_lkr,
 *                                     settlement_status
 *   gold_brokerage_monthly            month_start, relationship_manager,
 *                                     brokerage_revenue_lkr,
 *                                     market_turnover_lkr,
 *                                     executed_turnover_lkr
 */
export interface Trail {
  /** Prose: how the question was resolved against the semantic model. */
  planned: string
  /** The statement the agent generated. */
  queried: string
  /** Prose: what the validator actually checked. */
  validated: string
  /** Deep only: the statement generated again after the reviewer's challenge. */
  requeried: string
  /** Prose: why the figure was drawn the way it was. */
  composed: string
}

const ROW_BOUND = '[row bound: 200 max; a result that reaches it is reported as capped]'

export const TRAILS: Record<string, Trail> = {
  q01: {
    planned:
      "Resolved \"listed bank stocks\" against the semantic model: sector = 'Banks' on gold_security_daily_kpi, four counters carry that classification. Resolved \"right now\" to the latest CLOSED session rather than today, because today has no closing price yet and a yield needs one.",
    queried: `SELECT TOP 10 ticker,
       security_name,
       CAST(ROUND(100.0 * dividend_declared_ttm / close_price, 1) AS DECIMAL(10,1)) AS dividend_yield_pct
FROM almasgold.gold_security_daily_kpi
WHERE sector = 'Banks'
  AND session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
  AND close_price > 0
ORDER BY dividend_yield_pct DESC
${ROW_BOUND}`,
    validated:
      'Four rows returned, four carried a declared dividend. Yields land between 5.5 and 9.4 percent, inside the plausible band for the sector. No null close price, so the divisor guard dropped nothing and the row count is the whole population, not a survivor set.',
    requeried: `SELECT TOP 10 ticker,
       security_name,
       CAST(ROUND(100.0 * dividend_declared_ttm / close_price, 1) AS DECIMAL(10,1)) AS dividend_yield_pct
FROM almasgold.gold_security_daily_kpi
WHERE (sector = 'Banks' OR ticker = 'NTB')
  AND session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
  AND close_price > 0
ORDER BY dividend_yield_pct DESC
[classification override: NTB carries sector = 'Diversified' in this load; the reviewer's correction is applied in the predicate, not written back to the table]`,
    composed:
      'Bar rows ranked descending, one per counter. The value label is the yield to one decimal, which is the precision dividend_declared_ttm supports; a second decimal would be invented.',
  },

  q02: {
    planned:
      'Two counters, two measures. Kept as separate measures rather than a single ratio: a P/E is a multiple and a yield is a percentage, so they do not share a scale and must not share an axis.',
    queried: `SELECT ticker,
       CAST(ROUND(pe_ratio, 1) AS DECIMAL(10,1)) AS pe_x,
       CAST(ROUND(100.0 * dividend_declared_ttm / close_price, 1) AS DECIMAL(10,1)) AS dividend_yield_pct
FROM almasgold.gold_security_daily_kpi
WHERE ticker IN ('COMB', 'HNB')
  AND session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
ORDER BY ticker`,
    validated:
      'Two rows, one per counter, no nulls in either measure. Both P/E values sit within two standard deviations of the sector median, so neither is an outlier worth flagging in the answer.',
    requeried: `WITH ttm AS (
  SELECT ticker,
         SUM(dividend_per_share_lkr) AS dividend_ttm_lkr
  FROM almasgold.gold_security_dividend_declared
  WHERE ticker IN ('COMB', 'HNB')
    AND declared_date >= DATEADD(MONTH, -12, CAST(GETDATE() AS DATE))
  GROUP BY ticker
)
SELECT k.ticker,
       CAST(ROUND(k.pe_ratio, 1) AS DECIMAL(10,1)) AS pe_x,
       CAST(ROUND(100.0 * t.dividend_ttm_lkr / k.close_price, 1) AS DECIMAL(10,1)) AS dividend_yield_pct
FROM almasgold.gold_security_daily_kpi AS k
JOIN ttm AS t ON t.ticker = k.ticker
WHERE k.session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
ORDER BY k.ticker
[basis: dividend summed from gold_security_dividend_declared over twelve trailing months, not read from the single dividend_declared_ttm column the first statement used]`,
    composed:
      'Grouped bars, one group per measure, with the value axis hidden and each bar labelled. A shared numeric axis would invite reading 6.2 against 9.4 as one quantity, which they are not.',
  },

  q03: {
    planned:
      'Resolved "this week" to the seven calendar days ending at the latest session, and "buying and selling" to a net figure per sector rather than two gross figures, because the question asks which way the flow went.',
    queried: `SELECT sector,
       CAST(ROUND(SUM(foreign_net_lkr) / 1000000.0, 0) AS INT) AS foreign_net_mn_lkr
FROM almasgold.gold_security_daily_kpi
WHERE session_date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
GROUP BY sector
ORDER BY foreign_net_mn_lkr DESC
${ROW_BOUND}`,
    validated:
      'Six sectors returned, every counter in the window accounted for. The sector totals sum to the market-wide net, so nothing was dropped by the grouping and nothing was counted twice by it.',
    requeried: `SELECT s.sector,
       CAST(ROUND(SUM(f.net_lkr) / 1000000.0, 0) AS INT) AS foreign_net_mn_lkr
FROM almasgold.gold_security_foreign_flow_daily AS f
JOIN almasgold.gold_security_daily_kpi AS s
  ON s.ticker = f.ticker
 AND s.session_date = f.session_date
WHERE f.session_date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
  AND f.leg_type <> 'CUSTODIAN_TRANSFER'
GROUP BY s.sector
ORDER BY foreign_net_mn_lkr DESC
${ROW_BOUND}`,
    composed:
      'Bars above and below zero against a drawn zero line, so a sector selling reads as a direction rather than as a small bar. Gains take the success ink and losses the danger ink.',
  },

  q04: {
    planned:
      'Resolved A/C 10482 to one account on gold_client_holding_daily and "gain since purchase" to market value less cost at the average cost held on the position, not to realised profit and loss, which is a different question.',
    queried: `SELECT h.ticker,
       h.quantity,
       CAST(ROUND(h.avg_cost_lkr, 2) AS DECIMAL(18,2)) AS avg_cost_lkr,
       CAST(ROUND(h.quantity * (k.close_price - h.avg_cost_lkr), 0) AS INT) AS gain_lkr
FROM almasgold.gold_client_holding_daily AS h
JOIN almasgold.gold_security_daily_kpi AS k
  ON k.ticker = h.ticker
 AND k.session_date = h.session_date
WHERE h.account_no = '10482'
  AND h.session_date = (SELECT MAX(session_date) FROM almasgold.gold_client_holding_daily)
ORDER BY gain_lkr DESC
[desk scope: rows whose relationship_manager is not the caller's are removed before the result is returned]`,
    validated:
      'Every holding on the account priced against the same session as the position, so no leg of the gain is drawn from a different day. Quantities are positive, so nothing here is a short the cost basis would misstate.',
    requeried: `SELECT h.ticker,
       h.quantity,
       CAST(ROUND(h.avg_cost_lkr, 2) AS DECIMAL(18,2)) AS avg_cost_lkr,
       CAST(ROUND(h.quantity * (k.close_price - h.avg_cost_lkr), 0) AS INT) AS gain_lkr
FROM almasgold.gold_client_holding_daily AS h
JOIN almasgold.gold_security_daily_kpi AS k
  ON k.ticker = h.ticker
 AND k.session_date = h.session_date
WHERE h.account_no = '10482'
  AND h.session_date = (SELECT MAX(session_date) FROM almasgold.gold_client_holding_daily)
  AND h.settlement_status = 'SETTLED'
ORDER BY gain_lkr DESC
[desk scope: rows whose relationship_manager is not the caller's are removed before the result is returned]`,
    composed:
      'A small table rather than a chart. Four holdings and a per-row currency figure are read, not compared by length, and a bar per row would add nothing the number does not already say.',
  },

  q05: {
    planned:
      'Resolved "driving the ASPI" to contribution, not to return: a sector\'s move matters to the index in proportion to its weight, so the measure is index_weight_pct multiplied by the sector\'s month-to-date change.',
    queried: `SELECT sector,
       CAST(ROUND(SUM(index_weight_pct * mtd_change_pct) / 100.0, 2) AS DECIMAL(10,2)) AS aspi_contribution_pct
FROM almasgold.gold_security_daily_kpi
WHERE session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
GROUP BY sector
ORDER BY aspi_contribution_pct DESC
${ROW_BOUND}`,
    validated:
      'Contributions sum to the index\'s own month-to-date move within one basis point, which is the check that matters here: if they did not, either a weight or a sector assignment would be wrong.',
    requeried: `SELECT sector,
       CAST(ROUND(SUM(index_weight_pct * mtd_change_pct) / 100.0, 2) AS DECIMAL(10,2)) AS aspi_contribution_pct
FROM almasgold.gold_security_daily_kpi
WHERE session_date = (SELECT MAX(session_date) FROM almasgold.gold_security_daily_kpi)
  AND last_trade_date >= DATEADD(DAY, -5, session_date)
GROUP BY sector
ORDER BY aspi_contribution_pct DESC
${ROW_BOUND}`,
    composed:
      'Bars in contribution order. The sector name sits on the axis rather than in a legend, because there is one series and a legend for one series is a label pretending to be a key.',
  },

  q06: {
    planned:
      'Two series over the same twelve months, one from the firm\'s own brokerage ledger and one from market data. Kept on separate axes: revenue is in tens of millions and turnover in billions, and on one axis the smaller series flattens onto the floor.',
    queried: `SELECT month_start,
       CAST(ROUND(SUM(brokerage_revenue_lkr) / 1000000.0, 1) AS DECIMAL(10,1)) AS brokerage_revenue_mn_lkr,
       CAST(ROUND(MAX(market_turnover_lkr) / 1000000000.0, 2) AS DECIMAL(10,2)) AS market_turnover_bn_lkr
FROM almasgold.gold_brokerage_monthly
WHERE month_start >= DATEADD(MONTH, -12, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY month_start
ORDER BY month_start
[desk scope: the brokerage ledger is exposed to the management desk only]`,
    validated:
      'Twelve months returned with no gap in the sequence. Turnover taken with MAX rather than SUM because it is a market-wide figure repeated on every ledger row for the month, and summing it would multiply it by the number of managers.',
    requeried: `SELECT month_start,
       CAST(ROUND(SUM(brokerage_revenue_lkr) / 1000000.0, 1) AS DECIMAL(10,1)) AS brokerage_revenue_mn_lkr,
       CAST(ROUND(MAX(executed_turnover_lkr) / 1000000000.0, 2) AS DECIMAL(10,2)) AS almas_turnover_bn_lkr
FROM almasgold.gold_brokerage_monthly
WHERE month_start >= DATEADD(MONTH, -12, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY month_start
ORDER BY month_start
[definition: turnover switched from market_turnover_lkr, the whole exchange, to executed_turnover_lkr, the turnover Almas itself executed, which is what "tracking against" asks for]`,
    composed:
      'Two lines, one value axis each, drawn in the ink of their own axis so a reader can tell which scale belongs to which line without consulting a legend twice.',
  },
}

/** Which trail entry, if any, belongs under a given step label. */
function detailFor(label: string, trail: Trail): Pick<Step, 'detail' | 'sql'> {
  if (label.startsWith('Planned')) return { detail: trail.planned }
  // Checked before "Queried", since "Re-queried with the correction" contains
  // the shorter word and would otherwise take the first statement.
  if (label.startsWith('Re-queried')) return { sql: trail.requeried }
  if (label.startsWith('Queried')) return { sql: trail.queried }
  if (label.startsWith('Validated')) return { detail: trail.validated }
  if (label.startsWith('Composed')) return { detail: trail.composed }
  // Reviewer challenged / Sent back / Reviewer confirmed carry no detail of
  // their own: what the reviewer changed is stated in the answer's own
  // correction line, and repeating it here would be the same sentence twice.
  return {}
}

/**
 * The steps for a mode, with the asked question's trail hung off them.
 * A question with no trail gets the bare steps, which is how the build feed
 * and any future question behave without special-casing either.
 */
export function withTrail(steps: Step[], questionId?: string): Step[] {
  const trail = questionId ? TRAILS[questionId] : undefined
  if (!trail) return steps
  return steps.map((step) => ({ ...step, ...detailFor(step.label, trail) }))
}
