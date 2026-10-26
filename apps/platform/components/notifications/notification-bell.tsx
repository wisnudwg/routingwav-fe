"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Bell, ClipboardCheck, FileSignature, MessageSquare, ShieldCheck, Wallet, type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { formatRelative } from "@/lib/format"
import type { AppNotification, Category } from "@/lib/notifications"
import { markAllRead, markNotificationRead } from "@/lib/notifications-api"
import { useNotifications } from "@/lib/use-notifications"

const ICONS: Record<Category, LucideIcon> = {
  finance: Wallet,
  approvals: ClipboardCheck,
  deals: FileSignature,
  messages: MessageSquare,
  account: ShieldCheck,
}

export function NotificationBell() {
  const router = useRouter()
  const { alias, user, items, unread } = useNotifications()
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

  if (!alias || !user) return null

  const openItem = async (n: AppNotification) => {
    await markNotificationRead(alias, user, n.id)
    setOpen(false)
    router.push(n.url)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-md border bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-medium text-slate-900">Notifikasi</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead(alias, user)}
                className="text-xs text-brand hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {items === null ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Memuat…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-600">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {items.map((n) => {
                const Icon = ICONS[n.category]
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50", !n.readAt && "bg-brand/5")}
                    >
                      <Icon className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-sm", n.readAt ? "text-slate-800" : "font-semibold text-slate-900")}>
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-500">{formatRelative(n.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-slate-600">{n.body}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t px-4 py-2.5">
            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand hover:underline"
            >
              Pengaturan notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}