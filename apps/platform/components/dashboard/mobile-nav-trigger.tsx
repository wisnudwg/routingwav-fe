"use client"

import { Menu } from "lucide-react"
import { useMobileNav } from "./nav-context"

export function MobileNavTrigger() {
  const { open, setOpen } = useMobileNav()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Buka menu"
      aria-expanded={open}
      aria-controls="mobile-sidebar"
      className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
    >
      <Menu className="size-5" />
    </button>
  )
}