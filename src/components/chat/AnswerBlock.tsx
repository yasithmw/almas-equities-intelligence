import { AlertTriangle, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Resolved } from '@/lib/answers'
import type { Step } from '@/lib/types'
import VizBlock from '../dash/VizBlock'
import ActivityFeed from './ActivityFeed'

interface Props {
  steps: Step[]
  collapsed: boolean
  onToggleCollapsed: () => void
  onFeedComplete: () => void
  resolved: Resolved | null
}

// The assistant side of a turn, in the platform's message-list shape:
// the activity feed, then the answer on a surface-1 glass bubble with
// the top-left corner tightened (rounded-2xl rounded-tl-lg), then the
// figure. No avatar letter: the real list identifies the assistant by
// the feed above the answer, not by a monogram beside it.
//
// Every block here runs the full width of the thread column, so the
// reasoning, the answer and the figure all line up with the composer
// below them. Two things still hug their own content, because stretching
// them would be wrong rather than merely wide: the collapsed feed pill and
// the badge row.
//
// Handles every shape resolveAnswer can hand back: still running
// (resolved === null, only the feed shows), answered, redacted, denied.
export default function AnswerBlock({
  steps, collapsed, onToggleCollapsed, onFeedComplete, resolved,
}: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-2.5">
      <ActivityFeed
        steps={steps}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        onComplete={onFeedComplete}
      />

      {resolved && (resolved.state === 'answered' || resolved.state === 'redacted') && (
        <div className="flex w-full flex-col items-start gap-2.5">
          {/* The Checked and "Your access only" badges are gone: they said
              the same thing on every single answer, which is the definition
              of a badge that carries no information. Redacted stays,
              because it appears only when names actually are withheld and
              it is the one thing in the turn that says so. */}
          {resolved.state === 'redacted' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">Redacted</Badge>
            </div>
          )}

          <div className="surface-1 w-full rounded-2xl rounded-tl-lg px-4 py-3 text-sm leading-relaxed text-foreground">
            {resolved.variant.text}
          </div>

          {resolved.state === 'answered' && resolved.correction && (
            <div className="fleet-alert fleet-alert-warning w-full">
              <AlertTriangle className="fleet-alert-icon h-4 w-4" strokeWidth={2} />
              <div>
                <div className="fleet-alert-title">The reviewer changed this</div>
                <div className="fleet-alert-desc">{resolved.correction}</div>
              </div>
            </div>
          )}

          {resolved.variant.viz && (
            <div className="w-full">
              <VizBlock viz={resolved.variant.viz} controls />
            </div>
          )}
        </div>
      )}

      {resolved && resolved.state === 'denied' && (
        <div className="fleet-alert fleet-alert-info w-full">
          <Lock className="fleet-alert-icon h-4 w-4" strokeWidth={2} />
          <div className="fleet-alert-desc">{resolved.message}</div>
        </div>
      )}
    </div>
  )
}
