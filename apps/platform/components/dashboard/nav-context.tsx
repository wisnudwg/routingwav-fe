"use client"

import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type MobileNavContext = { open: boolean; setOpen: (open: boolean) => void }

const Ctx = createContext<MobileNavContext | null>(null)

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Remember which page the drawer was opened on. It counts as "open" only
  // while we're still on that page, so any navigation (link click, browser
  // back button) closes it automatically, with no effect needed.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const open = openedOn === pathname

  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname]
  )

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOn(null)
    }
    // If the window is resized up to desktop width, close and unlock scrolling
    const mq = window.matchMedia("(min-width: 768px)")
    const onResize = (e: MediaQueryListEvent) => {
      if (e.matches) setOpenedOn(null)
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden" // lock background scroll

    document.addEventListener("keydown", onKey)
    mq.addEventListener("change", onResize)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      mq.removeEventListener("change", onResize)
    }
  }, [open])

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMobileNav() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useMobileNav must be used inside <MobileNavProvider>")
  return ctx
}