"use client"

import { useEffect, useRef, useState } from "react"
import { Paperclip, SendHorizontal, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { Actor } from "@/lib/approvals"
import {
  AUDIO_ACCEPT,
  MAX_AUDIO_MB,
  MAX_TEXT,
  type Attachment,
  type AttachmentRole,
  type Message,
} from "@/lib/messages"
import { discardAttachment, editMessage, sendMessage, uploadAttachment } from "@/lib/messages-api"
import type { ProfileKind } from "@/lib/roles"
import { AudioPlayer } from "./audio-player"

const ROLE_OPTIONS: { value: AttachmentRole; title: string; hint: string }[] = [
  {
    value: "deliverable",
    title: "Hasil kerja",
    hint: "Client mendengar pratinjau ber-watermark. Unduhan terbuka setelah kontrak selesai dan dibayar.",
  },
  { value: "reference", title: "Materi / referensi", hint: "Lawan bicara bisa langsung mengunduhnya." },
]

export function MessageComposer({
  actor,
  conversationId,
  ourKind,
  canSend,
  editing,
  onExitEdit,
  onSending,
}: {
  actor: Actor
  conversationId: string
  ourKind: ProfileKind
  canSend: boolean
  editing: Message | null
  onExitEdit: () => void
  onSending: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(editing?.text ?? "")
  const [editId, setEditId] = useState<string | null>(editing?.id ?? null)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [role, setRole] = useState<AttachmentRole>("deliverable")
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Entering or leaving edit mode swaps the text (state adjusted during render, not in an effect)
  const wantedEditId = editing?.id ?? null
  if (wantedEditId !== editId) {
    setEditId(wantedEditId)
    setText(editing?.text ?? "")
    setError(null)
  }

  useEffect(() => {
    if (editId) areaRef.current?.focus()
  }, [editId])

  if (!canSend) {
    return (
      <div className="border-t bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Anda hanya dapat membaca percakapan ini. Hubungi pemilik akun jika perlu izin mengirim pesan.
      </div>
    )
  }

  const isEditing = !!editing
  const trimmed = text.trim()
  const canSubmit = isEditing
    ? !sending && trimmed !== (editing.text ?? "") && (trimmed.length > 0 || !!editing.attachment)
    : !sending && progress === null && (trimmed.length > 0 || !!attachment)

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

    if (editing) {
      const res = await editMessage(actor, conversationId, editing.id, text)
      setSending(false)
      if (!res.ok) return setError(res.message)
      onExitEdit()
      return
    }

    onSending()
    const res = await sendMessage(actor, conversationId, {
      text,
      // The server makes the final call on the role. Client-side uploads are always references.
      attachment: attachment ? { ...attachment, role: ourKind === "talent" ? role : "reference" } : undefined,
    })
    setSending(false)
    if (!res.ok) return setError(res.message)
    setText("")
    setAttachment(null)
  }

  return (
    <div className="space-y-2 border-t bg-white p-3">
      {isEditing && (
        <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>Mengubah pesan{editing.attachment && " (file audio tidak bisa diganti)"}</span>
          <button type="button" onClick={onExitEdit} className="font-medium hover:underline">
            Batal
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {!isEditing && progress !== null && (
        <div className="space-y-1" role="status" aria-label="Mengunggah">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-500">Mengunggah… {Math.round(progress * 100)}%</p>
        </div>
      )}

      {!isEditing && attachment && (
        <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
          <div className="flex items-start gap-2">
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

          {ourKind === "talent" ? (
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-medium text-slate-700">Jenis file ini</legend>
              {ROLE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2 text-xs",
                    role === o.value && "border-brand bg-brand/5"
                  )}
                >
                  <input
                    type="radio"
                    name="attachment-role"
                    checked={role === o.value}
                    onChange={() => setRole(o.value)}
                    className="mt-0.5 size-3.5 accent-brand"
                  />
                  <span>
                    <span className="font-medium text-slate-900">{o.title}</span>
                    <span className="block text-slate-600">{o.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="text-xs text-slate-600">Dikirim sebagai materi referensi. Lawan bicara bisa langsung mengunduhnya.</p>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {!isEditing && (
          <>
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
          </>
        )}

        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT}
          rows={1}
          placeholder={isEditing ? "Ubah pesan…" : "Tulis pesan…"}
          aria-label="Pesan"
          onKeyDown={(e) => {
            if (e.key === "Escape" && isEditing) return onExitEdit()
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
            if (window.matchMedia("(pointer: coarse)").matches) return // touch keyboards: Enter = new line
            e.preventDefault()
            void submit()
          }}
          className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />

        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={isEditing ? "Simpan perubahan" : "Kirim"}
          className="size-10 shrink-0 p-0"
        >
          <SendHorizontal className="size-5" />
        </Button>
      </div>

      {text.length > MAX_TEXT - 200 && (
        <p className="text-right text-[11px] text-slate-500">{text.length}/{MAX_TEXT}</p>
      )}
    </div>
  )
}