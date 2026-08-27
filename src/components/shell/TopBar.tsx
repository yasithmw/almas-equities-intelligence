import { User } from 'lucide-react'
import { ALMAS_LOGO_SRC } from './almas-logo'

// Ported from the platform's Topbar: h-16, card ground, one hairline
// bottom border, the tenant logo left at its natural height. A branded
// tenant is exactly how the real header renders for a customer, so
// Almas's own mark sits where the Graffs diamond would otherwise be.
//
// Right side: the account avatar only. The platform also puts a theme
// toggle and a Sign out pill there, and both would be dead controls in a
// demo. The avatar is not a control either, which is why it is a span
// rather than a button: it says who is signed in, and nothing more.
export default function Topbar() {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between bg-card px-6"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <img
        src={ALMAS_LOGO_SRC}
        alt="Almas Equities"
        style={{ height: 34, width: 'auto', maxWidth: 280, objectFit: 'contain', display: 'block' }}
      />

      <span
        aria-label="Account"
        title="Account"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"
      >
        <User className="h-[17px] w-[17px]" strokeWidth={1.9} />
      </span>
    </header>
  )
}
