import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoShell from './DemoShell'

describe('shell', () => {
  it('shows the tenant mark and the account avatar, and no desk controls', () => {
    render(<DemoShell />)
    expect(screen.getByAltText('Almas Equities')).toBeDefined()
    expect(screen.getByLabelText('Account')).toBeDefined()
    // The header's desk switcher was removed at the user's request, so the
    // demo runs on the default desk. The scoping rules behind it are still
    // live (see desks.ts and the dashboards suite), just not switchable
    // from the chrome.
    expect(screen.queryByTestId('active-desk')).toBeNull()
    expect(screen.queryByText('A. Jayawardena')).toBeNull()
  })

  // The platform's role pill, in the platform's position: before the avatar,
  // never after it. lib/roles.ts maps the "Super.Admins" claim to this label,
  // and the real header carries the raw claim in the title, so both travel.
  it('shows the role pill left of the account avatar', () => {
    const { container } = render(<DemoShell />)
    const pill = screen.getByText('Super Admin')
    expect(pill.getAttribute('title')).toBe('Super.Admins')
    expect(pill.querySelector('.fleet-pill-dot')).not.toBeNull()

    // Order, read off the DOM rather than trusted: the pill precedes the
    // avatar. Node.compareDocumentPosition is the only assertion here that
    // cannot be satisfied by putting them in either order.
    const avatar = screen.getByLabelText('Account')
    expect(pill.compareDocumentPosition(avatar) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy()
    expect(container.querySelector('header')!.contains(pill)).toBe(true)
  })

  // A role is a label, not an action. The platform renders it as a span for
  // the same reason the avatar is one.
  it('makes the role pill a label rather than a control', () => {
    render(<DemoShell />)
    const pill = screen.getByText('Super Admin')
    expect(pill.tagName.toLowerCase()).toBe('span')
    expect(pill.closest('button')).toBeNull()
    expect(pill.closest('a')).toBeNull()
  })

  it('shows the demo band, with no way to dismiss it', () => {
    render(<DemoShell />)
    const band = screen.getByRole('note')
    // Three CLAIMS, asserted by meaning rather than by sentence. This line
    // has been reworded three times ("finished platform" -> "complete
    // solution", "data is" -> "data are"), and an exact-match assertion just
    // breaks on each pass without protecting anything. What must not change is
    // that all three claims are present, above all the middle one: it is the
    // half that stops a client assuming the screen in front of them exists.
    expect(band.textContent).toMatch(/preview of the concept/i)
    expect(band.textContent).toMatch(/not the (complete|finished|full)\s+(solution|platform|product)/i)
    expect(band.textContent).toMatch(/data (is|are) placeholder/i)
    expect(band.querySelector('button')).toBeNull()
  })

  // Centred on purpose: left-aligned it reads as the page's first row,
  // competing with the sidebar; centred it reads as a label on the window.
  it('centres the demo band', () => {
    render(<DemoShell />)
    expect(screen.getByRole('note').className).toContain('justify-center')
  })

  it('routes between chat and dashboards from the sidebar', async () => {
    const user = userEvent.setup()
    render(<DemoShell />)
    await user.click(screen.getByRole('button', { name: /^dashboards$/i }))
    expect(screen.getByRole('heading', { name: /market overview/i })).toBeDefined()
    await user.click(screen.getByRole('button', { name: /^chat$/i }))
    expect(screen.getByPlaceholderText(/ask about any stock/i)).toBeDefined()
  })

  it('renders no em dash in its chrome', () => {
    const { container } = render(<DemoShell />)
    expect(container.textContent).not.toContain('\u2014')
  })
})
