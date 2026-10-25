"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { NoOwner } from "@/components/team/team-view"
import { useSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"
import { STATUS_INFO, type KycSummary } from "@/lib/kyc"
import { getKycSummary, KYC_EVENT, simulateDecision } from "@/lib/kyc-api"
import { IdentitySummary } from "./identity-summary"
import { KycForm } from "./kyc-form"
import { StatusBadge } from "./status-badge"

export function VerificationView() {
  const session = useSession()
  const root = session?.type === "root" ? session : null
  const alias = root?.alias

  const [summary, setSummary] = useState<KycSummary | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!alias) return
    let cancelled = false
    const load = () =>
      getKycSummary(alias).then((s) => {
        if (!cancelled) setSummary(s)
      })
    load()
    window.addEventListener(KYC_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(KYC_EVENT, load)
    }
  }, [alias])

  if (session === undefined) return null
  if (!root || !alias) return <NoOwner />
  if (!summary) return <p className="text-sm text-slate-500">Memuat…</p>

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
        {summary.submittedAt && (
          <p className="mt-2 text-xs text-slate-500">
            Diajukan {formatDateTime(summary.submittedAt)}
            {summary.decidedAt && ` · Diputuskan ${formatDateTime(summary.decidedAt)}`}
          </p>
        )}
      </section>

      {showForm ? (
        <KycForm
          alias={alias}
          actor={root.email}
          initial={summary}
          onSubmitted={() => setEditing(false)}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <IdentitySummary summary={summary} alias={alias} actor={root.email} />

          {status === "verified" && (
            <div className="space-y-1">
              <Button variant="outline" onClick={() => setEditing(true)}>Perbarui data</Button>
              <p className="text-xs text-slate-500">
                Perubahan akan ditinjau ulang. Di sistem sungguhan, status terverifikasi Anda tetap
                berlaku sampai data baru disetujui.
              </p>
            </div>
          )}

          {process.env.NODE_ENV !== "production" && status === "in_review" && (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-xs text-slate-600">Dev: simulasikan hasil tinjauan</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => simulateDecision(alias, "verified")}>Setujui</Button>
                <Button size="sm" variant="outline" onClick={() => simulateDecision(alias, "rejected")}>Tolak</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}