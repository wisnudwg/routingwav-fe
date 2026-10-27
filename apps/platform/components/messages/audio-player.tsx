"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2, Lock, Pause, Play, ShieldCheck } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { getBlob } from "@/lib/audio-blob-store"
import { formatClock } from "@/lib/audio-utils"
import type { AccessState } from "@/lib/files"
import { formatBytes } from "@/lib/format"
import type { Attachment } from "@/lib/messages"
import { downloadAttachment, getAttachmentAccess, getAttachmentBlob } from "@/lib/messages-api"
import { MESSAGES_EVENT } from "@/lib/messages-store"
import { useActor } from "@/lib/use-actor"
import { createChime, tagIndexAt, type Chime } from "@/lib/watermark-tag"

// Only one clip plays at a time
let active: HTMLAudioElement | null = null

type Props = {
  attachment: Attachment
  tone?: "light" | "dark"
  /** Set for sent messages. Without it this is a local preview of a file that hasn't been sent yet. */
  context?: { conversationId: string; messageId: string }
}

export function AudioPlayer({ attachment, tone = "light", context }: Props) {
  const actor = useActor()
  const convId = context?.conversationId
  const msgId = context?.messageId

  const ref = useRef<HTMLAudioElement>(null)
  const chime = useRef<Chime | null>(null)
  const lastTag = useRef(-1)

  const [src, setSrc] = useState<string | null>(null)
  const [access, setAccess] = useState<AccessState | null>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(attachment.duration ?? 0)
  const [dlError, setDlError] = useState<string | null>(null)
  const [dlBusy, setDlBusy] = useState(false)

  // The audio itself
  useEffect(() => {
    let url: string | null = null
    let cancelled = false

    const source: Promise<Blob | null> = convId && msgId
      ? actor
        ? getAttachmentBlob(actor, convId, msgId)
        : Promise.resolve(null)
      : getBlob(attachment.id) // local preview of our own pending upload

    source
      .then((blob) => {
        if (cancelled) return
        if (!blob) return setFailed(true)
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [actor, attachment.id, convId, msgId])

  // What this person may do with it. Refreshed when the deal status changes, without reloading the audio.
  useEffect(() => {
    if (!actor || !convId || !msgId) return
    let cancelled = false
    const load = () =>
      getAttachmentAccess(actor, convId, msgId).then((a) => {
        if (!cancelled && a) setAccess(a)
      })
    void load()
    window.addEventListener(MESSAGES_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(MESSAGES_EVENT, load)
    }
  }, [actor, convId, msgId])

  useEffect(() => {
    const el = ref.current
    return () => {
      if (el && active === el) active = null
      chime.current?.close()
      chime.current = null
    }
  }, [])

  function toggle() {
    const el = ref.current
    if (!el || !src) return
    if (el.paused) {
      if (access?.watermarked && !chime.current) chime.current = createChime() // inside the click: required for audio
      el.play().catch((e: unknown) => {
        if ((e as { name?: string })?.name === "NotSupportedError") setFailed(true)
      })
    } else {
      el.pause()
    }
  }

  async function download() {
    if (!actor || !convId || !msgId) return
    setDlBusy(true)
    setDlError(null)
    const res = await downloadAttachment(actor, convId, msgId)
    setDlBusy(false)
    if (!res.ok) return setDlError(res.message)

    const url = URL.createObjectURL(res.data.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = res.data.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const dark = tone === "dark"
  const max = duration > 0 ? duration : 1
  const muted = dark ? "text-white/75" : "text-slate-500"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!src || failed}
          aria-label={`${playing ? "Jeda" : "Putar"} ${attachment.name}`}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full disabled:opacity-50",
            dark ? "bg-white/20 text-white hover:bg-white/30" : "bg-brand text-white hover:bg-brand/90"
          )}
        >
          {!src && !failed ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={max}
            step={0.1}
            value={Math.min(time, max)}
            disabled={!src || !duration || failed}
            aria-label="Posisi pemutaran"
            onChange={(e) => {
              const t = Number(e.target.value)
              if (ref.current) ref.current.currentTime = t
              setTime(t)
            }}
            className={cn("block h-1 w-full cursor-pointer", dark ? "accent-white" : "accent-brand")}
          />
          <p className={cn("text-[11px] tabular-nums", muted)}>
            {formatClock(time)} / {duration ? formatClock(duration) : "--:--"}
          </p>
        </div>
      </div>

      <p className={cn("truncate text-[11px]", muted)}>
        {attachment.name} · {attachment.kind.toUpperCase()} · {formatBytes(attachment.size)}
      </p>

      {access?.watermarked && (
        <p
          className={cn("flex items-center gap-1 text-[11px]", muted)}
          title="Kualitas penuh. Penanda suara ditambahkan secara berkala. Versi asli tersedia setelah kontrak selesai dan dibayar."
        >
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          Pratinjau ber-watermark
        </p>
      )}

      {access &&
        (access.download.allowed ? (
          <button
            type="button"
            onClick={download}
            disabled={dlBusy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs disabled:opacity-50",
              dark ? "border-white/40 text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Download className="size-3.5" aria-hidden />
            {dlBusy ? "Mengunduh…" : "Unduh"}
          </button>
        ) : (
          <p className={cn("flex items-center gap-1 text-[11px]", muted)}>
            <Lock className="size-3.5 shrink-0" aria-hidden />
            {access.download.reason === "locked_until_paid"
              ? "Unduhan tersedia setelah kontrak selesai dan dibayar."
              : "Anda tidak memiliki izin mengunduh file."}
          </p>
        ))}

      {dlError && <p role="alert" className={cn("text-[11px]", dark ? "text-white" : "text-destructive")}>{dlError}</p>}
      {failed && (
        <p role="alert" className={cn("text-[11px]", dark ? "text-white" : "text-destructive")}>
          File audio tidak bisa diputar.
        </p>
      )}

      <audio
        ref={ref}
        src={src ?? undefined}
        preload="metadata"
        onPlay={(e) => {
          if (active && active !== e.currentTarget) active.pause()
          active = e.currentTarget
          setPlaying(true)
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setTime(0)
          lastTag.current = -1
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          setTime(el.currentTime)
          if (el.seeking) return
          const idx = tagIndexAt(el.currentTime)
          if (idx < lastTag.current) {
            lastTag.current = idx // rewound
          } else if (idx > lastTag.current) {
            lastTag.current = idx
            if (access?.watermarked && !el.paused) chime.current?.play()
          }
        }}
        onSeeked={(e) => {
          lastTag.current = tagIndexAt(e.currentTarget.currentTime) // jumping around doesn't fire tags
        }}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration)
        }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}