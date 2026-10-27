"use client"

import Link from "next/link"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { requesterKey, type Actor } from "@/lib/approvals"
import { initialsOf, useSession } from "@/lib/auth"
import { DEAL_LABEL, dealOf, formatDayLabel, unreadCount, type DealStatus, type Message } from "@/lib/messages"
import {
  deleteMessage,
  devIncoming,
  devSetDealStatus,
  getThread,
  markConversationRead,
  type Thread,
} from "@/lib/messages-api"
import { MESSAGES_EVENT } from "@/lib/messages-store"
import { can } from "@/lib/permissions"
import { KIND_INFO } from "@/lib/roles"
import { useActor } from "@/lib/use-actor"
import { useNow } from "@/lib/use-now"
import { jakartaDay } from "@/lib/wallet"
import { MessageBubble } from "./message-bubble"
import { MessageComposer } from "./message-composer"

const DEAL_STEPS: DealStatus[] = ["none", "in_progress", "completed_paid"]

function DevThreadTools({ actor, id, deal }: { actor: Actor; id: string; deal: DealStatus }) {
  if (process.env.NODE_ENV === "production") return null
  return (
    <div className="space-y-2 border-t border-dashed bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">Dev: simulasi lawan bicara</span>
        <Button size="sm" variant="outline" onClick={() => devIncoming(actor, id, "text")}>Pesan masuk</Button>
        <Button size="sm" variant="outline" onClick={() => devIncoming(actor, id, "audio")}>Audio masuk (WAV 30 dtk)</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">Dev: status kontrak</span>
        {DEAL_STEPS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={deal === s ? "default" : "outline"}
            onClick={() => devSetDealStatus(actor, id, s)}
          >
            {DEAL_LABEL[s]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ThreadView({ id }: { id: string }) {
  const actor = useActor()
  const session = useSession()
  const now = useNow()
  const [state, setState] = useState<{ key: string; thread: Thread | null } | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true) // keep following new messages while the reader is near the bottom

  const me = actor ? requesterKey(actor) : ""
  const key = actor ? `${actor.alias}:${me}:${id}` : ""
  const thread = state && state.key === key ? state.thread : undefined // undefined = loading, null = not found

  useEffect(() => {
    if (!actor) return
    let cancelled = false
    const load = () =>
      getThread(actor, id).then((t) => {
        if (!cancelled) setState({ key, thread: t })
      })
    void load()
    window.addEventListener(MESSAGES_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      cancelled = true
      window.removeEventListener(MESSAGES_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [actor, id, key])

  // Opening a conversation (while the tab is visible) marks it read for this person
  const hasUnread = useMemo(
    () => !!thread && unreadCount(thread.messages, thread.conversation.reads, me) > 0,
    [thread, me]
  )
  useEffect(() => {
    if (!actor || !hasUnread) return
    const run = () => {
      if (document.visibilityState === "visible") void markConversationRead(actor, id)
    }
    run()
    document.addEventListener("visibilitychange", run)
    return () => document.removeEventListener("visibilitychange", run)
  }, [actor, id, hasUnread])

  const count = thread?.messages.length ?? 0
  useEffect(() => {
    stick.current = true
  }, [id])
  useEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [count, id])

  if (!actor) return null
  if (thread === undefined) return <p className="p-6 text-sm text-slate-500">Memuat…</p>

  if (thread === null) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="space-y-2">
          <p className="font-medium text-slate-900">Percakapan tidak ditemukan</p>
          <Link href="/messages" className="text-sm text-brand hover:underline">← Kembali ke daftar</Link>
        </div>
      </div>
    )
  }

  const { conversation: c, messages } = thread
  const canSend = !!session && can(session, "messages:send")
  const isOwner = actor.kind === "root"

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/messages"
          aria-label="Kembali ke daftar percakapan"
          className="grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
          {initialsOf(c.counterparty.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{c.counterparty.name}</p>
          <p className="truncate text-xs text-slate-500">
            {KIND_INFO[c.counterparty.kind].title} · {c.subject}
          </p>
        </div>
      </header>

      <div
        ref={listRef}
        onScroll={() => {
          const el = listRef.current
          if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4"
      >
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || jakartaDay(prev.createdAt) !== jakartaDay(m.createdAt)
          const sameSender =
            !!prev &&
            !newDay &&
            prev.from.side === m.from.side &&
            prev.from.party === m.from.party &&
            prev.authorKey === m.authorKey &&
            Date.parse(m.createdAt) - Date.parse(prev.createdAt) < 5 * 60_000

          return (
            <Fragment key={m.id}>
              {newDay && (
                <p className="my-3 text-center text-[11px] uppercase tracking-wide text-slate-500">
                  {formatDayLabel(m.createdAt)}
                </p>
              )}
              <MessageBubble
                message={m}
                showMeta={!sameSender}
                conversation={c}
                me={me}
                isOwner={isOwner}
                canSend={canSend}
                now={now}
                onEdit={setEditing}
                onDelete={async (msg) => {
                  const res = await deleteMessage(actor, id, msg.id)
                  return res.ok ? null : res.message
                }}
              />
            </Fragment>
          )
        })}
      </div>

      <DevThreadTools actor={actor} id={id} deal={dealOf(c)} />
      <MessageComposer
        actor={actor}
        conversationId={id}
        ourKind={c.ourKind}
        canSend={canSend}
        editing={editing}
        onExitEdit={() => setEditing(null)}
        onSending={() => {
          stick.current = true
        }}
      />
    </div>
  )
}