"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { ACTION_INFO, type ActionType } from "@/lib/approvals"
import { loadApprovals, simulateRequest, type ApprovalLists } from "@/lib/approvals-api"
import { APPROVALS_EVENT } from "@/lib/approvals-store"
import { useActor } from "@/lib/use-actor"
import { RequestCard } from "./request-card"

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl text-slate-900">{title}</h2>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <ul className="space-y-3">{children}</ul>
    </section>
  )
}

export function ApprovalsView() {
  const actor = useActor()
  const [lists, setLists] = useState<ApprovalLists | null>(null)

  useEffect(() => {
    if (!actor) return
    let cancelled = false
    const load = () =>
      loadApprovals(actor).then((l) => {
        if (!cancelled) setLists(l)
      })
    void load()
    window.addEventListener(APPROVALS_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(APPROVALS_EVENT, load)
    }
  }, [actor])

  if (!actor) return null
  if (!lists) return <p className="text-sm text-slate-500">Memuat…</p>

  const { decidable, mine, history, delegation } = lists
  const empty = decidable.length + mine.length + history.length === 0
  const samples: Exclude<ActionType, "withdrawal">[] = ["accept_proposal", "sign_contract"]

  return (
    <div className="space-y-8">
      {actor.kind === "iam" && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {delegation
            ? `Anda memiliki delegasi untuk: ${delegation.types.map((t) => ACTION_INFO[t].label).join(", ")}, dari ${
                delegation.requesters === "all" ? "semua anggota" : delegation.requesters.join(", ")
              }. Anda tidak bisa memutuskan permintaan Anda sendiri.`
            : "Tindakan sensitif Anda memerlukan persetujuan pemilik akun. Status permintaan Anda tampil di sini."}
        </p>
      )}

      {decidable.length > 0 && (
        <Section title="Menunggu keputusan Anda">
          {decidable.map((r) => <RequestCard key={r.id} req={r} actor={actor} mode="decide" />)}
        </Section>
      )}

      {mine.length > 0 && (
        <Section title="Permintaan saya" hint="Menunggu keputusan.">
          {mine.map((r) => <RequestCard key={r.id} req={r} actor={actor} mode="mine" />)}
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Riwayat">
          {history.map((r) => <RequestCard key={r.id} req={r} actor={actor} mode="history" />)}
        </Section>
      )}

      {empty && (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-slate-600">
          Belum ada permintaan persetujuan.
        </div>
      )}

      {process.env.NODE_ENV !== "production" && actor.kind === "iam" && (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <p className="text-xs text-slate-600">Dev: modul proposal &amp; kontrak belum ada. Buat permintaan contoh:</p>
          <div className="flex flex-wrap gap-2">
            {samples.map((t) => (
              <Button key={t} size="sm" variant="outline" onClick={() => simulateRequest(actor, t)}>
                {ACTION_INFO[t].label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}