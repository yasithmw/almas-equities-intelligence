'use client'

import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ModePills from './ModePills'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
}

// Ported from the platform's PromptInputBox: a rounded-3xl card floating
// on a soft drop shadow, an autosizing transparent textarea, and the
// depth control sitting on the same footer row as a circular accent send
// button. Enter sends, Shift+Enter breaks the line, exactly as it does
// in the product.
export default function Composer({ value, onChange, onSend, disabled }: Props) {
  const hasContent = value.trim().length > 0

  function submit() {
    if (disabled || !hasContent) return
    onSend()
  }

  return (
    <div>
      <div
        className={cn(
          'prompt-box rounded-3xl border border-border/60 bg-card/80 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300',
          // The platform's prompt box leaves its textarea with no focus
          // treatment at all. A keyboard user tabbing into the demo's
          // primary control has to see where they landed, so the whole box
          // takes the ring when anything inside it holds focus.
          'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/25',
          disabled && 'opacity-80',
        )}
      >
        <label htmlFor="composer" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="composer"
          rows={1}
          aria-label="Ask a question"
          placeholder="Ask about any stock, sector, client or index…"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          className="max-h-40 min-h-[30px] w-full resize-none bg-transparent px-3 pt-2 pb-1 text-[15px] leading-relaxed text-foreground outline-hidden placeholder:text-muted-foreground/50"
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <ModePills />
          <Button
            type="button"
            variant="default"
            size="icon"
            aria-label="Ask"
            disabled={disabled || !hasContent}
            onClick={submit}
            className={cn(
              'h-8 w-8 rounded-full border-transparent transition-all duration-200',
              hasContent ? 'hover:brightness-95' : 'bg-transparent text-muted-foreground/50',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="px-2 pt-1.5 text-[10px] text-muted-foreground/40">
        <kbd className="chat-kbd">Enter</kbd> send
        <span className="mx-1.5 opacity-40">|</span>
        <kbd className="chat-kbd">Shift+Enter</kbd> new line
      </p>
    </div>
  )
}
