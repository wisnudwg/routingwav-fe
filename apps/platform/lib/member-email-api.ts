import { z } from "zod"
import { logEvent } from "./audit"
import { maskEmail } from "./email"
import { notificationsStore } from "./notifications-store"
import { notify } from "./notify"
import type { TeamMember } from "./team"
import { toPublic, type ApiResult, type Owner } from "./team-api"
import { teamStore } from "./team-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const TOKEN_TTL_MS = 24 * 3_600_000
const emailSchema = z.string().trim().toLowerCase().email()
const NOT_FOUND = "Anggota tidak ditemukan."

function queueVerification(account: string, username: string, email: string, token: string) {
  const link = `${window.location.origin}/auth/verify-member-email?token=${token}`
  notificationsStore.queueEmail({
    id: crypto.randomUUID(),
    account,
    to: email,
    category: "account",
    subject: "Verifikasi email notifikasi Routing.com",
    body:
      `Pemilik akun "${account}" menambahkan alamat email ini untuk notifikasi anggota tim "${username}".\n\n` +
      `Buka tautan berikut untuk memverifikasi (berlaku 24 jam):\n${link}\n\n` +
      `Jika Anda tidak mengenali permintaan ini, abaikan email ini. Tidak ada notifikasi yang dikirim sebelum alamat ini diverifikasi.`,
    createdAt: new Date().toISOString(),
  })
}

const newToken = () => ({
  emailToken: crypto.randomUUID(),
  emailTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
})

export async function setMemberEmail(
  owner: Owner,
  actorLabel: string,
  id: string,
  raw: string
): Promise<ApiResult<TeamMember>> {
  await sleep(400)
  const parsed = emailSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, message: "Alamat email tidak valid." }
  const email = parsed.data

  const m = teamStore.get(owner.alias, id)
  if (!m) return { ok: false, message: NOT_FOUND }
  if (m.status !== "active") return { ok: false, message: "Aktifkan anggota ini terlebih dahulu." }
  if (m.email === email && m.emailVerified) return { ok: true, data: toPublic(m) }
  if (teamStore.list(owner.alias).some((x) => x.id !== m.id && x.email === email)) {
    return { ok: false, message: "Email ini sudah dipakai anggota lain." }
  }

  const token = newToken()
  const updated = teamStore.update(owner.alias, m.id, { email, emailVerified: false, ...token })
  if (!updated) return { ok: false, message: NOT_FOUND }

  queueVerification(owner.alias, m.username, email, token.emailToken)
  logEvent(owner.alias, actorLabel, "member_email_set", `${m.username}: ${maskEmail(email)}`)
  notify({
    account: owner.alias,
    category: "account",
    to: [m.username],
    by: "owner",
    title: "Email notifikasi ditambahkan",
    body: "Pemilik akun menambahkan alamat email untuk notifikasi Anda. Notifikasi email aktif setelah alamat itu diverifikasi.",
    url: "/settings/notifications",
  })
  return { ok: true, data: toPublic(updated) }
}

export async function resendMemberEmailVerification(owner: Owner, id: string): Promise<ApiResult<TeamMember>> {
  await sleep(300)
  const m = teamStore.get(owner.alias, id)
  if (!m?.email || m.emailVerified) return { ok: false, message: "Tidak ada email yang menunggu verifikasi." }

  const token = newToken()
  const updated = teamStore.update(owner.alias, m.id, token)
  if (!updated) return { ok: false, message: NOT_FOUND }
  queueVerification(owner.alias, m.username, m.email, token.emailToken)
  return { ok: true, data: toPublic(updated) }
}

export async function removeMemberEmail(owner: Owner, actorLabel: string, id: string): Promise<ApiResult<TeamMember>> {
  await sleep(300)
  const m = teamStore.get(owner.alias, id)
  if (!m?.email) return { ok: false, message: "Anggota ini tidak memiliki email." }

  const old = m.email
  const updated = teamStore.update(owner.alias, m.id, {
    email: undefined,
    emailVerified: false,
    emailToken: undefined,
    emailTokenExpiresAt: undefined,
  })
  if (!updated) return { ok: false, message: NOT_FOUND }

  logEvent(owner.alias, actorLabel, "member_email_removed", `${m.username}: ${maskEmail(old)}`)
  notify({
    account: owner.alias,
    category: "account",
    to: [m.username],
    by: "owner",
    title: "Email notifikasi dihapus",
    body: "Pemilik akun menghapus alamat email Anda. Anda tetap menerima notifikasi di aplikasi dan push.",
    url: "/settings/notifications",
  })
  return { ok: true, data: toPublic(updated) }
}

/** Public: whoever opens the link. A real server hashes tokens and rate-limits this endpoint. */
export async function verifyMemberEmail(token: string): Promise<{ ok: true } | { ok: false; reason: "expired" | "invalid" }> {
  await sleep(400)
  const m = token ? teamStore.findByEmailToken(token) : null
  if (!m || !m.email) return { ok: false, reason: "invalid" }
  if (m.emailTokenExpiresAt && Date.parse(m.emailTokenExpiresAt) < Date.now()) return { ok: false, reason: "expired" }

  teamStore.update(m.account, m.id, { emailVerified: true, emailToken: undefined, emailTokenExpiresAt: undefined })
  logEvent(m.account, `${m.username}@${m.account}`, "member_email_verified", maskEmail(m.email))
  notify({
    account: m.account,
    category: "account",
    to: [m.username],
    title: "Email terverifikasi",
    body: "Notifikasi email kini aktif sesuai pengaturan Anda.",
    url: "/settings/notifications",
  })
  return { ok: true }
}

export type MyEmailStatus = { state: "none" } | { state: "pending" | "verified"; masked: string }

/** What a team member may know about their own address: state and a masked version */
export async function getMyEmailStatus(account: string, username: string): Promise<MyEmailStatus> {
  await sleep(100)
  const m = teamStore.find(account, username)
  if (!m?.email) return { state: "none" }
  return { state: m.emailVerified ? "verified" : "pending", masked: maskEmail(m.email) }
}