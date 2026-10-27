"use client"

import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  ROLE_LABEL,
  dealOf,
  deleteBlockReason,
  editBlockReason,
  formatTime,
  roleOf,
  type Conversation,
  type Message,
} from "@/lib/messages"
import { AudioPlayer } from "./audio-player"

export function MessageBubble({
  message,
  showMeta,
  conversation,
  me,
  isOwner,
  canSend,
  now,
  onEdit,
  onDelete,
}: {
  message: Message
  showMeta: boolean
  conversation: Conversation
  me: string
  isOwner: boolean
  canSend: boolean
  now: number
  onEdit: (m: Message) => void
  /** Resolves to an error message, or null on success */
  onDelete: (m: Message) => Promise<string | null>
}) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mine = message.from.side === "us"
  const deal = dealOf(conversation)
  const align = mine ? "items-end" : "items-start"

  if (message.deletedAt) {
    return (
      <div className={cn("flex flex-col", align, showMeta && "mt-3")}>
        <div className="rounded-2xl border border-dashed px-3.5 py-2 text-sm italic text-slate-500">
          Pesan ini telah dihapus.
        </div>
      </div>
    )
  }

  const editOk = canSend && editBlockReason(message, me, now) === null
  const deleteOk = canSend && deleteBlockReason(message, me, isOwner, now, deal) === null
  const role = message.attachment ? roleOf(message.attachment) : null
  const ownDeliverableLocked =
    mine && role === "deliverable" && conversation.ourKind === "talent" && deal !== "completed_paid"

  async function confirmDelete() {
    setError(await onDelete(message))
    setConfirming(false)
  }

  return (
    <div className={cn("flex flex-col", align, showMeta && "mt-3")}>
      {showMeta && (
        <p className="mb-1 px-1 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{message.from.party}</span>
          {message.from.member && <> · oleh {message.from.member}</>}
          {" · "}
          {formatTime(message.createdAt)}
        </p>
      )}

      <div
        className={cn(
          "max-w-[88%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[75%]",
          mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border bg-white text-slate-900"
        )}
      >
        {message.text && (
          <p className="whitespace-pre-wrap wrap-break-word">
            {message.text}
            {message.editedAt && <span className="ml-1.5 text-[11px] opacity-70">(diedit)</span>}
          </p>
        )}

        {message.attachment && role && (
          <div className="w-64 max-w-full space-y-1.5 sm:w-72">
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{ROLE_LABEL[role]}</p>
            <AudioPlayer
              attachment={message.attachment}
              tone={mine ? "dark" : "light"}
              context={{ conversationId: conversation.id, messageId: message.id }}
            />
          </div>
        )}
      </div>

      {ownDeliverableLocked && (
        <p className="mt-1 max-w-[88%] px-1 text-[11px] italic text-slate-500">
          Client mendengar pratinjau ber-watermark sampai kontrak selesai dan dibayar.
        </p>
      )}

      {(editOk || deleteOk) && (
        <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500">
          {confirming ? (
            <>
              <span>Hapus pesan ini untuk semua orang?</span>
              <button type="button" onClick={confirmDelete} className="font-medium text-destructive hover:underline">
                Ya, hapus
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="hover:underline">
                Batal
              </button>
            </>
          ) : (
            <>
              {editOk && (
                <button type="button" onClick={() => onEdit(message)} className="hover:text-brand hover:underline">
                  Ubah
                </button>
              )}
              {deleteOk && (
                <button type="button" onClick={() => setConfirming(true)} className="hover:text-destructive hover:underline">
                  Hapus
                </button>
              )}
            </>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-1 px-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}