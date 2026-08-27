'use client'

import { DESKS } from '@/lib/desks'
import { ALMAS_LOGO_SRC } from './almas-logo'
import DeskSwitcher from './DeskSwitcher'
import { useDemo } from './DemoContext'

// Ported from the platform's Topbar: h-16, card ground, one hairline
// bottom border, the tenant logo left at its natural height, identity
// controls right. A branded tenant is exactly how the real header
// renders for a customer, so Almas's own mark sits where the Graffs
// diamond would otherwise be.
//
// Deliberately NOT ported: the platform's "Sign out" pill and theme
// toggle. Both would be dead controls here, and a demo that ships dead
// controls teaches the client to distrust the ones that work.
export default function Topbar() {
  const { desk } = useDemo()
  const current = DESKS.find((d) => d.id === desk) ?? DESKS[0]

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between bg-card px-6"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center gap-3">
        <img
          src={ALMAS_LOGO_SRC}
          alt="Almas Equities"
          style={{ height: 34, width: 'auto', maxWidth: 280, objectFit: 'contain', display: 'block' }}
        />
      </div>

      <div className="flex items-center gap-3">
        <DeskSwitcher />
        <span className="hidden text-[12.5px] text-muted-foreground sm:inline">
          {current.person}
        </span>
      </div>
    </header>
  )
}
