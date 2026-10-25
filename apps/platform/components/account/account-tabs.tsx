"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

const TABS = [
  { href: "/account", label: "Profil" },
  { href: "/account/verification", label: "Verifikasi identitas" },
  { href: "/account/activity", label: "Log aktivitas" },
]

export function AccountTabs() {
  const pathname = usePathname()
  return (
    <nav aria-label="Pengaturan akun" className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm",
              active ? "border-brand font-medium text-brand" : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}