"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { clearSession, DASHBOARD_HOME, switchMode, useSession } from "@/lib/auth"

export function ClientHomePlaceholder() {
  const router = useRouter()
  const session = useSession()
  if (!session) return null

  const who = session.type === "root" ? session.email : `${session.username} @ ${session.account}`
  const canSwitch = session.profiles.includes("talent")

  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="font-display text-3xl text-slate-900">Dashboard Client</h1>
      <p className="text-sm text-slate-600">
        Masuk sebagai <span className="font-medium text-slate-900">{who}</span>. Halaman ini masih
        placeholder. Menu dan fitur Client dibangun di batch dashboard.
      </p>
      <div className="flex flex-wrap gap-2">
        {canSwitch && (
          <Button
            onClick={() => {
              switchMode("talent")
              router.push(DASHBOARD_HOME.talent)
            }}
          >
            Beralih ke Talent
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            clearSession()
            router.replace("/auth/sign-in")
          }}
        >
          Keluar
        </Button>
      </div>
    </main>
  )
}