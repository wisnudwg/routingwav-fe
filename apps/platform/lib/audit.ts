import { readJson, writeJson } from "./mock-db"

export type AuditAction =
  | "profile_updated" | "kyc_submitted" | "kyc_approved" | "kyc_rejected"
  | "identity_revealed" | "document_viewed"
  | "bank_added" | "bank_removed" | "bank_revealed"
  | "withdrawal_requested" | "withdrawal_executed"
  | "approval_requested" | "approval_approved" | "approval_rejected" | "approval_cancelled"
  | "delegation_saved" | "delegation_removed"
  | "representative_set" | "representative_revoked"
  | "member_email_set" | "member_email_removed" | "member_email_verified"

export const AUDIT_LABEL: Record<AuditAction, string> = {
  profile_updated: "Data akun diperbarui",
  kyc_submitted: "Data identitas diajukan",
  kyc_approved: "Verifikasi identitas disetujui",
  kyc_rejected: "Verifikasi identitas ditolak",
  identity_revealed: "Nomor identitas ditampilkan",
  document_viewed: "Dokumen identitas dibuka",
  bank_added: "Rekening bank ditambahkan",
  bank_removed: "Rekening bank dihapus",
  bank_revealed: "Nomor rekening ditampilkan",
  withdrawal_requested: "Penarikan saldo diajukan",
  withdrawal_executed: "Penarikan saldo diproses",
  approval_requested: "Permintaan persetujuan dibuat",
  approval_approved: "Permintaan disetujui",
  approval_rejected: "Permintaan ditolak",
  approval_cancelled: "Permintaan dibatalkan",
  delegation_saved: "Delegasi persetujuan disimpan",
  delegation_removed: "Delegasi persetujuan dicabut",
  representative_set: "Perwakilan ditunjuk",
  representative_revoked: "Penunjukan perwakilan dicabut",
  member_email_set: "Email anggota ditambahkan",
  member_email_removed: "Email anggota dihapus",
  member_email_verified: "Email anggota diverifikasi",
}

export type AuditEvent = {
  id: string
  at: string
  alias: string
  actor: string
  action: AuditAction
  detail?: string
}

const KEY = "mock:audit:v1"

export function logEvent(alias: string, actor: string, action: AuditAction, detail?: string) {
  const all = readJson<AuditEvent[]>(KEY, [])
  all.push({ id: crypto.randomUUID(), at: new Date().toISOString(), alias, actor, action, detail })
  writeJson(KEY, all.slice(-500))
}

export async function fetchEvents(alias: string): Promise<AuditEvent[]> {
  await new Promise((r) => setTimeout(r, 150))
  return readJson<AuditEvent[]>(KEY, [])
    .filter((e) => e.alias === alias)
    .sort((a, b) => b.at.localeCompare(a.at))
}