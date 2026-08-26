'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { DEFAULT_DESK } from '@/lib/desks'
import type { DeskId, Mode } from '@/lib/types'

export type View = 'chat' | 'dashboards'

interface DemoState {
  desk: DeskId
  setDesk: (d: DeskId) => void
  mode: Mode
  setMode: (m: Mode) => void
  view: View
  setView: (v: View) => void
  history: string[]
  pushHistory: (q: string) => void
  // Ruling R20: "New chat" has to actually start a new chat, not just
  // switch the view to one that may already be showing a thread.
  // ChatPane cannot be keyed by its parent (DemoShell is Task 6's file,
  // out of scope here), so it watches chatKey itself and clears its own
  // thread when it changes.
  chatKey: number
  newChat: () => void
}

const Ctx = createContext<DemoState | null>(null)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [desk, setDesk] = useState<DeskId>(DEFAULT_DESK)
  const [mode, setMode] = useState<Mode>('auto')
  const [view, setView] = useState<View>('chat')
  const [history, setHistory] = useState<string[]>([])
  const [chatKey, setChatKey] = useState(0)

  const value = useMemo<DemoState>(
    () => ({
      desk, setDesk, mode, setMode, view, setView, history, chatKey,
      pushHistory: (q) => setHistory((h) => (h.includes(q) ? h : [q, ...h])),
      newChat: () => {
        setChatKey((k) => k + 1)
        setView('chat')
      },
    }),
    [desk, mode, view, history, chatKey],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemo(): DemoState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
