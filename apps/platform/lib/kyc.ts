import { z } from "zod"

export const ACCOUNT_TYPES = ["individual", "business"] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_INFO: Record<AccountType, { title: string; desc: string }> = {
  individual: { title: "Perorangan", desc: "Verifikasi dengan KTP dan selfie. NPWP opsional." },
  business: {
    title: "Badan usaha",
    desc: "Verifikasi dengan NIB dan NPWP perusahaan, serta KTP penanggung jawab.",
  },
}

export const ENTITY_TYPES = [
  "PT", "CV", "Firma", "Koperasi", "Yayasan", "Usaha perorangan (UD)", "Lainnya",
] as const

/* ---------- status ---------- */

export type KycStatus = "not_started" | "in_review" | "verified" | "rejected"

export const STATUS_INFO: Record<
  KycStatus,
  { label: string; tone: "slate" | "amber" | "green" | "red"; description: string }
> = {
  not_started: {
    label: "Belum diverifikasi",
    tone: "slate",
    description: "Lengkapi data identitas untuk mengaktifkan transaksi dan penandatanganan kontrak.",
  },
  in_review: {
    label: "Sedang ditinjau",
    tone: "amber",
    description: "Data Anda sedang diperiksa. Kami akan memberi tahu Anda setelah selesai.",
  },
  verified: { label: "Terverifikasi", tone: "green", description: "Identitas Anda telah diverifikasi." },
  rejected: {
    label: "Ditolak",
    tone: "red",
    description: "Verifikasi tidak dapat diselesaikan. Perbarui data Anda lalu ajukan kembali.",
  },
}

/* ---------- identity numbers ---------- */

export type IdField = "nik" | "npwp" | "nib" | "repNik"

export const ID_LABEL: Record<IdField, string> = {
  nik: "NIK (KTP)",
  npwp: "NPWP",
  nib: "NIB",
  repNik: "NIK penanggung jawab",
}

export const digitsOnly = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max)

/** Structure check only. A provider confirms against the population registry. */
export function isPlausibleNik(nik: string) {
  if (!/^\d{16}$/.test(nik) || nik.startsWith("00")) return false
  const day = Number(nik.slice(6, 8)) // women: +40
  const month = Number(nik.slice(8, 10))
  const d = day > 40 ? day - 40 : day
  return d >= 1 && d <= 31 && month >= 1 && month <= 12
}

/** Shows only the last 4 digits, grouped: "•••• •••• •••• 3456" */
export function maskId(value: string) {
  const v = value.replace(/\D/g, "")
  if (v.length <= 4) return "•".repeat(v.length)
  return `${"•".repeat(v.length - 4)}${v.slice(-4)}`.replace(/(.{4})(?=.)/g, "$1 ")
}

export function formatId(field: IdField, value: string) {
  const v = value.replace(/\D/g, "")
  if (field === "npwp" && v.length === 15) {
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}.${v.slice(8, 9)}-${v.slice(9, 12)}.${v.slice(12, 15)}`
  }
  return v.replace(/(.{4})(?=.)/g, "$1 ")
}

/* ---------- documents ---------- */

export type DocKind = "ktp" | "selfie" | "npwp" | "nib" | "repKtp" | "deed"

export type DocSpec = {
  label: string
  hint: string
  accept: readonly string[]
  maxMB: number
}

const IMAGES = ["image/jpeg", "image/png", "image/webp"]
const IMAGES_PDF = [...IMAGES, "application/pdf"]

export const DOC_SPECS: Record<DocKind, DocSpec> = {
  ktp: { label: "Foto KTP", hint: "Semua teks terbaca, tanpa pantulan cahaya.", accept: IMAGES, maxMB: 5 },
  selfie: { label: "Selfie memegang KTP", hint: "Wajah dan KTP terlihat jelas dalam satu foto.", accept: IMAGES, maxMB: 5 },
  npwp: { label: "Kartu / bukti NPWP", hint: "Foto atau PDF yang terbaca jelas.", accept: IMAGES_PDF, maxMB: 5 },
  nib: { label: "Dokumen NIB (OSS)", hint: "Unduhan resmi dari OSS (PDF) atau fotonya.", accept: IMAGES_PDF, maxMB: 5 },
  repKtp: { label: "KTP penanggung jawab", hint: "Semua teks terbaca, tanpa pantulan cahaya.", accept: IMAGES, maxMB: 5 },
  deed: { label: "Akta pendirian / SK pengesahan", hint: "Jika ada, mempercepat peninjauan.", accept: IMAGES_PDF, maxMB: 10 },
}

export const DOCS_BY_TYPE: Record<AccountType, { kind: DocKind; required: boolean }[]> = {
  individual: [
    { kind: "ktp", required: true },
    { kind: "selfie", required: true },
    { kind: "npwp", required: false },
  ],
  business: [
    { kind: "nib", required: true },
    { kind: "npwp", required: true },
    { kind: "repKtp", required: true },
    { kind: "deed", required: false },
  ],
}

/** Client-side check for UX. The server re-checks type, size, and file signature. */
export function validateFile(file: File, kind: DocKind): string | null {
  const spec = DOC_SPECS[kind]
  if (file.size === 0) return "File kosong."
  if (!spec.accept.includes(file.type)) {
    const formats = spec.accept.map((m) => m.split("/")[1]).join(", ")
    return `Format tidak didukung. Gunakan: ${formats}.`
  }
  if (file.size > spec.maxMB * 1024 * 1024) return `Ukuran maksimal ${spec.maxMB} MB.`
  return null
}

export type DocMeta = { name: string; size: number; type: string; uploadedAt: string }

/* ---------- form ---------- */

export const kycSchema = z
  .object({
    type: z.enum(ACCOUNT_TYPES),
    fullName: z.string().trim(),
    nik: z.string(),
    npwp: z.string(),
    entityType: z.string(),
    legalName: z.string().trim(),
    nib: z.string(),
    repName: z.string().trim(),
    repNik: z.string(),
    consent: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const bad = (path: keyof typeof v, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message })

    if (!v.consent) bad("consent", "Anda harus menyetujui pemrosesan data identitas")

    if (v.type === "individual") {
      if (v.fullName.length < 2) bad("fullName", "Isi nama sesuai KTP")
      if (!isPlausibleNik(v.nik)) bad("nik", "NIK tidak valid (16 digit)")
      if (v.npwp && !/^\d{15,16}$/.test(v.npwp)) bad("npwp", "NPWP harus 15 atau 16 digit")
    } else {
      if (!(ENTITY_TYPES as readonly string[]).includes(v.entityType)) bad("entityType", "Pilih jenis badan usaha")
      if (v.legalName.length < 2) bad("legalName", "Isi nama badan usaha")
      if (!/^\d{13}$/.test(v.nib)) bad("nib", "NIB harus 13 digit")
      if (!/^\d{15,16}$/.test(v.npwp)) bad("npwp", "NPWP harus 15 atau 16 digit")
      if (v.repName.length < 2) bad("repName", "Isi nama penanggung jawab")
      if (!isPlausibleNik(v.repNik)) bad("repNik", "NIK tidak valid (16 digit)")
    }
  })
export type KycFormValues = z.infer<typeof kycSchema>

export const emptyKycForm = (): KycFormValues => ({
  type: "individual",
  fullName: "",
  nik: "",
  npwp: "",
  entityType: "",
  legalName: "",
  nib: "",
  repName: "",
  repNik: "",
  consent: false,
})

/** What the browser is allowed to know by default: names and masked numbers, never full numbers */
export type KycSummary = {
  status: KycStatus
  type?: AccountType
  submittedAt?: string
  decidedAt?: string
  rejectionReason?: string
  names: { fullName?: string; legalName?: string; entityType?: string; repName?: string }
  masked: Partial<Record<IdField, string>>
  docs: Partial<Record<DocKind, DocMeta>>
}