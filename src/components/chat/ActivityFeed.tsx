'use client'

import { useEffect, useRef, useState } from 'react'
import type { Step } from '@/lib/types'
import styles from './ActivityFeed.module.css'

const TICK_MS = 100

// The two labels that bound the deep-mode review loop. Matched by
// literal text rather than a mode check, so this component stays
// correct for any answer's Deep steps without knowing "deep" exists;
// see Ruling R5 in steps.ts for why the challenge label is generic.
const CHALLENGE_LABEL = 'Reviewer challenged the result'
const CONFIRM_LABEL = 'Reviewer confirmed'

interface Props {
  steps: Step[]
  collapsed: boolean
  onToggleCollapsed: () => void
  onComplete: () => void
}

// The signature (design brief): a live instrument, not four finished
// labels beside a static "1.8 s". Steps land one at a time on their
// own ms from STEPS[mode]; the header timer ticks in mono every 100ms
// and must actually reach totalMs(mode); the deep-mode review loop
// (Reviewer challenged the result -> Sent back -> Re-queried with the
// correction -> Reviewer confirmed) is inset behind a --down hairline
// so the argument against ordinary BI is visible as structure, not
// just four more words in a list. On completion the panel collapses
// to one mono summary line for every turn except the one just asked
// (Ruling R21); collapsing is this same component's own job, since
// nothing here needs to reset when it toggles, only how it renders.
//
// Self-review cut: an earlier version also rendered the plan's
// not-yet-run steps as a row of faint, unlabelled placeholder dots (a
// literal reading of the design brief's third dot state, pending
// --faint). Looking at it, unlabelled dots read as noise competing
// with the one thing meant to hold attention, the steps that are
// actually landing, so only current (--blue, pulsing) and landed
// (--up) ever render; a step simply is not there until it lands.
export default function ActivityFeed({ steps, collapsed, onToggleCollapsed, onComplete }: Props) {
  const total = steps.reduce((sum, step) => sum + step.ms, 0)
  const [revealed, setRevealed] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const firedRef = useRef(false)

  // Steps belong to one turn for this component's entire lifetime (the
  // parent keys ActivityFeed by turn id, so a new turn mounts a fresh
  // instance), so the reveal schedule and the tick are set up exactly
  // once and never depend on props that could change mid-sequence.
  useEffect(() => {
    // Reduced motion still keeps the sequence and the timer counting
    // (design brief); only the pulse and the enter transition drop out,
    // both handled in CSS, so this effect does not branch on it at all.
    // Declared before the reveal timeouts below so their closures can
    // clear it the moment the feed completes (fix, review round 1,
    // Important 1): a resolved turn's feed stays mounted, collapsed,
    // for the rest of the thread's life, so leaving this running only
    // until unmount left a live 100ms interval ticking indefinitely on
    // every answered turn.
    const tick = setInterval(() => {
      setElapsedMs((ms) => Math.min(ms + TICK_MS, total))
    }, TICK_MS)

    const timeouts: ReturnType<typeof setTimeout>[] = []
    let cumulative = 0
    steps.forEach((step, i) => {
      cumulative += step.ms
      timeouts.push(
        setTimeout(() => {
          setRevealed(i + 1)
          if (i === steps.length - 1) {
            setElapsedMs(total)
            clearInterval(tick)
            if (!firedRef.current) {
              firedRef.current = true
              onComplete()
            }
          }
        }, cumulative),
      )
    })

    return () => {
      timeouts.forEach(clearTimeout)
      clearInterval(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const done = revealed >= steps.length
  const challengeIdx = steps.findIndex((s) => s.label === CHALLENGE_LABEL)
  const confirmIdx = steps.findIndex((s) => s.label === CONFIRM_LABEL)
  const hasLoop = challengeIdx !== -1 && confirmIdx > challengeIdx
  const seconds = (elapsedMs / 1000).toFixed(1)

  if (collapsed) {
    return (
      <button type="button" className={styles.summary} onClick={onToggleCollapsed}>
        {steps.length} steps &middot; {seconds} s
      </button>
    )
  }

  const header = (
    <>
      <b className={styles.label}>Agent</b>
      <span className={done ? styles.dot : `${styles.dot} ${styles.pulsing}`} aria-hidden="true" />
      <span className={styles.timer}>{seconds} s</span>
    </>
  )

  return (
    <div className={styles.feed}>
      {done ? (
        <button type="button" className={styles.fh} onClick={onToggleCollapsed}>
          {header}
        </button>
      ) : (
        <div className={styles.fh}>{header}</div>
      )}
      <div className={styles.steps}>
        {steps.slice(0, revealed).map((step, i) => {
          const inset = hasLoop && i > challengeIdx && i < confirmIdx
          const state = done || i < revealed - 1 ? styles.landed : styles.current
          return (
            <span
              key={step.label}
              className={[styles.step, state, inset && styles.inset, styles.enter]
                .filter(Boolean)
                .join(' ')}
            >
              {step.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
