import type { AudioKind } from "./messages"

/** The file's real format, from its first bytes. The server must repeat this check. */
export async function sniffAudio(file: Blob): Promise<AudioKind | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const text = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (text(0, 4) === "RIFF" && text(8, 12) === "WAVE") return "wav"
  if (text(0, 3) === "ID3") return "mp3"
  if (b[0] === 0xff && ((b[1] ?? 0) & 0xe0) === 0xe0) return "mp3" // MPEG frame sync
  return null
}

export type AudioInfo = { ok: true; duration?: number } | { ok: false }

/** Asks the browser to decode the header: catches truncated or corrupt files and gives the duration */
export function readAudioInfo(file: Blob): Promise<AudioInfo> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    let timer: ReturnType<typeof setTimeout> | undefined
    let settled = false

    const finish = (result: AudioInfo) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(result)
    }

    timer = setTimeout(() => finish({ ok: true }), 10_000) // slow device: don't block, the server validates anyway
    audio.preload = "metadata"
    audio.onloadedmetadata = () =>
      finish({
        ok: true,
        duration: Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : undefined,
      })
    audio.onerror = () => finish({ ok: false })
    audio.src = url
  })
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/** DEV ONLY: a short sine tone as a valid mono 16-bit WAV, for testing the player */
export function makeToneWav(seconds = 4, freq = 440, sampleRate = 22_050): Blob {
  const n = Math.floor(seconds * sampleRate)
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  const tag = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i))
  }

  tag(0, "RIFF")
  v.setUint32(4, 36 + n * 2, true)
  tag(8, "WAVE")
  tag(12, "fmt ")
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  tag(36, "data")
  v.setUint32(40, n * 2, true)

  const fade = Math.floor(sampleRate * 0.05)
  for (let i = 0; i < n; i++) {
    const envelope = Math.min(1, i / fade, (n - 1 - i) / fade)
    v.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.3 * envelope * 32767), true)
  }
  return new Blob([buf], { type: "audio/wav" })
}