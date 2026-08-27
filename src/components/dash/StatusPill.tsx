import { Badge } from '@/components/ui/badge'

type Tone = 'ok' | 'ac'

// A dashboard that shipped with the platform reads as a settled fact, so
// it takes the success badge. One built through "describe a new
// dashboard" takes the neutral secondary badge instead: calling it
// "System" a second time would simply not be true.
export default function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <Badge variant={tone === 'ok' ? 'success' : 'secondary'}>{children}</Badge>
}
