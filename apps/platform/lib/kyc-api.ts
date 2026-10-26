import { logEvent } from "./audit"
import {
  DOCS_BY_TYPE,
  DOC_SPECS,
  ID_LABEL,
  kycSchema,
  maskId,
  type AccountType,
  type DocKind,
  type DocMeta,
  type IdField,
  type KycFormValues,
  type KycStatus,
  type KycSummary,
} from "./kyc"
import { readJson, writeJson } from "./mock-db"
import type { ApiResult } from "./team-api"
import { kycDecided } from "./notify-events"

// DEV ONLY. This stores full identity numbers in localStorage so the UI can be exercised.
// A real backend stores them encrypted, returns them only via the reveal endpoint, and
// never to the browser otherwise.

const KEY = "mock:kyc:v1"
export const KYC_EVENT = "kyc-change"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const NOT_AVAILABLE = "Verifikasi identitas belum tersedia."
const isProd = () => process.env.NODE_ENV === "production"

type Stored = {
  status: KycStatus
  type: AccountType
  data: Omit<KycFormValues, "consent" | "type">
  docs: Partial<Record<DocKind, DocMeta>>
  submittedAt: string
  decidedAt?: string
  rejectionReason?: string
}
type Db = Record<string, Stored>

const read = () => readJson<Db>(KEY, {})

function save(alias: string, rec: Stored) {
  const db = read()
  db[alias] = rec
  writeJson(KEY, db)
  window.dispatchEvent(new Event(KYC_EVENT))
}

function summarize(rec: Stored | undefined): KycSummary {
  if (!rec) return { status: "not_started", names: {}, masked: {}, docs: {} }
  const d = rec.data
  const fields: IdField[] = rec.type === "business" ? ["nib", "npwp", "repNik"] : ["nik", "npwp"]
  const masked: Partial<Record<IdField, string>> = {}
  for (const f of fields) if (d[f]) masked[f] = maskId(d[f])

  return {
    status: rec.status,
    type: rec.type,
    submittedAt: rec.submittedAt,
    decidedAt: rec.decidedAt,
    rejectionReason: rec.rejectionReason,
    names: {
      fullName: d.fullName || undefined,
      legalName: d.legalName || undefined,
      entityType: d.entityType || undefined,
      repName: d.repName || undefined,
    },
    masked,
    docs: rec.docs,
  }
}

export async function getKycSummary(alias: string): Promise<KycSummary> {
  await sleep(200)
  return summarize(read()[alias])
}

/** Safe for everyone in the account, including team members: status only */
export async function getKycStatus(alias: string): Promise<KycStatus> {
  await sleep(100)
  return read()[alias]?.status ?? "not_started"
}

export async function submitKyc(
  alias: string,
  actor: string,
  input: { values: KycFormValues; docs: Partial<Record<DocKind, DocMeta>> }
): Promise<ApiResult> {
  await sleep(600)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }

  const parsed = kycSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, message: "Data tidak valid. Periksa kembali isian Anda." }
  const v = parsed.data

  const prev = read()[alias]
  if (prev?.status === "in_review") {
    return { ok: false, message: "Pengajuan sebelumnya masih ditinjau." }
  }

  const docs: Partial<Record<DocKind, DocMeta>> = {}
  for (const { kind, required } of DOCS_BY_TYPE[v.type]) {
    const meta = input.docs[kind]
    if (meta) docs[kind] = meta
    else if (required) return { ok: false, message: `${DOC_SPECS[kind].label} wajib diunggah.` }
  }

  const data: Stored["data"] =
    v.type === "individual"
      ? { fullName: v.fullName, nik: v.nik, npwp: v.npwp, entityType: "", legalName: "", nib: "", repName: "", repNik: "" }
      : { fullName: "", nik: "", npwp: v.npwp, entityType: v.entityType, legalName: v.legalName, nib: v.nib, repName: v.repName, repNik: v.repNik }

  // A real server keeps the previous verified record in force until the new one passes review.
  save(alias, { status: "in_review", type: v.type, data, docs, submittedAt: new Date().toISOString() })
  logEvent(alias, actor, "kyc_submitted", v.type === "business" ? "Badan usaha" : "Perorangan")
  return { ok: true, data: undefined }
}

/** Step-up check before showing sensitive data. The mock accepts any non-empty password. */
export async function stepUp(password: string): Promise<boolean> {
  await sleep(300)
  return password.length > 0
}

export async function revealIdentity(
  alias: string,
  actor: string,
  field: IdField
): Promise<ApiResult<string>> {
  await sleep(250)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }
  // A real server also checks the caller's identity:reveal permission and rate-limits this.
  const value = read()[alias]?.data[field]
  if (!value) return { ok: false, message: "Data tidak ditemukan." }
  logEvent(alias, actor, "identity_revealed", ID_LABEL[field]) // logs the field, never the value
  return { ok: true, data: value }
}

export async function openDocument(
  alias: string,
  actor: string,
  kind: DocKind
): Promise<ApiResult<DocMeta>> {
  await sleep(250)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }
  const meta = read()[alias]?.docs[kind]
  if (!meta) return { ok: false, message: "Dokumen tidak ditemukan." }
  logEvent(alias, actor, "document_viewed", DOC_SPECS[kind].label)
  return { ok: true, data: meta }
}

/** DEV ONLY: stands in for the verification provider's result */
export async function simulateDecision(
  alias: string,
  decision: "verified" | "rejected"
): Promise<ApiResult> {
  await sleep(400)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }
  const rec = read()[alias]
  if (!rec || rec.status !== "in_review") return { ok: false, message: "Tidak ada pengajuan yang ditinjau." }

  const decidedAt = new Date().toISOString()
  save(
    alias,
    decision === "verified"
      ? { ...rec, status: "verified", decidedAt, rejectionReason: undefined }
      : { ...rec, status: "rejected", decidedAt, rejectionReason: "Foto dokumen tidak terbaca jelas. Unggah ulang dengan pencahayaan yang lebih baik." }
  )
  logEvent(alias, "Sistem verifikasi (simulasi)", decision === "verified" ? "kyc_approved" : "kyc_rejected")
  kycDecided(alias, decision)
  return { ok: true, data: undefined }
}