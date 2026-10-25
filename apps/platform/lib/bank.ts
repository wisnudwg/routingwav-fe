import { z } from "zod"

export const BANKS = [
  { id: "bca", name: "BCA" },
  { id: "mandiri", name: "Bank Mandiri" },
  { id: "bni", name: "BNI" },
  { id: "bri", name: "BRI" },
  { id: "bsi", name: "BSI" },
  { id: "cimb", name: "CIMB Niaga" },
  { id: "permata", name: "PermataBank" },
  { id: "danamon", name: "Danamon" },
  { id: "btn", name: "BTN" },
  { id: "jago", name: "Bank Jago" },
  { id: "seabank", name: "SeaBank" },
  { id: "jenius", name: "Jenius (BTPN)" },
  { id: "ocbc", name: "OCBC" },
] as const

export type BankSummary = {
  id: string
  bankId: string
  bankName: string
  holderName: string
  masked: string
  createdAt: string
}

/** "•••• 7890" */
export const maskBank = (n: string) => `•••• ${n.slice(-4)}`

/** For comparing a holder name to the verified name: case, punctuation, and accents ignored */
export const normalizeHolder = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

export const addBankSchema = z.object({
  bankId: z.string().min(1, "Pilih bank"),
  number: z.string().regex(/^\d{6,20}$/, "Nomor rekening 6–20 digit"),
  holderName: z.string().trim().min(2, "Isi nama pemilik rekening"),
  confirm: z.boolean().refine((v) => v === true, "Anda harus menyatakan rekening ini atas nama Anda"),
})
export type AddBankValues = z.infer<typeof addBankSchema>