'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  CornerUpLeft,
  Database,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Step } from '@/lib/types'
import { cn } from '@/lib/utils'

const TICK_MS = 100

// The two labels that bound the deep-mode review loop. Matched by
// literal text rather than a mode check, so this component stays
// correct for any answer's Deep steps without knowing "deep" exists;
// see Ruling R5 in steps.ts for why the challenge label is generic.
const CHALLENGE_LABEL = 'Reviewer challenged the result'
const CONFIRM_LABEL = 'Reviewer confirmed'

// Per-step glyph, in the platform's own activity-feed idiom: a small
// tinted rounded square carrying a 12px lucide icon. The real feed keys
// these off agent/tool names; a scripted feed keys them off the step
// label, which is the only identity a step here has.
const STEP_META: ReadonlyArray<{ match: string; icon: LucideIcon; color: string; bg: string }> = [
  { match: 'Planned', icon: ListChecks, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { match: 'Re-queried', icon: RefreshCw, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { match: 'Queried', icon: Database, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { match: 'Validated', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { match: 'Composed', icon: BarChart3, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { match: 'challenged', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { match: 'Sent back', icon: CornerUpLeft, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { match: 'confirmed', icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

function metaFor(label: string) {
  return (
    STEP_META.find((m) => label.includes(m.match)) ?? {
      icon: ListChecks,
      color: 'text-muted-foreground',
      bg: 'bg-foreground/[0.06]',
    }
  )
}

interface Props {
  steps: Step[]
  collapsed: boolean
  onToggleCollapsed: () => void
  onComplete: () => void
}

// The signature: a live instrument, not a finished list beside a static
// "1.8 s". Built on the platform's real agent-feed CSS (agent-timeline,
// agent-step-node, agent-timer, agent-collapsed-pill), so the thing the
// client watches think is the same component shape the product ships.
//
// Steps land one at a time on their own ms from STEPS[mode]; the header
// timer ticks in mono every 100ms and reaches totalMs(mode); and the
// deep-mode review loop (challenged -> sent back -> re-queried ->
// confirmed) is marked with a left rule in the destructive tint so the
// argument against ordinary BI is visible as structure rather than as
// four more words in a list. On completion the panel collapses to one
// pill for every turn except the one just asked (Ruling R21).
export default function ActivityFeed({ steps, collapsed, onToggleCollapsed, onComplete }: Props) {
  const total = steps.reduce((sum, step) => sum + step.ms, 0)
  const [revealed, setRevealed] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const firedRef = useRef(false)

  // Steps belong to one turn for this component's entire lifetime (the
  // parent keys the turn, so a new turn mounts a fresh instance), so
  // the reveal schedule and the tick are set up exactly once and never
  // depend on props that could change mid-sequence.
  useEffect(() => {
    // Reduced motion still keeps the sequence and the timer counting;
    // only the pulse and the enter transition drop out, both in CSS, so
    // this effect does not branch on it at all. The interval is cleared
    // on completion as well as on unmount: a resolved turn's feed stays
    // mounted, collapsed, for the rest of the thread's life.
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
    const last = steps[steps.length - 1]
    return (
      <button type="button" className="agent-collapsed-pill group" onClick={onToggleCollapsed}>
        <div className="agent-step-icon !h-[18px] !w-[18px] bg-emerald-500/10">
          <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
        </div>
        <span className="min-w-0 truncate text-[12px] font-medium leading-tight">{last?.label}</span>
        <span className="shrink-0 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/70">
          {steps.length} steps
        </span>
        <span className="agent-timer shrink-0">
          <Clock className="h-3 w-3 text-muted-foreground/50" strokeWidth={2} />
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">{seconds} s</span>
        </span>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
      </button>
    )
  }

  return (
    <div className="agent-feed surface-1 w-full">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {done ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse activity"
              className="flex items-center text-muted-foreground/60 transition hover:text-foreground"
            >
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <span className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <div className="flex items-center gap-1.5">
            <span className={cn('agent-dot', done && 'agent-dot--done')} aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Agent
            </span>
          </div>
        </div>
        <div className="agent-timer">
          <Clock className="h-3 w-3 text-muted-foreground/40" strokeWidth={2} />
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">{seconds} s</span>
        </div>
      </div>

      <div className="agent-timeline">
        <span className="agent-timeline-line" aria-hidden="true" />
        {steps.slice(0, revealed).map((step, i) => {
          const inset = hasLoop && i > challengeIdx && i < confirmIdx
          const landed = done || i < revealed - 1
          const meta = metaFor(step.label)
          const Icon = meta.icon
          return (
            <div key={step.label} className="agent-step animate-in fade-in slide-in-from-bottom-1 duration-200">
              <span className="agent-step-node" aria-hidden="true">
                {landed ? (
                  <span className="agent-step-node-done">
                    <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="agent-step-node-active" />
                )}
              </span>
              <div
                className={cn(
                  'agent-step-body',
                  !landed && 'agent-step-body--active',
                  inset && 'rounded-l-none border-l-2 border-destructive/30 bg-destructive/[0.03] pl-3',
                )}
              >
                <div className={cn('agent-step-icon', meta.bg)}>
                  <Icon className={cn('h-3 w-3', meta.color)} strokeWidth={2} />
                </div>
                <span className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-foreground/85">
                  {step.label}
                </span>
                <span className="agent-step-duration">{step.ms}ms</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
