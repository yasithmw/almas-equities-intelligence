// Free surface: nothing like this exists in the platform, so it is built
// to read as product chrome that happens to be honest rather than as an
// alert. Muted ground, no icon, no dismiss affordance, and
// non-dismissible by construction: there is no state here to close.
export default function DemoBand() {
  return (
    <div
      role="note"
      className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-6 text-[11px] font-medium tracking-[0.01em] text-muted-foreground"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/45" aria-hidden="true" />
      Demonstration environment. Illustrative data, not Almas Equities data.
    </div>
  )
}
