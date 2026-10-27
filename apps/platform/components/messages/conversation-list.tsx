"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { requesterKey } from "@/lib/approvals"
import { initialsOf, useSession } from "@/lib/auth"
import { formatRelative } from "@/lib/format"
import type { ConversationRow } from "@/lib/messages"
import { listConversations } from "@/lib/messages-api"
import { MESSAGES_EVENT } from "@/lib/messages-store"
import { KIND_INFO } from "@/lib/roles"
import { useActor } from "@/lib/use-actor"
import { DevConversationTools } from "./dev-conversation-tools"

export function ConversationList() {
  const actor = useActor()
  const session = useSession()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [state, setState] = useState<{ key: string; rows: ConversationRow[] } | null>(null)

  const key = actor ? `${actor.alias}:${requesterKey(actor)}` : ""

  useEffect(() => {
    if (!actor) return
    let cancelled = false
    const load = () =>
      listConversations(actor).then((rows) => {
        if (!cancelled) setState({ key, rows })
      })
    void load()
    window.addEventListener(MESSAGES_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      cancelled = true
      window.removeEventListener(MESSAGES_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [actor, key])

  if (!actor || !session) return null
  const rows = state && state.key === key ? state.rows : null

  const q = query.trim().toLowerCase()
  const shown = rows?.filter((r) => `${r.counterparty.name} ${r.subject}`.toLowerCase().includes(q)) ?? []
  const showKind = session.profiles.length > 1

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari percakapan"
            aria-label="Cari percakapan"
            className="bg-slate-50 pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows === null ? (
          <p className="p-4 text-sm text-slate-500">Memuat…</p>
        ) : shown.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-600">
            {rows.length === 0 ? "Belum ada percakapan." : "Tidak ada hasil."}
          </p>
        ) : (
          <ul className="divide-y">
            {shown.map((c) => {
              const active = pathname === `/messages/${c.id}`
              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex gap-3 px-4 py-3 hover:bg-slate-50", active && "bg-brand/5")}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                      {initialsOf(c.counterparty.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "font-semibold text-slate-900" : "text-slate-800")}>
                          {c.counterparty.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-500">{formatRelative(c.lastMessageAt)}</span>
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {c.subject}
                        {showKind && ` · sebagai ${KIND_INFO[c.ourKind].title}`}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", c.unread ? "text-slate-800" : "text-slate-500")}>
                          {c.lastPreview || "Belum ada pesan"}
                        </span>
                        {c.unread > 0 && (
                          <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-medium leading-5 text-white">
                            {c.unread > 99 ? "99+" : c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <DevConversationTools actor={actor} latestId={rows?.[0]?.id} />
    </div>
  )
}