import styles from './LockedPanel.module.css'

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.4" y="7.2" width="9.2" height="6.4" rx="1.4" />
      <path d="M5.4 7.2V5.4a2.6 2.6 0 0 1 5.2 0v1.8" />
    </svg>
  )
}

// Free surface (design brief, "Locked panel"): "Not a grey wall. The
// card keeps its title and full fidelity; only the body is replaced by
// a quiet --aqua-tint plate with a small lock glyph and one line ...
// That turns a restriction into a prompt toward the desk switcher."
// The one line names whichever desk actually can view it (computed by
// the caller, never hardcoded to "Management"), so this stays correct
// even if the access matrix ever changes which desk that is.
export default function LockedPanel({ allowedDeskLabel }: { allowedDeskLabel: string }) {
  return (
    <div className={styles.plate}>
      <LockIcon />
      <span>{allowedDeskLabel} can view this. Switch desk to view it.</span>
    </div>
  )
}
