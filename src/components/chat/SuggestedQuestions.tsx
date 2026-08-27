import {
  ArrowLeftRight,
  BarChart3,
  Percent,
  PieChart,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Question } from '@/lib/answers'

// Short label plus the question itself, matching the platform's starter
// tiles, which carry a scannable name over a one-line prompt. A tile
// that is only a full sentence reads as a paragraph; the label is what
// lets a client's eye pick the one they want.
const META: Record<string, { icon: LucideIcon; label: string }> = {
  q01: { icon: Percent, label: 'Bank dividend yields' },
  q02: { icon: BarChart3, label: 'COMB against HNB' },
  q03: { icon: ArrowLeftRight, label: 'Foreign flows this week' },
  q04: { icon: Users, label: 'Client gain since purchase' },
  q05: { icon: TrendingUp, label: 'What is driving the ASPI' },
  q06: { icon: PieChart, label: 'Revenue against turnover' },
}

interface Props {
  questions: Question[]
  variant: 'grid' | 'row'
  onPick: (q: Question) => void
  disabled?: boolean
}

// Free surface. The grid is the platform's own empty-state tile: a
// bordered card on a muted ground with a tinted icon square, whose
// border and icon shift to the accent on hover. The row is the same
// list once the thread is running, rendered as fleet chips above the
// composer, filtered by the caller to questions not yet asked.
export default function SuggestedQuestions({ questions, variant, onPick, disabled }: Props) {
  if (questions.length === 0) return null

  if (variant === 'row') {
    return (
      <div className="fleet-chips mb-2.5">
        {questions.map((q) => (
          <button
            key={q.id}
            type="button"
            data-testid="suggested"
            className="fleet-chip"
            aria-label={q.text}
            disabled={disabled}
            onClick={() => onPick(q)}
          >
            {META[q.id]?.label ?? q.text}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {questions.map((q) => {
        const meta = META[q.id]
        const Icon = meta?.icon ?? BarChart3
        return (
          <button
            key={q.id}
            type="button"
            data-testid="suggested"
            disabled={disabled}
            onClick={() => onPick(q)}
            // An explicit aria-label naming only the question: the tile
            // shows a short label above the question, and without this
            // the accessible name would run the two together.
            aria-label={q.text}
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.06] disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] transition-colors group-hover:bg-primary/10">
              <Icon
                className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                strokeWidth={1.8}
              />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">
                {meta?.label ?? q.text}
              </span>
              <span className="line-clamp-1 text-[11px] text-muted-foreground/60">{q.text}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
