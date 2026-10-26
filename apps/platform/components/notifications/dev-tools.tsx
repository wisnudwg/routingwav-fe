"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { requesterKey } from "@/lib/approvals"
import { formatDateTime } from "@/lib/format"
import { CATEGORIES, CATEGORY_INFO, type Category, type MockEmail } from "@/lib/notifications"
import { listOutbox, sendTestNotification } from "@/lib/notifications-api"
import { NOTIFICATIONS_EVENT } from "@/lib/notifications-store"
import { useActor } from "@/lib/use-actor"

function DevToolsInner() {
  const actor = useActor()
  const alias = actor?.alias
  const isOwner = actor?.kind === "root"
  const [category, setCategory] = useState<Category>("finance")
  const [emails, setEmails] = useState<MockEmail[]>([])

  useEffect(() => {
    if (!alias || !isOwner) return
    let cancelled = false
    const load = () =>
      listOutbox(alias).then((m) => {
        if (!cancelled) setEmails(m)
      })
    void load()
    window.addEventListener(NOTIFICATIONS_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_EVENT, load)
    }
  }, [alias, isOwner])

  if (!actor) return null

  return (
    <section className="space-y-4 rounded-lg border border-dashed p-4 md:p-6">
      <h2 className="font-medium text-slate-900">Dev: uji notifikasi</h2>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          aria-label="Kategori"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_INFO[c].label}</option>
          ))}
        </select>
        <Button size="sm" onClick={() => sendTestNotification(actor.alias, requesterKey(actor), category)}>
          Kirim notifikasi uji ke saya
        </Button>
      </div>

      {isOwner && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Kotak keluar email (simulasi)</p>
          {emails.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada email terkirim.</p>
          ) : (
            <ul className="divide-y rounded-md border bg-white">
              {emails.map((m) => (
                <li key={m.id} className="px-3 py-2">
                  <details>
                    <summary className="cursor-pointer text-sm text-slate-900">
                      {m.subject}
                      <span className="ml-2 text-xs text-slate-500">
                        kepada {m.to} · {CATEGORY_INFO[m.category].label} · {formatDateTime(m.createdAt)}
                      </span>
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{m.body}</pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export function DevTools() {
  if (process.env.NODE_ENV === "production") return null
  return <DevToolsInner />
}