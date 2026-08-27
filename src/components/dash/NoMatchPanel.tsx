import type { DashboardSpec } from '@/lib/dashboards'

// Mirrors chat's own NoMatchPanel: lead with capability, never failure.
// "Here is what I can build" plus the specs as chips, no apology and no
// error styling, so a request this scripted demo cannot build reads as
// an invitation rather than a dead end, and never as a wrong dashboard
// under a right-sounding title.
export default function NoMatchPanel({
  specs, onPick, disabled,
}: { specs: DashboardSpec[]; onPick: (spec: DashboardSpec) => void; disabled?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3.5">
      <p className="text-[13px] font-medium text-foreground">Here is what I can build</p>
      <div className="fleet-chips mt-2.5">
        {specs.map((s) => (
          <button
            key={s.id}
            type="button"
            className="fleet-chip"
            disabled={disabled}
            onClick={() => onPick(s)}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  )
}
