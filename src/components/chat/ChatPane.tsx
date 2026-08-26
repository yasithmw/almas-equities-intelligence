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
import styles from './ChatPane.module.css'

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

  return (
    <div className={styles.pane}>
      <div className={showEmptyGrid ? `${styles.thread} ${styles.threadEmpty}` : styles.thread}>
        {showEmptyGrid && (
          <SuggestedQuestions
            questions={QUESTIONS}
            variant="grid"
            onPick={askSuggested}
            disabled={busy}
          />
        )}
        {thread.map((turn) => {
          const collapsed = turn.kind === 'matched' && Boolean(turn.resolved) && (
            turn.expandedOverride === undefined
              ? turn.turnId !== lastMatchedId
              : !turn.expandedOverride
          )
          return (
            <Fragment key={turn.turnId}>
              <div className={styles.qbub}>{turn.text}</div>
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
      <div className={styles.bottom}>
        {showSlimRow && (
          <SuggestedQuestions
            questions={remaining}
            variant="row"
            onPick={askSuggested}
            disabled={busy}
          />
        )}
        <Composer value={value} onChange={setValue} onSend={askTyped} disabled={busy} />
      </div>
    </div>
  )
}
