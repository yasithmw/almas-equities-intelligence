/**
 * Dependency-free SQL pretty-printer, shared by every surface that DISPLAYS a
 * query: the chat thinking trail, the reasoning graph, the plan-approval card,
 * the widget data panel and the widget SQL editor.
 *
 * It replaces a per-component copy that only broke lines at paren depth 0. That
 * was fine for a flat `SELECT … FROM … WHERE …` and useless for what the agent
 * actually emits: the governed queries are CTE chains, so everything after
 * `WITH den AS (` sat at depth >= 1 and the "formatter" returned one
 * 1,400-character line.
 *
 * ## It may only ever INSERT, or COLLAPSE, WHITESPACE BETWEEN TOKENS
 *
 * That is the contract, and the first cut broke it in two ways cross-review
 * caught. Both came from collapsing the whole string UP FRONT
 * (`sql.replace(/\s+/g, " ")`) before knowing what was a literal:
 *
 *   1. Whitespace INSIDE a string literal or a `[bracket id]` was collapsed too,
 *      so `WHERE name = 'John  Doe'` displayed — and, from the widget SQL
 *      editor, SAVED — as `'John Doe'`. That is a different set of rows.
 *   2. Collapsing newlines destroyed the terminator of a `--` line comment, so
 *      the `indexOf("\n")` that bounds the comment always failed and the comment
 *      swallowed the rest of the statement. `SELECT a -- note` + newline +
 *      `FROM t` became `SELECT a -- note FROM t`, whose FROM clause is commented
 *      out. That text is shown on the plan-approval card as the query about to
 *      run, and is persisted if saved from the editor.
 *
 * So whitespace is now collapsed AS THE SCAN GOES, and only outside literals,
 * bracket identifiers and comments — where it means nothing. Inside them every
 * byte is copied verbatim, and a comment is always ended by a newline.
 *
 * ## The layout rule
 *
 * What makes CTE chains work without mangling ordinary expressions is a
 * LOOKAHEAD on the open paren: a paren is *breakable* only when the next word
 * inside it is `SELECT` or `WITH`. So
 *
 *   `WITH den AS (SELECT …)`            → breaks and indents (a subquery)
 *   `COALESCE(c.resolved_date, c.sub…)` → left alone (function arguments)
 *   `OVER (PARTITION BY … ORDER BY …)`  → left alone (a window spec, whose
 *                                          ORDER BY is not a clause break)
 *   `IN (1, 2, 3)`                      → left alone (a value list)
 *   `IN (SELECT …)`                     → breaks (a subquery)
 *
 * Anything nested inside a non-breakable paren stays non-breakable, so a
 * subquery buried in a function argument is left intact rather than exploded
 * across the middle of an expression.
 */

/**
 * A trailing note the backend appends to a DISPLAYED statement, on its own line
 * and in square brackets — today that is `_display_sql`'s
 * `[row bound: 200 max; …]`, which explains a safety cap it removed from the
 * text above. It is prose, not SQL, and must not be reflowed into the query.
 */
const TRAILING_NOTE = /\n(\[[^\]\n]*\])\s*$/;

/** Clause keywords that start a new line. Longest-first so "ORDER BY" is
 *  matched before "ORDER" and "UNION ALL" before "UNION". */
const SQL_CLAUSE_KEYWORDS = [
  "WITH",
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  // NOT "LIMIT" / "OFFSET". Neither is a top-level clause in the T-SQL these
  // queries are written in (it is TOP, and OFFSET only ever appears inside an
  // ORDER BY ... FETCH tail), and both are perfectly ordinary COLUMN names. With
  // them in the list, `SELECT patient, limit FROM t` rendered as
  // `SELECT patient,` / `LIMIT` / `FROM t` — and the widget editor persists what
  // it is seeded with, so the next run failed `Invalid column name 'LIMIT'`
  // (cross-review r3, opus-5). A dialect that needs them can add them back
  // behind a dialect flag; guessing costs a broken saved query.
  "UNION ALL",
  "UNION",
  "INTERSECT",
  "EXCEPT ALL",
  "EXCEPT",
  "LEFT OUTER JOIN",
  "LEFT JOIN",
  "RIGHT OUTER JOIN",
  "RIGHT JOIN",
  "FULL OUTER JOIN",
  "FULL JOIN",
  "INNER JOIN",
  "CROSS JOIN",
  "CROSS APPLY",
  "OUTER APPLY",
  "JOIN",
  "ON",
].sort((a, b) => b.length - a.length);

/** Words that make an open paren a SUBQUERY rather than an expression. */
const SUBQUERY_OPENERS = new Set(["SELECT", "WITH"]);

function isSpace(ch: string | undefined): boolean {
  return (
    ch === " " || ch === "\t" || ch === "\n" ||
    ch === "\r" || ch === "\f" || ch === "\v"
  );
}

/** A `language` of undefined means "unlabelled" — the agent's queries are SQL,
 *  so treat that as SQL rather than refusing to format the common case. */
export function isSqlLike(language?: string): boolean {
  if (!language) return true;
  return language.toLowerCase() === "sql";
}

/** The first word at or after `from`, upper-cased. "" when none remains. */
function wordAt(src: string, from: number): string {
  let i = from;
  while (i < src.length && isSpace(src[i])) i++;
  let j = i;
  while (j < src.length && /[A-Za-z_]/.test(src[j])) j++;
  return src.slice(i, j).toUpperCase();
}

/**
 * Does clause keyword `kw` start at `at`? Returns the index just past it, or -1.
 *
 * Whitespace-flexible BETWEEN the words of a multi-word keyword, because the
 * source is no longer pre-normalised: `GROUP` + newline + `BY` and `GROUP BY`
 * are the same clause, and a slice comparison against the single-spaced constant
 * would miss the first and leave it unformatted.
 */
function matchKeyword(src: string, at: number, kw: string): number {
  const words = kw.split(" ");
  let i = at;
  for (let w = 0; w < words.length; w++) {
    if (w > 0) {
      let j = i;
      while (j < src.length && isSpace(src[j])) j++;
      if (j === i) return -1; // the words must actually be separated
      i = j;
    }
    const word = words[w];
    if (src.slice(i, i + word.length).toUpperCase() !== word) return -1;
    i += word.length;
  }
  const next = src[i];
  // "ONLY", "SELECTED", "FROMAGE" — a keyword has to end at a word break.
  if (next !== undefined && /[A-Za-z0-9_]/.test(next)) return -1;
  return i;
}

/**
 * `formatSql` for a statement that may carry a trailing display note.
 *
 * Use this on anything sourced from the backend's `generated_query`; use
 * `formatSql` directly only when the text is known to be nothing but SQL.
 */
export function formatSqlBlock(text: string): string {
  const note = TRAILING_NOTE.exec(text);
  if (!note) return formatSql(text);
  return formatSql(text.slice(0, note.index)) + "\n" + note[1];
}

export function formatSql(sql: string): string {
  const src = sql.trim();
  if (!src) return sql;

  let out = "";
  let inStr: string | null = null;
  // Depth inside non-breakable parens. While > 0 NOTHING breaks: a window
  // spec's ORDER BY and a function argument's comma are part of an expression.
  let suppressed = 0;
  // One entry per open paren: true when it opened a subquery.
  const parens: boolean[] = [];
  let indent = 0;
  // Between a top-level WITH and the top-level SELECT the commas separate CTE
  // definitions, and each of those deserves its own line. Elsewhere a comma is
  // a column/argument separator and breaking on it only makes the block tall.
  let inWithList = false;
  let i = 0;

  // Idempotent: the open-paren break and the subquery SELECT that follows it
  // both call this, and the second call has to tighten the indent rather than
  // leave a blank line between the two.
  const newline = () => {
    while (out.endsWith(" ")) out = out.slice(0, -1);
    if (!out) return;
    if (!out.endsWith("\n")) out += "\n";
    out += "  ".repeat(Math.max(0, indent));
  };
  /** True when a separator space would be leading rather than separating. */
  const atLineStart = () => out === "" || out.endsWith("\n") || out.endsWith(" ");

  while (i < src.length) {
    const ch = src[i];

    if (inStr) {
      out += ch;
      if (ch === inStr) {
        // A DOUBLED quote is the escape, and the only one. T-SQL has no
        // backslash escape, so the previous `src[i - 1] !== "\\"` test made a
        // literal ENDING in a backslash — a Windows path, `'C:\reports\'` —
        // fail to close, and everything after it was scanned as a string.
        if (src[i + 1] === inStr) {
          out += src[i + 1];
          i++;
        } else {
          inStr = null;
        }
      }
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      out += ch;
      i++;
      continue;
    }
    // A bracket-quoted identifier is opaque: `[Patient ID (CONT-)]` carries a
    // paren and spaces that mean nothing to the layout, and touching either
    // would rename a column.
    //
    // `]]` is T-SQL's escape for a `]` INSIDE such an identifier, so a single
    // `indexOf("]")` ended `[a]] FROM x]` at `[a]` and parsed the rest of the
    // column NAME as code — inserting a newline before its `FROM`. Whitespace
    // inside an identifier is significant, so that is a value change.
    if (ch === "[") {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] !== "]") {
          j++;
          continue;
        }
        if (src[j + 1] === "]") {
          j += 2; // an escaped ], still inside the identifier
          continue;
        }
        j += 1; // the real close
        break;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    // A BLOCK comment, copied verbatim.
    //
    // There was no case for these at all, and their bytes fell through to the
    // default path — so an apostrophe inside one (`/* patient's note */`)
    // OPENED a string literal that ran to the next quote in the statement,
    // which is the opening quote of a real literal. That literal's contents
    // were then scanned as code: its keywords uppercased and newline-broken,
    // its whitespace collapsed. `WHERE reason = 'order by date'` came out with
    // `ORDER BY` and a line break INSIDE the value, so the widget filtered on a
    // different string — and the editor persists what it is seeded with.
    //
    // Depth-counted because T-SQL block comments NEST; stopping at the first
    // `*/` would leave the tail of an outer comment being read as code.
    if (ch === "/" && src[i + 1] === "*") {
      let j = i + 2;
      let depth = 1;
      while (j < src.length && depth > 0) {
        if (src[j] === "/" && src[j + 1] === "*") {
          depth++;
          j += 2;
        } else if (src[j] === "*" && src[j + 1] === "/") {
          depth--;
          j += 2;
        } else {
          j++;
        }
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    // Line comment, copied verbatim to the REAL end of its line — which still
    // exists, because whitespace is no longer collapsed ahead of the scan.
    if (ch === "-" && src[i + 1] === "-") {
      let end = i;
      while (end < src.length && src[end] !== "\n") end++;
      out += src.slice(i, end);
      i = end;
      // A comment MUST end its line. Without this the clause after it would be
      // pulled onto the comment line by the collapse below and commented out.
      newline();
      continue;
    }
    // Whitespace BETWEEN tokens — the only whitespace this function may touch.
    // The whole run becomes one space, and never a leading one.
    if (isSpace(ch)) {
      let j = i;
      while (j < src.length && isSpace(src[j])) j++;
      if (!atLineStart()) out += " ";
      i = j;
      continue;
    }

    if (ch === "(") {
      const breakable = suppressed === 0 && SUBQUERY_OPENERS.has(wordAt(src, i + 1));
      parens.push(breakable);
      out += ch;
      i++;
      if (breakable) {
        indent++;
        newline();
      } else {
        suppressed++;
      }
      continue;
    }
    if (ch === ")") {
      const breakable = parens.pop() ?? false;
      if (breakable) {
        indent = Math.max(0, indent - 1);
        newline();
      } else if (suppressed > 0) {
        suppressed--;
      }
      out += ch;
      i++;
      continue;
    }

    // One CTE definition per line.
    if (ch === "," && suppressed === 0 && indent === 0 && inWithList) {
      while (out.endsWith(" ")) out = out.slice(0, -1);
      out += ",";
      newline();
      i++;
      continue;
    }

    if (suppressed === 0 && (out === "" || /[\s(]$/.test(out))) {
      let matched: string | null = null;
      let after = -1;
      for (const kw of SQL_CLAUSE_KEYWORDS) {
        const end = matchKeyword(src, i, kw);
        if (end !== -1) {
          matched = kw;
          after = end;
          break;
        }
      }
      if (matched) {
        newline();
        // ON reads as a continuation of the JOIN above it, not a peer clause.
        if (matched === "ON") out += "  ";
        // The SOURCE spelling for a single-word keyword, the canonical one for a
        // multi-word keyword.
        //
        // Rewriting the case was the ONLY way this function could change a
        // non-whitespace byte, and it bought nothing for a single word: `from`
        // and `FROM` mean the same thing to SQL, and preserving what the author
        // wrote means a misidentified keyword can no longer be visibly rewritten.
        // A multi-word keyword still normalises, because collapsing
        // `GROUP` + newline + `BY` to one space IS the point there.
        out += matched.includes(" ") ? matched : src.slice(i, after);
        if (indent === 0) {
          if (matched === "WITH") inWithList = true;
          else if (matched === "SELECT") inWithList = false;
        }
        i = after;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}
