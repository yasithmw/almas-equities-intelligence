import type { Resolved } from '@/lib/answers'
import type { Step } from '@/lib/types'
import VizBlock from '../dash/VizBlock'
import ActivityFeed from './ActivityFeed'
import styles from './AnswerBlock.module.css'

interface Props {
  steps: Step[]
  collapsed: boolean
  onToggleCollapsed: () => void
  onFeedComplete: () => void
  resolved: Resolved | null
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor"
      strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.4" y="7.2" width="9.2" height="6.4" rx="1.4" />
      <path d="M5.4 7.2V5.4a2.6 2.6 0 0 1 5.2 0v1.8" />
    </svg>
  )
}

// Ports the client brief's .ans / .ava / .c (grep-verified) as one
// component, since the document nests the feed, the badges, the answer
// text and the chart card together inside a single avatar-led column,
// and that shape does not belong split across two files. Handles every
// shape resolveAnswer can hand back: still running (resolved === null,
// only the feed shows), answered, redacted, or denied.
export default function AnswerBlock({
  steps, collapsed, onToggleCollapsed, onFeedComplete, resolved,
}: Props) {
  return (
    <div className={styles.ans}>
      <div className={styles.ava} aria-hidden="true">A</div>
      <div className={styles.c}>
        <ActivityFeed
          steps={steps}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          onComplete={onFeedComplete}
        />

        {resolved && (resolved.state === 'answered' || resolved.state === 'redacted') && (
          <>
            <div className={styles.badges}>
              <span className={`${styles.pill} ${styles.ok}`}>
                <span aria-hidden="true">&#10003;</span> Checked
              </span>
              <span className={`${styles.pill} ${styles.sc}`}>Your access only</span>
            </div>
            <div className={styles.atext}>{resolved.variant.text}</div>
            {resolved.state === 'answered' && resolved.correction && (
              <div className={styles.correction}>{resolved.correction}</div>
            )}
            {resolved.state === 'redacted' && (
              <div className={styles.redactedTag}>Redacted</div>
            )}
            {resolved.variant.viz && <VizBlock viz={resolved.variant.viz} />}
          </>
        )}

        {resolved && resolved.state === 'denied' && (
          <div className={styles.denied}>
            <LockIcon />
            <span>{resolved.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
