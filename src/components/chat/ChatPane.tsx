'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS } from '@/lib/questions'
import { matchQuestion } from '@/lib/match'
import { resolveAnswer, type Question, type Resolved } from '@/lib/answers'
import { STEPS } from '@/lib/steps'
import type { DeskId, Mode, Step } from '@/lib/types'
import { useTypewriter } from '@/lib/useTypewriter'
import { useDemo } from '../shell/DemoContext'
import SuggestedQuestions from './SuggestedQuestions'
import Composer from './Composer'
import AnswerBlock from './AnswerBlock'
import NoMatchPanel from './NoMatchPanel'

// A deliberate beat between "finished typing" and "actually sending",
// for a suggested question: the typewriter fills the composer, holds
// for a moment so the fully typed question is visible (matching how a
// person pauses before hitting enter), then the turn commits.
const SEND_PAUSE_MS = 300

interface MatchedTurn {
  kind: 'matched'
  turnId: number
  text: string
  mode: Mode
  desk: DeskId
  questionId: string
  steps: Step[]
  resolved: Resolved | null
  // Explicit user override of the feed's collapse state (Ruling R21).
  // Undefined means "use the default", which is expanded only for the
  // most recently asked matched turn.
  expandedOverride?: boolean
}
interface NoMatchTurn {
  kind: 'nomatch'
  turnId: number
  text: string
}
type Turn = MatchedTurn | NoMatchTurn

// The real chat surface (Task 7), replacing Task 6's placeholder in
// place. Holds the whole thread; DemoContext only carries desk, mode,
// the rail history and (Ruling R20) chatKey, none of which is thread
// state itself.
export default function ChatPane() {
  const { desk, mode, pushHistory, chatKey } = useDemo()
  const [thread, setThread] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const { value, setValue, type } = useTypewriter()
  const nextId = useRef(0)
  const pendingSend = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ruling R20: "New chat" bumps chatKey. ChatPane cannot be keyed by
  // its parent (DemoShell is out of scope for this task), so it watches
  // chatKey itself and clears its own thread, including a turn that is
  // still mid-flight: any pending "pause before send" is cancelled, and
  // the typewriter's own interval is stopped by handing it an empty
  // string, the only way to reach it through its public API.
  useEffect(() => {
    if (pendingSend.current) {
      clearTimeout(pendingSend.current)
      pendingSend.current = null
    }
    type('', () => {})
    setValue('')
    setThread([])
    setBusy(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatKey])

  const askedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of thread) if (t.kind === 'matched') ids.add(t.questionId)
    return ids
  }, [thread])
  const remaining = QUESTIONS.filter((q) => !askedIds.has(q.id))

  const lastMatchedId = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i -= 1) {
      const t = thread[i]
      if (t.kind === 'matched') return t.turnId
    }
    return null
  }, [thread])

  function commitMatched(text: string, question: Question) {
    const turnId = nextId.current
    nextId.current += 1
    const turn: MatchedTurn = {
      kind: 'matched',
      turnId,
      text,
      mode,
      desk,
      questionId: question.id,
      steps: STEPS[mode],
      resolved: null,
    }
    setThread((t) => [...t, turn])
    setBusy(true)
  }

  // Suggested-question flow (empty-state grid, the slim row once the
  // thread is non-empty, and the no-match panel's own chips): type the
  // question into the composer, pause, then send. Ruling R3 depends on
  // these staying real <button>s, never rendered again as a button
  // once asked (the row/grid filters to questions not yet asked).
  function askSuggested(question: Question) {
    if (busy) return
    setBusy(true)
    type(question.text, () => {
      pendingSend.current = setTimeout(() => {
        pendingSend.current = null
        setValue('')
        commitMatched(question.text, question)
      }, SEND_PAUSE_MS)
    })
  }

  // Direct-typed flow (Composer's Enter or send button): the text is
  // already fully present, typed by a real person, so it sends at
  // once, with no typewriter pause.
  function askTyped() {
    if (busy) return
    const raw = value.trim()
    if (!raw) return
    setValue('')
    const matched = matchQuestion(raw)
    if (!matched) {
      const turnId = nextId.current
      nextId.current += 1
      setThread((t) => [...t, { kind: 'nomatch', turnId, text: raw }])
      return
    }
    commitMatched(raw, matched)
  }

  function handleFeedComplete(turnId: number) {
    let askedText: string | null = null
    setThread((t) => t.map((turn) => {
      if (turn.kind !== 'matched' || turn.turnId !== turnId || turn.resolved) return turn
      askedText = turn.text
      return { ...turn, resolved: resolveAnswer(turn.questionId, turn.desk, turn.mode) }
    }))
    if (askedText) pushHistory(askedText)
    setBusy(false)
  }

  function toggleExpand(turnId: number) {
    setThread((t) => t.map((turn) => {
      if (turn.kind !== 'matched' || turn.turnId !== turnId) return turn
      const currentlyExpanded = turn.expandedOverride ?? (turn.turnId === lastMatchedId)
      return { ...turn, expandedOverride: !currentlyExpanded }
    }))
  }

  const lastTurn = thread[thread.length - 1] as Turn | undefined
  const showEmptyGrid = thread.length === 0
  // The slim row above the composer would just repeat the no-match
  // panel's own six chips when nothing has been asked successfully
  // yet, so it steps aside for that one turn rather than doubling up.
  const showSlimRow = thread.length > 0 && lastTurn?.kind !== 'nomatch'

  // The platform's message list keeps the newest turn in view; without
  // it a Deep answer lands below the fold and the client watches an
  // empty pane while the interesting part happens off screen.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread])

  const composer = (
    <Composer value={value} onChange={setValue} onSend={askTyped} disabled={busy} />
  )

  // Empty state, ported from the platform's own: a centred column with
  // the composer IN the middle of the pane rather than pinned to the
  // bottom of an empty one, the starter tiles under it, and the heading
  // above. The composer moves down to the footer the moment there is a
  // thread to sit under.
  if (showEmptyGrid) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-auto">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 duration-300 animate-in fade-in">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold tracking-[-0.01em] text-foreground">
              Ask anything.{' '}
              <span className="font-semibold italic text-foreground/85">See everything.</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about the market, your client book or the firm&apos;s own books. The agent
              queries it, checks the answer, then draws it.
            </p>
          </div>

          <div className="flex w-full max-w-3xl flex-col gap-4">
            {composer}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/50">
                Try asking
              </p>
              <SuggestedQuestions
                questions={QUESTIONS}
                variant="grid"
                onPick={askSuggested}
                disabled={busy}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-6">
          {thread.map((turn) => {
            const collapsed = turn.kind === 'matched' && Boolean(turn.resolved) && (
              turn.expandedOverride === undefined
                ? turn.turnId !== lastMatchedId
                : !turn.expandedOverride
            )
            return (
              <Fragment key={turn.turnId}>
                <div
                  className="max-w-[min(100%,32rem)] self-end rounded-2xl rounded-tr-lg bg-user-bubble px-4 py-3 text-sm leading-relaxed shadow-surface-sm [font-weight:380] [letter-spacing:-0.005em]"
                  style={{ color: 'hsl(var(--user-bubble-foreground))' }}
                >
                  {turn.text}
                </div>
                {turn.kind === 'nomatch' ? (
                  <NoMatchPanel onPick={askSuggested} disabled={busy} />
                ) : (
                  <AnswerBlock
                    steps={turn.steps}
                    collapsed={collapsed}
                    onToggleCollapsed={() => toggleExpand(turn.turnId)}
                    onFeedComplete={() => handleFeedComplete(turn.turnId)}
                    resolved={turn.resolved}
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-4xl px-6 pt-3 pb-3">
          {showSlimRow && (
            <SuggestedQuestions
              questions={remaining}
              variant="row"
              onPick={askSuggested}
              disabled={busy}
            />
          )}
          {composer}
        </div>
      </div>
    </div>
  )
}
