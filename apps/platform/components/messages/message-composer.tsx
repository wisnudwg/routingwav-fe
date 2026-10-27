"use client"

import { useRef, useState } from "react"
import { Paperclip, SendHorizontal, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { Actor } from "@/lib/approvals"
import { AUDIO_ACCEPT, MAX_AUDIO_MB, MAX_TEXT, type Attachment } from "@/lib/messages"
import { discardAttachment, sendMessage, uploadAttachment } from "@/lib/messages-api"
import { AudioPlayer } from "./audio-player"

export function MessageComposer({
  actor,
  conversationId,
  canSend,
  onSending,
}: {
  actor: Actor
  conversationId: string
  canSend: boolean
  onSending: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (!canSend) {
    return (
      <div className="border-t bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Anda hanya dapat membaca percakapan ini. Hubungi pemilik akun jika perlu izin mengirim pesan.
      </div>
    )
  }

  const canSubmit = !sending && progress === null && (text.trim().length > 0 || !!attachment)

  async function pick(file: File) {
    setError(null)
    if (attachment) {
      await discardAttachment(attachment.id)
      setAttachment(null)
    }
    setProgress(0)
    const res = await uploadAttachment(actor, file, setProgress)
    setProgress(null)
    if (!res.ok) return setError(res.message)
    setAttachment(res.data)
  }

  async function removeAttachment() {
    if (!attachment) return
    const id = attachment.id
    setAttachment(null)
    await discardAttachment(id)
  }

  async function submit() {
    if (!canSubmit) return
    setSending(true)
    setError(null)
    onSending()
    const res = await sendMessage(actor, conversationId, { text, attachment: attachment ?? undefined })
    setSending(false)
    if (!res.ok) return setError(res.message)
    setText("")
    setAttachment(null)
  }

  return (
    <div className="space-y-2 border-t bg-white p-3">
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {progress !== null && (
        <div className="space-y-1" role="status" aria-label="Mengunggah">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-500">Mengunggah… {Math.round(progress * 100)}%</p>
        </div>
      )}

      {attachment && (
        <div className="flex items-start gap-2 rounded-lg border bg-slate-50 p-3">
          <div className="min-w-0 flex-1">
            <AudioPlayer attachment={attachment} />
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            aria-label="Hapus lampiran"
            className="grid size-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={AUDIO_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = "" // lets the same file be picked again after a rejection
            if (file) void pick(file)
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sending || progress !== null}
          aria-label={`Lampirkan file audio (MP3/WAV, maks ${MAX_AUDIO_MB} MB)`}
          title={`MP3 atau WAV, maks ${MAX_AUDIO_MB} MB`}
          className="grid size-10 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <Paperclip className="size-5" />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT}
          rows={1}
          placeholder="Tulis pesan…"
          aria-label="Pesan"
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
            if (window.matchMedia("(pointer: coarse)").matches) return // touch keyboards: Enter = new line
            e.preventDefault()
            void submit()
          }}
          className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />

        <Button type="button" onClick={submit} disabled={!canSubmit} aria-label="Kirim" className="size-10 shrink-0 p-0">
          <SendHorizontal className="size-5" />
        </Button>
      </div>

      {text.length > MAX_TEXT - 200 && (
        <p className="text-right text-[11px] text-slate-500">{text.length}/{MAX_TEXT}</p>
      )}
    </div>
  )
}