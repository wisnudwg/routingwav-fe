"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import type { Actor } from "@/lib/approvals"
import { devIncoming, devStartConversation } from "@/lib/messages-api"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"
import { useActiveMode } from "@/lib/use-active-mode"

function Inner({ actor, latestId }: { actor: Actor; latestId?: string }) {
  const router = useRouter()
  const mode = useActiveMode()
  const [name, setName] = useState("Rina Pratiwi")
  const [subject, setSubject] = useState("Mixing EP Bintang")
  const [kind, setKind] = useState<ProfileKind | null>(null)
  const [busy, setBusy] = useState(false)

  const ourKind: ProfileKind = kind ?? mode ?? "talent"

  async function start() {
    setBusy(true)
    const res = await devStartConversation(actor, { name, subject, ourKind })
    setBusy(false)
    if (res.ok) router.push(`/messages/${res.data.id}`)
  }

  return (
    <div className="space-y-2 border-t border-dashed bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500">Dev: simulasi percakapan</p>
      <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama lawan bicara" className="h-8 bg-white" />
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subjek" className="h-8 bg-white" />
      <label className="flex items-center gap-2 text-xs text-slate-600">
        Saya sebagai
        <select
          value={ourKind}
          onChange={(e) => setKind(e.target.value as ProfileKind)}
          className="h-8 rounded-md border border-input bg-white px-2 text-xs"
        >
          {PROFILE_KINDS.map((k) => (
            <option key={k} value={k}>{KIND_INFO[k].title}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={start} disabled={busy}>Mulai percakapan</Button>
        <Button size="sm" variant="outline" disabled={!latestId} onClick={() => latestId && devIncoming(actor, latestId, "text")}>
          Pesan masuk di percakapan teratas
        </Button>
      </div>
    </div>
  )
}

export function DevConversationTools(props: { actor: Actor; latestId?: string }) {
  if (process.env.NODE_ENV === "production") return null
  return <Inner {...props} />
}