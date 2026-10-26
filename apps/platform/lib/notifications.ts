export const CATEGORIES = ["finance", "approvals", "deals", "messages", "account"] as const
export type Category = (typeof CATEGORIES)[number]
export type Channel = "push" | "email"

export type CategoryInfo = {
  label: string
  description: string
  /** Security-critical: push and email can't be turned off */
  locked?: boolean
  defaults: Record<Channel, boolean>
}

export const CATEGORY_INFO: Record<Category, CategoryInfo> = {
  finance: {
    label: "Keuangan",
    description: "Penarikan saldo diproses dan dana terkirim, serta pembayaran masuk.",
    defaults: { push: true, email: true },
  },
  approvals: {
    label: "Persetujuan",
    description: "Permintaan yang menunggu keputusan Anda, dan hasil permintaan Anda.",
    defaults: { push: true, email: true },
  },
  deals: {
    label: "Proposal & kontrak",
    description: "Proposal masuk, negosiasi, dan kontrak yang perlu ditandatangani.",
    defaults: { push: true, email: true },
  },
  messages: {
    label: "Pesan",
    description: "Pesan dan file audio baru.",
    defaults: { push: true, email: false },
  },
  account: {
    label: "Akun & keamanan",
    description:
      "Perubahan rekening bank, delegasi, perwakilan, dan hasil verifikasi identitas. Tidak bisa dimatikan demi keamanan akun.",
    locked: true,
    defaults: { push: true, email: true },
  },
}

export type Prefs = Record<Category, Record<Channel, boolean>>

/** Applies defaults and the locks. Also what a server must run on anything a client sends. */
export function resolvePrefs(stored: unknown): Prefs {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<
    Record<Category, Partial<Record<Channel, unknown>>>
  >
  const out = {} as Prefs
  for (const c of CATEGORIES) {
    const info = CATEGORY_INFO[c]
    const pick = (ch: Channel): boolean => {
      if (info.locked) return true
      const v = s[c]?.[ch]
      return typeof v === "boolean" ? v : info.defaults[ch]
    }
    out[c] = { push: pick("push"), email: pick("email") }
  }
  return out
}

export type AppNotification = {
  id: string
  account: string
  /** "owner" or a member's username */
  user: string
  category: Category
  title: string
  body: string
  url: string
  createdAt: string
  readAt?: string
}

export type MockEmail = {
  id: string
  account: string
  to: string
  category: Category
  subject: string
  body: string
  createdAt: string
}