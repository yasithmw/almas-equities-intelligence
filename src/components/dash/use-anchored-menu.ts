'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The widget header's menu behaviour: a trigger, a panel positioned against it
 * and rendered into document.body, dismissal on click-outside and Escape, and
 * repositioning while the page scrolls under it.
 *
 * The portal is what makes this necessary rather than convenient. A widget tile
 * clips its own overflow, and in a chat thread it also sits inside a scroll
 * container, so a menu rendered in place is cut off at the card's edge. The real
 * product solves it the same way and says so: chart-type-menu.tsx carries the
 * comment "Mirrors ShareMenu (widget-toolbar.tsx)" above a second copy of this
 * logic. The demo needs both menus too, so the shared part is a hook here
 * instead of a second copy. Behaviour is the product's, verbatim, including the
 * right-edge alignment and the flip-above when there is no room below.
 */
export function useAnchoredMenu({ width, height }: { width: number; height: number }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow >= height ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)
      const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
      setPos({ top, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, width, height])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, triggerRef, menuRef, pos, mounted }
}
