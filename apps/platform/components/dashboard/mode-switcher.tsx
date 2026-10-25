"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { switchMode, useSession } from "@/lib/auth"
import { homeHref } from "@/lib/nav-config"
import { availableModes } from "@/lib/permissions"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"
import { modeFromPath } from "@/lib/routes"
import { useActiveMode } from "@/lib/use-active-mode"

export function ModeSwitcher({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const session = useSession()
  const active = useActiveMode()

  if (!session) return null
  const s = session
  const modes = PROFILE_KINDS.filter((k) => availableModes(s).includes(k) && homeHref(s, k) !== null)
  if (modes.length < 2) return null

  const choose = (next: ProfileKind) => {
    if (next === active) return
    if (modeFromPath(pathname)) {
      const target = homeHref(s, next)
      if (target) router.push(target) // the destination's ModeGate saves the mode
    } else {
      switchMode(next) // shared page: stay here, the sidebar follows
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Beralih profil"
      className={cn("inline-flex rounded-lg border bg-slate-100 p-0.5 text-sm", className)}
    >
      {modes.map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={k === active}
          onClick={() => choose(k)}
          className={cn(
            "rounded-md px-3 py-1 transition-colors",
            k === active
              ? "bg-white font-medium text-brand shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {KIND_INFO[k].title}
        </button>
      ))}
    </div>
  )
}