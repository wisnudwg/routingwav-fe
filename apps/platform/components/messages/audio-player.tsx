"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Pause, Play } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { getBlob } from "@/lib/audio-blob-store"
import { formatClock } from "@/lib/audio-utils"
import { formatBytes } from "@/lib/format"
import type { Attachment } from "@/lib/messages"

// Only one clip plays at a time
let active: HTMLAudioElement | null = null

export function AudioPlayer({ attachment, tone = "light" }: { attachment: Attachment; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(attachment.duration ?? 0)

  // MOCK: resolves a blob URL from IndexedDB. A real app uses a short-lived presigned GET URL.
  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    getBlob(attachment.id)
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
  }, [attachment.id])

  useEffect(() => {
    const el = ref.current
    return () => {
      if (el && active === el) active = null
    }
  }, [])

  function toggle() {
    const el = ref.current
    if (!el || !src) return
    if (el.paused) {
      el.play().catch((e: unknown) => {
        if ((e as { name?: string })?.name === "NotSupportedError") setFailed(true)
      })
    } else {
      el.pause()
    }
  }

  const dark = tone === "dark"
  const max = duration > 0 ? duration : 1

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
          <p className={cn("text-[11px] tabular-nums", dark ? "text-white/80" : "text-slate-500")}>
            {formatClock(time)} / {duration ? formatClock(duration) : "--:--"}
          </p>
        </div>
      </div>

      <p className={cn("truncate text-[11px]", dark ? "text-white/70" : "text-slate-500")}>
        {attachment.name} · {attachment.kind.toUpperCase()} · {formatBytes(attachment.size)}
      </p>
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
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration)
        }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}