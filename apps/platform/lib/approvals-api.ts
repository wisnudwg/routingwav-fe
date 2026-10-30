import {
  ACTION_INFO,
  ACTION_TYPES,
  canDecide,
  requesterKey,
  type ActionType,
  type Actor,
  type ApprovalRequest,
  type Delegation,
} from "./approvals"
import { approvalsStore } from "./approvals-store"
import { logEvent } from "./audit"
import {
  approvalDecided,
  approvalRequested,
  delegationChanged,
  withdrawalProcessed,
} from "./notify-events"
import { mockGrant } from "./mock-bridge"
import type { ApiResult, Owner } from "./team-api"
import { teamStore } from "./team-store"
import { executeWithdrawal } from "./wallet-api"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const byNewest = (a: ApprovalRequest, b: ApprovalRequest) => b.requestedAt.localeCompare(a.requestedAt)

/** A delegation only counts while its member exists and is active */
function effectiveDelegation(actor: Actor): Delegation | null {
  if (actor.kind !== "iam") return null
  const d = approvalsStore.delegationFor(actor.alias, actor.username)
  const m = teamStore.find(actor.alias, actor.username)
  return d && m && m.status === "active" ? d : null
}

export type ApprovalLists = {
  decidable: ApprovalRequest[] // pending, and this actor may decide
  mine: ApprovalRequest[] // this actor's own pending requests
  history: ApprovalRequest[] // decided, and this actor is involved
  delegation: Delegation | null
}

export async function loadApprovals(actor: Actor): Promise<ApprovalLists> {
  await sleep(200)
  const all = approvalsStore.requests(actor.alias).sort(byNewest)
  const delegation = effectiveDelegation(actor)
  const me = requesterKey(actor)

  const covered = (r: ApprovalRequest) =>
    !!delegation &&
    delegation.types.includes(r.type) &&
    (delegation.requesters === "all" || delegation.requesters.includes(r.requestedBy))
  const involved = (r: ApprovalRequest) =>
    actor.kind === "root" || r.requestedBy === me || r.decidedByLabel === actor.label || covered(r)

  return {
    decidable: all.filter((r) => canDecide(r, actor, delegation).ok),
    mine: all.filter((r) => r.status === "pending" && r.requestedBy === me),
    history: all.filter((r) => r.status !== "pending" && involved(r)),
    delegation,
  }
}

export async function decideRequest(
  actor: Actor,
  id: string,
  decision: "approved" | "rejected",
  note?: string
): Promise<ApiResult<ApprovalRequest>> {
  await sleep(450)
  const req = approvalsStore.request(actor.alias, id)
  if (!req) return { ok: false, message: "Permintaan tidak ditemukan." }

  const verdict = canDecide(req, actor, effectiveDelegation(actor))
  if (!verdict.ok) return { ok: false, message: verdict.reason }

  const base = {
    decidedByLabel: actor.label,
    decidedVia: verdict.via,
    decidedAt: new Date().toISOString(),
    note: note?.trim() || undefined,
  }

  let patch: Partial<ApprovalRequest>
  let failReason: string | undefined
  let processed: { fee: number; net: number; bankLabel: string } | null = null

  if (decision === "rejected") {
    patch = { ...base, status: "rejected" }
  } else {
    // Only withdrawals have an executor today. The others wait for the contract/proposal modules.
    if (req.type === "withdrawal") {
      const fee = Number(req.payload.fee)
      const exec = executeWithdrawal(
        actor.alias,
        String(req.payload.bankAccountId),
        req.amount ?? 0,
        Number.isFinite(fee) ? fee : undefined
      )
      if (exec.ok) processed = exec.data
      else failReason = exec.message
    }
    patch = { ...base, status: failReason ? "failed" : "approved", failReason }
  }

  const updated = approvalsStore.update(actor.alias, id, patch)
  if (!updated) return { ok: false, message: "Permintaan tidak ditemukan." }

  const via = verdict.via === "owner" ? "pemilik akun" : "delegasi"
  logEvent(
    actor.alias,
    actor.label,
    decision === "approved" ? "approval_approved" : "approval_rejected",
    `${ACTION_INFO[req.type].label}: ${req.summary} (pemohon ${req.requestedByLabel}, via ${via})${failReason ? ` · gagal: ${failReason}` : ""}`
  )

  const byKey = requesterKey(actor)
  approvalDecided(updated, byKey)
  if (processed) {
    // The requester already got the decision above, so this goes to the owner only
    withdrawalProcessed({ account: actor.alias, ...processed, by: byKey })
  }
  return { ok: true, data: updated }
}

export async function cancelRequest(actor: Actor, id: string): Promise<ApiResult> {
  await sleep(300)
  const req = approvalsStore.request(actor.alias, id)
  if (!req || req.requestedBy !== requesterKey(actor)) return { ok: false, message: "Permintaan tidak ditemukan." }
  if (req.status !== "pending") return { ok: false, message: "Permintaan sudah diputuskan." }

  approvalsStore.update(actor.alias, id, { status: "cancelled", decidedAt: new Date().toISOString() })
  logEvent(actor.alias, actor.label, "approval_cancelled", req.summary)
  return { ok: true, data: undefined }
}

/** DEV ONLY: the proposal and contract modules don't exist yet, so create sample requests */
export async function simulateRequest(actor: Actor, type: Exclude<ActionType, "withdrawal">): Promise<ApiResult> {
  await sleep(300)
  if (process.env.NODE_ENV === "production") return { ok: false, message: "Tidak tersedia." }
  if (actor.kind !== "iam") return { ok: false, message: "Pemilik akun tidak memerlukan persetujuan." }

  const summary =
    type === "accept_proposal"
      ? "Terima proposal “Mixing EP Bintang” dari Client Rina"
      : "Tandatangani kontrak #K-1021 (Mastering Album)"

  const req: ApprovalRequest = {
    id: crypto.randomUUID(),
    account: actor.alias,
    type,
    status: "pending",
    summary,
    payload: {},
    requestedBy: actor.username,
    requestedByLabel: actor.label,
    requestedAt: new Date().toISOString(),
  }
  approvalsStore.insert(req)
  logEvent(actor.alias, actor.label, "approval_requested", `${ACTION_INFO[type].label}: ${summary}`)
  approvalRequested(req)
  return { ok: true, data: undefined }
}

/* ---------- delegations (owner only) ---------- */

export type DelegationRow = Delegation & { displayName?: string; memberStatus: "active" | "disabled" }

export async function listDelegations(owner: Owner): Promise<DelegationRow[]> {
  await sleep(200)
  return approvalsStore.delegations(owner.alias).flatMap((d) => {
    const m = teamStore.find(owner.alias, d.username)
    return m ? [{ ...d, displayName: m.displayName, memberStatus: m.status }] : [] // orphans are hidden
  })
}

export async function saveDelegation(
  owner: Owner,
  actorLabel: string,
  input: { username: string; types: ActionType[]; requesters: "all" | string[] }
): Promise<ApiResult> {
  await sleep(400)
  const m = teamStore.find(owner.alias, input.username)
  if (!m || m.status !== "active") return { ok: false, message: "Anggota tidak ditemukan atau dinonaktifkan." }

  const types = ACTION_TYPES.filter((t) => input.types.includes(t))
  if (types.length === 0) return { ok: false, message: "Pilih minimal satu jenis tindakan." }

  let requesters: "all" | string[] = "all"
  if (input.requesters !== "all") {
    const valid = input.requesters.filter((u) => u !== m.username && teamStore.find(owner.alias, u))
    if (valid.length === 0) return { ok: false, message: "Pilih minimal satu anggota." }
    requesters = Array.from(new Set(valid))
  }

  approvalsStore.saveDelegation({
    id: approvalsStore.delegationFor(owner.alias, m.username)?.id ?? crypto.randomUUID(),
    account: owner.alias,
    username: m.username,
    types,
    requesters,
    createdAt: new Date().toISOString(),
  })
  // A delegate must be able to open the Approvals page
  teamStore.update(owner.alias, m.id, { permissions: mockGrant(m.permissions, "approvals:view") })

  logEvent(
    owner.alias,
    actorLabel,
    "delegation_saved",
    `${m.username}: ${types.map((t) => ACTION_INFO[t].label).join(", ")} · pemohon ${requesters === "all" ? "semua anggota" : requesters.join(", ")}`
  )
  delegationChanged(owner.alias, m.username, "saved")
  return { ok: true, data: undefined }
}

export async function removeDelegation(owner: Owner, actorLabel: string, username: string): Promise<ApiResult> {
  await sleep(300)
  if (!approvalsStore.removeDelegation(owner.alias, username)) {
    return { ok: false, message: "Delegasi tidak ditemukan." }
  }
  logEvent(owner.alias, actorLabel, "delegation_removed", username)
  delegationChanged(owner.alias, username, "removed")
  return { ok: true, data: undefined }
}