"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Tersalin" : label}
    </button>
  )
}