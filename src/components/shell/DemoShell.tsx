'use client'

import ChatPane from '@/components/chat/ChatPane'
import DashboardsPane from '@/components/dash/DashboardsPane'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DeskId } from '@/lib/types'
import { DemoProvider, useDemo } from './DemoContext'
import Topbar from './Topbar'
import DemoBand from './DemoBand'
import AppSidebar from './AppSidebar'

// The frame is the platform's own: a full-width 64px header, then the
// sidebar opening BELOW it and sharing the remaining height with the
// content column to its right. Ported from the real workspace layout
// (gf-app-dashboard src/app/(workspace)/layout.tsx) so the demo sits in
// the same chrome the client already uses, rather than in a lookalike.
function ShellBody() {
  const { view } = useDemo()

  return (
    <div className="fleet-page relative flex h-screen flex-col overflow-hidden bg-background">
      <Topbar />
      <DemoBand />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            {view === 'chat' ? <ChatPane /> : <DashboardsPane />}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function DemoShell({ initialDesk }: { initialDesk?: DeskId } = {}) {
  return (
    <DemoProvider initialDesk={initialDesk}>
      <TooltipProvider delayDuration={250}>
        <ShellBody />
      </TooltipProvider>
    </DemoProvider>
  )
}
