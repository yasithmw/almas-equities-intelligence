import { QUESTIONS } from '@/lib/questions'
import type { Question } from '@/lib/answers'

// Free surface: leads with capability, never failure. "Here is what I can
// answer" plus the six as chips, no apology and no error styling, so an
// unrecognised question reads as an invitation rather than a dead end.
// Built on the platform's own fleet-chip control so the chips are the
// same object the product uses for a filter or a suggestion.
export default function NoMatchPanel({
  onPick, disabled,
}: { onPick: (q: Question) => void; disabled?: boolean }) {
  return (
    <div className="max-w-[68ch] rounded-2xl border border-border/60 bg-muted/25 px-4 py-3.5">
      <p className="text-[13px] font-medium text-foreground">Here is what I can answer</p>
      <div className="fleet-chips mt-2.5">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            className="fleet-chip"
            disabled={disabled}
            onClick={() => onPick(q)}
          >
            {q.text}
          </button>
        ))}
      </div>
    </div>
  )
}
