import { AlertTriangle, Check, Lock } from 'lucide-react'
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
// Handles every shape resolveAnswer can hand back: still running
// (resolved === null, only the feed shows), answered, redacted, denied.
export default function AnswerBlock({
  steps, collapsed, onToggleCollapsed, onFeedComplete, resolved,
}: Props) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <ActivityFeed
        steps={steps}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
        onComplete={onFeedComplete}
      />

      {resolved && (resolved.state === 'answered' || resolved.state === 'redacted') && (
        <div className="flex w-full flex-col items-start gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success">
              <Check className="h-3 w-3" strokeWidth={3} />
              Checked
            </Badge>
            <Badge variant="secondary">Your access only</Badge>
            {resolved.state === 'redacted' && <Badge variant="outline">Redacted</Badge>}
          </div>

          <div className="surface-1 max-w-[68ch] rounded-2xl rounded-tl-lg px-4 py-3 text-sm leading-relaxed text-foreground">
            {resolved.variant.text}
          </div>

          {resolved.state === 'answered' && resolved.correction && (
            <div className="fleet-alert fleet-alert-warning max-w-[68ch]">
              <AlertTriangle className="fleet-alert-icon h-4 w-4" strokeWidth={2} />
              <div>
                <div className="fleet-alert-title">The reviewer changed this</div>
                <div className="fleet-alert-desc">{resolved.correction}</div>
              </div>
            </div>
          )}

          {/* The figure takes the same measure as the answer above it, so
              the turn reads as one column rather than a paragraph with a
              narrow card hanging off its left edge. */}
          {resolved.variant.viz && (
            <div className="w-full max-w-[68ch]">
              <VizBlock viz={resolved.variant.viz} />
            </div>
          )}
        </div>
      )}

      {resolved && resolved.state === 'denied' && (
        <div className="fleet-alert fleet-alert-info max-w-[68ch]">
          <Lock className="fleet-alert-icon h-4 w-4" strokeWidth={2} />
          <div className="fleet-alert-desc">{resolved.message}</div>
        </div>
      )}
    </div>
  )
}
