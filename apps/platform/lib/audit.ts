import { readJson, writeJson } from "./mock-db"

export type AuditAction =
  | "profile_updated"
  | "kyc_submitted"
  | "kyc_approved"
  | "kyc_rejected"
  | "identity_revealed"
  | "document_viewed"

export const AUDIT_LABEL: Record<AuditAction, string> = {
  profile_updated: "Data akun diperbarui",
  kyc_submitted: "Data identitas diajukan",
  kyc_approved: "Verifikasi identitas disetujui",
  kyc_rejected: "Verifikasi identitas ditolak",
  identity_revealed: "Nomor identitas ditampilkan",
  document_viewed: "Dokumen identitas dibuka",
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