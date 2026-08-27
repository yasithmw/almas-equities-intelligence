import { User } from 'lucide-react'
import { ALMAS_LOGO_SRC } from './almas-logo'

/**
 * The role pill's label.
 *
 * The platform derives it: `roleLabel(user.roles)` in lib/roles.ts walks
 * ROLE_LABELS, whose first and most senior entry is
 * ["Super.Admins", "Super Admin"]. The demo has no session and no claims to
 * walk, so the label is stated and the CLAIM it comes from travels with it in
 * the title, exactly as the real header does (`title={user.roles?.join(", ")}`).
 * Porting the whole role module to produce one constant string would be
 * machinery pretending to be an auth layer.
 */
const ROLE = { label: 'Super Admin', claim: 'Super.Admins' }

// Ported from the platform's Topbar: h-16, card ground, one hairline
// bottom border, the tenant logo left at its natural height. A branded
// tenant is exactly how the real header renders for a customer, so
// Almas's own mark sits where the Graffs diamond would otherwise be.
//
// Right side: the role pill, then the account avatar, in the platform's own
// order. The platform also puts the signed-in person's name between them and
// a Sign out pill after them; the name was removed at the user's request and
// Sign out would be a dead control. Neither the pill nor the avatar is a
// control, which is why both are spans rather than buttons: they say who is
// signed in and with what standing, and nothing more.
export default function Topbar() {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between bg-card px-6"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      {/* Mark plus wordmark. The image keeps the accessible name, and the
          visible wordmark is aria-hidden, so a screen reader says "Almas
          Equities" once rather than twice. */}
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={ALMAS_LOGO_SRC}
          alt="Almas Equities"
          style={{ height: 34, width: 'auto', maxWidth: 280, objectFit: 'contain', display: 'block' }}
        />
        <span
          aria-hidden="true"
          className="truncate text-[16px] font-bold tracking-[-0.014em] text-foreground"
        >
          Almas Equities
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* The platform's own role pill, class for class: .fleet-pill with a
            .fleet-pill-dot, in the neutral variant. The good/warn/bad variants
            exist for status, and a role is not a status. */}
        <span className="fleet-pill" title={ROLE.claim}>
          <span className="fleet-pill-dot" />
          {ROLE.label}
        </span>

        <span
          aria-label="Account"
          title="Account"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"
        >
          <User className="h-[17px] w-[17px]" strokeWidth={1.9} />
        </span>
      </div>
    </header>
  )
}
