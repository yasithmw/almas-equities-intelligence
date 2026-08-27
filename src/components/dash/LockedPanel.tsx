import { Lock } from 'lucide-react'

// Free surface: not a grey wall. Whatever holds this keeps its title and
// full fidelity; only the body becomes a quiet plate with a lock glyph
// and one line, which turns a restriction into a prompt toward the desk
// switcher. The line names whichever desk actually can view it,
// computed by the caller from the same access matrix the lock comes
// from, so it stays true if that matrix ever changes.
export default function LockedPanel({ allowedDeskLabel }: { allowedDeskLabel: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.9} />
      </span>
      <span className="text-[12.5px] leading-relaxed text-muted-foreground">
        {allowedDeskLabel} can view this. Switch desk to view it.
      </span>
    </div>
  )
}
