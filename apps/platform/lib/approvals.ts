export const ACTION_TYPES = ["withdrawal", "accept_proposal", "sign_contract"] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const ACTION_INFO: Record<ActionType, { label: string; description: string }> = {
  withdrawal: { label: "Penarikan saldo", description: "Mencairkan saldo Wallet ke rekening bank." },
  accept_proposal: { label: "Menerima proposal", description: "Menerima proposal kerja yang masuk." },
  sign_contract: { label: "Menandatangani kontrak", description: "Menandatangani kontrak atas nama akun." },
}

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled" | "failed"

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  failed: "Gagal diproses",
}

export type ApprovalRequest = {
  id: string
  account: string
  type: ActionType
  status: RequestStatus
  summary: string
  amount?: number
  payload: Record<string, string | number>
  /** "owner", or the member's username */
  requestedBy: string
  requestedByLabel: string
  requestedAt: string
  decidedByLabel?: string
  decidedVia?: "owner" | "delegation"
  decidedAt?: string
  note?: string
  failReason?: string
}

/** A standing grant: this member may approve these action types, for these requesters, any amount */
export type Delegation = {
  id: string
  account: string
  username: string
  types: ActionType[]
  requesters: "all" | string[]
  createdAt: string
}

export type Actor =
  | { kind: "root"; alias: string; label: string }
  | { kind: "iam"; alias: string; username: string; label: string }

export const requesterKey = (a: Actor) => (a.kind === "root" ? "owner" : a.username)

export type Decision = { ok: true; via: "owner" | "delegation" } | { ok: false; reason: string }

export function canDecide(req: ApprovalRequest, actor: Actor, delegation: Delegation | null): Decision {
  if (req.account !== actor.alias) return { ok: false, reason: "Bukan permintaan akun Anda." }
  if (req.status !== "pending") return { ok: false, reason: "Permintaan sudah diputuskan." }
  if (actor.kind === "root") return { ok: true, via: "owner" }

  if (req.requestedBy === actor.username) {
    return { ok: false, reason: "Anda tidak bisa memutuskan permintaan Anda sendiri." }
  }
  if (!delegation || delegation.username !== actor.username) {
    return { ok: false, reason: "Anda tidak memiliki delegasi persetujuan." }
  }
  if (!delegation.types.includes(req.type)) {
    return { ok: false, reason: "Delegasi Anda tidak mencakup jenis tindakan ini." }
  }
  if (delegation.requesters !== "all" && !delegation.requesters.includes(req.requestedBy)) {
    return { ok: false, reason: "Delegasi Anda tidak mencakup pemohon ini." }
  }
  return { ok: true, via: "delegation" }
}