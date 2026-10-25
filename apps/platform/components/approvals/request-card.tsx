"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { ServerError } from "@/components/auth/server-error"
import {
  ACTION_INFO,
  STATUS_LABEL,
  type Actor,
  type ApprovalRequest,
  type RequestStatus,
} from "@/lib/approvals"
import { cancelRequest, decideRequest } from "@/lib/approvals-api"
import { formatDateTime, formatIDR } from "@/lib/format"

const TONE: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-800",
}

export function RequestCard({
  req,
  actor,
  mode,
}: {
  req: ApprovalRequest
  actor: Actor
  mode: "decide" | "mine" | "history"
}) {
  const [confirm, setConfirm] = useState<"approved" | "rejected" | "cancel" | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (!confirm) return
    setBusy(true)
    setError(null)
    const res =
      confirm === "cancel"
        ? await cancelRequest(actor, req.id)
        : await decideRequest(actor, req.id, confirm, note)
    setBusy(false)
    if (!res.ok) setError(res.message) // on success the store event reloads the list
  }

  return (
    <li className="space-y-3 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">{ACTION_INFO[req.type].label}</p>
          <p className="text-sm font-medium text-slate-900">{req.summary}</p>
          {req.amount !== undefined && <p className="text-lg font-bold text-slate-900">{formatIDR(req.amount)}</p>}
          <p className="text-xs text-slate-500">
            Diajukan {req.requestedByLabel} · {formatDateTime(req.requestedAt)}
          </p>
        </div>
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", TONE[req.status])}>
          {STATUS_LABEL[req.status]}
        </span>
      </div>

      {req.decidedByLabel && (
        <p className="text-xs text-slate-600">
          Diputuskan {req.decidedByLabel}
          {req.decidedVia === "delegation" ? " (delegasi)" : req.decidedVia === "owner" ? " (pemilik akun)" : ""}
          {req.decidedAt && ` · ${formatDateTime(req.decidedAt)}`}
          {req.note && ` · “${req.note}”`}
        </p>
      )}
      {req.failReason && <p className="text-xs text-red-700">Gagal diproses: {req.failReason}</p>}

      {mode !== "history" && !confirm && (
        <div className="flex flex-wrap gap-2">
          {mode === "decide" ? (
            <>
              <Button size="sm" onClick={() => setConfirm("approved")}>Setujui</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("rejected")}>Tolak</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirm("cancel")}>Batalkan permintaan</Button>
          )}
        </div>
      )}

      {confirm && (
        <div className="space-y-3 rounded-md bg-slate-50 p-3">
          {confirm !== "cancel" && (
            <Input
              placeholder={confirm === "rejected" ? "Alasan penolakan (opsional)" : "Catatan (opsional)"}
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              className="bg-white"
            />
          )}
          <p className="text-xs text-slate-600">
            {confirm === "approved" && "Menyetujui akan langsung menjalankan tindakan ini."}
            {confirm === "rejected" && "Permintaan akan ditolak dan dana yang ditahan dikembalikan."}
            {confirm === "cancel" && "Permintaan akan dibatalkan."}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={confirm === "approved" ? "default" : "destructive"} disabled={busy} onClick={run}>
              {confirm === "approved" ? "Ya, setujui" : confirm === "rejected" ? "Ya, tolak" : "Ya, batalkan"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Kembali</Button>
          </div>
        </div>
      )}

      <ServerError message={error} />
    </li>
  )
}