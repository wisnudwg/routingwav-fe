import { api, ApiError, toFail, type Fail } from "./api"
import type { AccountType, DocKind, IdField, KycFormValues, KycStatus, KycSummary } from "./kyc"

export const KYC_EVENT = "kyc-change"
const emit = () => window.dispatchEvent(new Event(KYC_EVENT))

type ApiSummary = {
  status: KycStatus
  updatePending: boolean
  updateRejection: { reason: string; at: string } | null
  type: AccountType | null
  submittedAt: string | null
  decidedAt: string | null
  rejectionReason: string | null
  reference: string | null
  names: { fullName: string | null; legalName: string | null; entityType: string | null; repName: string | null }
  masked: Record<string, string>
  docs: { id: string; kind: DocKind; name: string; size: number; contentType: string; uploadedAt: string }[]
  action: { type: "redirect"; url: string; expiresAt: string } | null
}

const EMPTY: KycSummary = { status: "not_started", names: {}, masked: {}, docs: {} }

function toSummary(s: ApiSummary): KycSummary {
  return {
    status: s.status,
    type: s.type ?? undefined,
    submittedAt: s.submittedAt ?? undefined,
    decidedAt: s.decidedAt ?? undefined,
    rejectionReason: s.rejectionReason ?? undefined,
    updatePending: s.updatePending,
    updateRejection: s.updateRejection ?? undefined,
    reference: s.reference ?? undefined,
    action: s.action ? { url: s.action.url, expiresAt: s.action.expiresAt } : undefined,
    names: {
      fullName: s.names.fullName ?? undefined,
      legalName: s.names.legalName ?? undefined,
      entityType: s.names.entityType ?? undefined,
      repName: s.names.repName ?? undefined,
    },
    masked: s.masked as KycSummary["masked"],
    docs: Object.fromEntries(
      s.docs.map((d) => [d.kind, { id: d.id, name: d.name, size: d.size, type: d.contentType, uploadedAt: d.uploadedAt }]),
    ),
  }
}

export async function loadKycSummary(): Promise<{ ok: true; summary: KycSummary } | Fail> {
  try {
    return { ok: true, summary: toSummary(await api<ApiSummary>("/kyc")) }
  } catch (e) {
    return toFail(e)
  }
}

/** For modules that only need the data and treat "unknown" like "not verified". The server derives the account. */
export async function getKycSummary(_alias?: string): Promise<KycSummary> {
  const r = await loadKycSummary()
  return r.ok ? r.summary : EMPTY
}

/** Works for team members too. null = unknown (offline or error). */
export async function getKycStatus(_alias?: string): Promise<KycStatus | null> {
  try {
    return (await api<{ status: KycStatus }>("/kyc/status")).status
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ submit */

type UploadSlot = { documentId: string; url: string; fields: Record<string, string>; maxBytes: number }
const uploaded = new WeakMap<File, string>() // a retry after a failed submit doesn't upload the same file twice

async function uploadFile(kind: DocKind, file: File): Promise<string> {
  const known = uploaded.get(file)
  if (known) return known

  const slot = await api<UploadSlot>("/kyc/documents", {
    method: "POST",
    json: { kind, contentType: file.type, size: file.size, filename: file.name },
  })

  const form = new FormData()
  for (const [k, v] of Object.entries(slot.fields)) form.append(k, v)
  form.append("file", file) // must come last

  let res: Response
  try {
    res = await fetch(slot.url, { method: "POST", body: form })
  } catch {
    throw new ApiError(0, "NETWORK", "Gagal mengunggah dokumen. Periksa koneksi Anda.")
  }
  if (!res.ok) throw new ApiError(res.status, "UPLOAD_FAILED", "Gagal mengunggah dokumen. Coba lagi.")

  await api(`/kyc/documents/${slot.documentId}/complete`, { method: "POST" })
  uploaded.set(file, slot.documentId)
  return slot.documentId
}

export async function submitKyc(
  values: KycFormValues,
  files: Partial<Record<DocKind, File>>,
): Promise<{ ok: true } | Fail> {
  try {
    const documents: Record<string, string> = {}
    for (const [kind, file] of Object.entries(files) as [DocKind, File | undefined][]) {
      if (file) documents[kind] = await uploadFile(kind, file)
    }

    const body =
      values.type === "individual"
        ? { type: "individual", fullName: values.fullName, nik: values.nik, npwp: values.npwp || undefined, consent: true, documents }
        : {
            type: "business",
            entityType: values.entityType,
            legalName: values.legalName,
            nib: values.nib,
            npwp: values.npwp,
            repName: values.repName,
            repNik: values.repNik,
            consent: true,
            documents,
          }

    await api("/kyc/submissions", { method: "POST", json: body })
    emit()
    return { ok: true }
  } catch (e) {
    return toFail(e)
  }
}

/* --------------------------------------------------- sensitive reads (owner) */

export async function stepUp(password: string): Promise<{ ok: true } | Fail> {
  try {
    await api("/auth/step-up", { method: "POST", json: { password } })
    return { ok: true }
  } catch (e) {
    return toFail(e)
  }
}

/** Throws ApiError. A STEP_UP_REQUIRED code means: ask for the password, then retry. */
export async function revealIdentity(field: IdField): Promise<string> {
  return (await api<{ value: string }>("/kyc/reveal", { method: "POST", json: { field } })).value
}

export async function viewDocument(id: string): Promise<{ url: string; contentType: string; expiresInSeconds: number }> {
  return api(`/kyc/documents/${id}/view`, { method: "POST" })
}

/** DEV ONLY: the mock provider's verdict, delivered through the real signed-webhook path */
export async function simulateDecision(decision: "verified" | "rejected"): Promise<{ ok: true } | Fail> {
  try {
    await api("/dev/kyc/decide", { method: "POST", json: { decision } })
    emit()
    return { ok: true }
  } catch (e) {
    return toFail(e)
  }
}