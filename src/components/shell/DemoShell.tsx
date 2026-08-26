'use client'

import ChatPane from '@/components/chat/ChatPane'
import DashboardsPane from '@/components/dash/DashboardsPane'
import { DemoProvider, useDemo } from './DemoContext'
import TopBar from './TopBar'
import DemoBand from './DemoBand'
import SideRail from './SideRail'
import styles from './DemoShell.module.css'

function ShellBody() {
  const { view } = useDemo()

  return (
    <div className={styles.shell}>
      <TopBar />
      <DemoBand />
      <div className={styles.body}>
        <SideRail />
        <main className={styles.main}>
          {view === 'chat' ? <ChatPane /> : <DashboardsPane />}
        </main>
      </div>
    </div>
  )
}

// Composes the bar, the band, the rail and the routed pane, and is the
// one place the desk/mode/view/history state (DemoContext) actually
// lives, per the Interfaces contract Tasks 7 and 8 were written against.
export default function DemoShell() {
  return (
    <DemoProvider>
      <ShellBody />
    </DemoProvider>
  )
}
