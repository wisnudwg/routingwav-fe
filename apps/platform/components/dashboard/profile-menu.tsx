"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, LogOut, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { displayName, initialsOf, signOut, useSession } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { KIND_INFO, PROFILE_KINDS } from "@/lib/roles"
import { useActiveMode } from "@/lib/use-active-mode"
import { ModeSwitcher } from "./mode-switcher"
import { Bell, Settings } from "lucide-react"
import { StatusBadge } from "@/components/account/status-badge"
import { useKycStatus } from "@/lib/use-kyc-status"

export function ProfileMenu() {
  const router = useRouter()
  const session = useSession()
  const active = useActiveMode()
  const kyc = useKycStatus()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!session) return null

  const name = displayName(session)
  const identity = session.type === "root" ? session.email : `${session.username} @ ${session.account}`
  const subtitle = [active ? KIND_INFO[active].title : null, session.type === "iam" ? `@${session.account}` : null]
    .filter(Boolean)
    .join(" · ")

  const missing = PROFILE_KINDS.find((k) => !session.profiles.includes(k))
  const canAddProfile = !!missing && can(session, "account:manage")

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-lg border bg-white py-1.5 pl-1.5 pr-3 shadow-sm hover:bg-slate-50"
      >
        <Avatar>
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <div className="hidden max-w-36 text-left leading-tight sm:block">
          <p className="truncate font-semibold text-slate-900">{name}</p>
          <p className="truncate text-sm text-slate-600">{subtitle}</p>
        </div>
        <ChevronDown className="size-4 text-slate-500" aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border bg-white p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate font-medium text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{identity}</p>
            {kyc && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              Identitas: <StatusBadge status={kyc} />
            </p>
          )}
          </div>

          {/* Mobile only: the header version is hidden below md */}
          <div className="px-2 pb-1 md:hidden">
            <ModeSwitcher className="w-full [&>button]:flex-1" />
          </div>

          {canAddProfile && missing && (
            <Link
              href="/profiles/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              <Plus className="size-4" aria-hidden />
              Tambah profil {KIND_INFO[missing].title}
            </Link>
          )}

          <Link
            href="/settings/notifications"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
          >
            <Bell className="size-4" aria-hidden />
            Notifikasi
          </Link>

          {can(session, "account:manage") && (
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
            >
              <Settings className="size-4" aria-hidden />
              Pengaturan akun
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await signOut()
              router.replace("/auth/sign-in")
            }}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
          >
            <LogOut className="size-4" aria-hidden />
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}