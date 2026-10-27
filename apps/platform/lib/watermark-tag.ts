export const WATERMARK_FIRST_AT = 4 // seconds
export const WATERMARK_EVERY = 20 // seconds

/** -1 before the first tag, then 0, 1, 2… */
export const tagIndexAt = (seconds: number) =>
  seconds < WATERMARK_FIRST_AT ? -1 : Math.floor((seconds - WATERMARK_FIRST_AT) / WATERMARK_EVERY)

export type Chime = { play: () => void; close: () => void }

/** Must be created from a user gesture (the play click), or the browser keeps it muted */
export function createChime(): Chime | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  const ctx = new Ctor()

  return {
    play() {
      if (ctx.state === "suspended") void ctx.resume()
      const t0 = ctx.currentTime
      ;[880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = t0 + i * 0.16
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14)
        osc.connect(gain).connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.16)
      })
    },
    close() {
      void ctx.close()
    },
  }
}