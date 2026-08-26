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
}

const Ctx = createContext<DemoState | null>(null)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [desk, setDesk] = useState<DeskId>(DEFAULT_DESK)
  const [mode, setMode] = useState<Mode>('auto')
  const [view, setView] = useState<View>('chat')
  const [history, setHistory] = useState<string[]>([])

  const value = useMemo<DemoState>(
    () => ({
      desk, setDesk, mode, setMode, view, setView, history,
      pushHistory: (q) => setHistory((h) => (h.includes(q) ? h : [q, ...h])),
    }),
    [desk, mode, view, history],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemo(): DemoState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
