"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { NoOwner } from "@/components/team/team-view"
import { useSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"
import { STATUS_INFO, type KycSummary } from "@/lib/kyc"
import { KYC_EVENT, loadKycSummary, simulateDecision } from "@/lib/kyc-api"
import { IdentitySummary } from "./identity-summary"
import { KycForm } from "./kyc-form"
import { StatusBadge } from "./status-badge"

type State = { summary: KycSummary } | { error: string } | null

const safeHttps = (url: string) => {
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

export function VerificationView() {
  const session = useSession()
  const isOwner = session?.type === "root"
  const [state, setState] = useState<State>(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    const r = await loadKycSummary()
    setState(r.ok ? { summary: r.summary } : { error: r.message })
  }, [])

  useEffect(() => {
    if (!isOwner) return
    const onVisible = () => {
      if (document.visibilityState === "visible") void load()
    }
    void load()
    window.addEventListener(KYC_EVENT, load)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener(KYC_EVENT, load)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [isOwner, load])

  // The provider's verdict arrives by webhook, so keep checking while a review is open
  const waiting = !!state && "summary" in state && (state.summary.status === "in_review" || !!state.summary.updatePending)
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(() => void load(), 10_000)
    return () => clearInterval(t)
  }, [waiting, load])

  if (session === undefined) return null
  if (!isOwner) return <NoOwner />
  if (!state) return <p className="text-sm text-slate-500">Memuat…</p>
  if ("error" in state) return <p role="alert" className="text-sm text-destructive">{state.error}</p>

  const { summary } = state
  const { status } = summary
  const info = STATUS_INFO[status]
  const showForm = status === "not_started" || status === "rejected" || editing

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-medium text-slate-900">Status verifikasi</h2>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">{info.description}</p>

        {status === "rejected" && summary.rejectionReason && (
          <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {summary.rejectionReason}
          </p>
        )}
        {summary.updatePending && (
          <p role="status" className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Pembaruan data Anda sedang ditinjau. Status terverifikasi tetap berlaku sampai pembaruan disetujui.
          </p>
        )}
        {summary.updateRejection && (
          <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            Pembaruan terakhir ditolak: {summary.updateRejection.reason} Data terverifikasi Anda sebelumnya tetap berlaku.
          </p>
        )}
        {summary.action && safeHttps(summary.action.url) && (
          <div className="mt-3">
            <Button size="sm" onClick={() => window.open(summary.action?.url, "_blank", "noopener,noreferrer")}>
              Lanjutkan verifikasi wajah
            </Button>
            <p className="mt-1 text-xs text-slate-500">Satu langkah lagi dilakukan di halaman penyedia verifikasi.</p>
          </div>
        )}

        {summary.submittedAt && (
          <p className="mt-2 text-xs text-slate-500">
            Diajukan {formatDateTime(summary.submittedAt)}
            {summary.decidedAt && ` · Diputuskan ${formatDateTime(summary.decidedAt)}`}
            {summary.reference && ` · Kode referensi ${summary.reference}`}
          </p>
        )}
      </section>

      {showForm ? (
        <KycForm
          initial={summary}
          onSubmitted={() => {
            setEditing(false)
            void load()
          }}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <IdentitySummary summary={summary} />

          {status === "verified" && !summary.updatePending && (
            <div className="space-y-1">
              <Button variant="outline" onClick={() => setEditing(true)}>Perbarui data</Button>
              <p className="text-xs text-slate-500">
                Perubahan akan ditinjau ulang. Status terverifikasi Anda tetap berlaku sampai data baru disetujui.
              </p>
            </div>
          )}

          {process.env.NODE_ENV !== "production" && status === "in_review" && !summary.updatePending && (
            <DevDecision onDone={load} />
          )}
          {process.env.NODE_ENV !== "production" && summary.updatePending && <DevDecision onDone={load} />}
        </>
      )}
    </div>
  )
}

function DevDecision({ onDone }: { onDone: () => Promise<void> }) {
  const [msg, setMsg] = useState<string | null>(null)
  async function decide(d: "verified" | "rejected") {
    const r = await simulateDecision(d)
    setMsg(r.ok ? null : r.message)
    await onDone()
  }
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <p className="text-xs text-slate-600">Dev: kirim hasil dari penyedia verifikasi (webhook bertanda tangan)</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide("verified")}>Setujui</Button>
        <Button size="sm" variant="outline" onClick={() => decide("rejected")}>Tolak</Button>
      </div>
      {msg && <p role="alert" className="text-xs text-destructive">{msg}</p>}
    </div>
  )
}