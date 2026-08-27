// Free surface: nothing like this exists in the platform, so it is built
// to read as product chrome that happens to be honest rather than as an
// alert. Muted ground, no icon, no dismiss affordance, and
// non-dismissible by construction: there is no state here to close.
//
// Centred, not left-aligned. A left-aligned strip reads as the first row of
// the page, competing with the sidebar and the thread below it; centred, it
// reads as a label ON the window, which is what it is.
//
// The copy carries two claims and stops.
//
// FIRST, that this is the concept and not the product. That is the load
// bearing half: a client shown a working screen assumes the screen exists,
// and the sentence that prevents it has to come before the one about data.
// Two earlier versions ("Demonstration environment", "Illustrative demo
// only") both said the data was fake and left the reader to infer that the
// platform was not finished, which is the inference nobody makes.
//
// SECOND, that the numbers are placeholders, which also answers "is that
// our book?" without naming Almas. The name was in an earlier draft and is
// gone: "all data is placeholder" already says nothing here is theirs, and
// the words it frees pay for the first claim.
//
// "Concept", not "dashboard": the band sits above a chat thread as well as
// a set of dashboards.
export default function DemoBand() {
  return (
    <div
      role="note"
      className="flex h-8 shrink-0 items-center justify-center gap-2 border-b border-border bg-muted/40 px-6 text-[11px] font-bold tracking-[0.01em] text-muted-foreground"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/45" aria-hidden="true" />
      A preview of the concept, not the complete solution. All data are placeholder.
    </div>
  )
}
