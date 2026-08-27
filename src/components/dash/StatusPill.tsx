import styles from './StatusPill.module.css'

type Tone = 'ok' | 'ac'

const TONE_CLASS: Record<Tone, string> = {
  ok: styles.ok,
  ac: styles.ac,
}

// Ports the client brief's .st / .st-ok / .st-ac (grep-verified: Exhibit
// C's own .dhead carries exactly this pill, <span class="st st-ok">Pre-
// built</span>). A dashboard built through "describe a new dashboard"
// gets .st-ac instead (navy-tinted, the document's own "active" tone)
// so it reads as a live, just-built thing rather than a second
// "Pre-built" claim that would not be true.
export default function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`${styles.st} ${TONE_CLASS[tone]}`}>{children}</span>
}
