'use client'

import { Brain, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import type { Mode } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDemo } from '../shell/DemoContext'

// Ported from the platform's ResponseModeToggle, which already carries
// exactly these three depths with these icons and these hints. Reading
// mode/setMode from DemoContext replaces its zustand store; nothing else
// changes, so the control the client clicks here is the control they
// have in the product.
const MODES: ReadonlyArray<{ id: Mode; label: string; icon: LucideIcon; hint: string }> = [
  { id: 'quick', label: 'Quick', icon: Zap, hint: 'Quick answer, fastest path, orchestrator only' },
  { id: 'auto', label: 'Auto', icon: Sparkles, hint: 'Auto, escalates to specialist agents when needed' },
  { id: 'deep', label: 'Deep', icon: Brain, hint: 'Think deeply, always consults specialist agents' },
]

export default function ModePills({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useDemo()

  return (
    <div
      className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5"
      role="radiogroup"
      aria-label="Answer depth"
    >
      {MODES.map(({ id, label, icon: Icon, hint }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={mode === id}
          onClick={() => setMode(id)}
          title={hint}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md text-[11px] font-medium transition-all duration-200',
            compact ? 'px-2 py-1' : 'px-2.5 py-1',
            mode === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
