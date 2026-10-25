import { slugifyAlias } from "./alias"
import type { Session } from "./auth"
import {
  availableModes,
  limitToProfiles,
  normalizePermissions,
  type Permission,
} from "./permissions"
import type { ProfilePayload } from "./profile-payload"
import type { ProfileKind } from "./roles"
import { teamStore } from "./team-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// TODO: every function below becomes a real API call. The server verifies credentials,
// sets an httpOnly session cookie, and returns generic errors only.

const TAKEN_ALIASES = new Set(["studio-abc", "routing-demo"])

/** MOCK TRIGGERS: "both" in the identifier → Client + Talent (Client active), "client" → Client only */
function mockProfiles(hint: string): ProfileKind[] {
  const h = hint.toLowerCase()
  if (h.includes("both")) return ["client", "talent"]
  if (h.includes("client")) return ["client"]
  return ["talent"]
}

/** MOCK: a registered alias isn't persisted, so derive one from the email */
function mockAlias(email: string) {
  const base = slugifyAlias(email.split("@")[0] ?? "")
  return base.length >= 3 ? base : `${base || "akun"}-demo`
}

/** MOCK TRIGGERS by username for aliases the team store has never seen */
function mockIamPermissions(username: string): Permission[] {
  const u = username.toLowerCase()
  if (u.includes("noaccess")) return []
  if (u.includes("talentonly")) {
    return normalizePermissions(["mode:talent", "talent:dashboard.view", "talent:sales.view", "messages:view"])
  }
  if (u.includes("clientonly")) {
    return normalizePermissions(["mode:client", "client:dashboard.view", "messages:view"])
  }
  return normalizePermissions([
    "mode:talent", "mode:client", "talent:sales.view", "client:dashboard.view",
    "messages:view", "messages:send", "wallet:view",
  ])
}

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; code?: "email_unverified"; message: string }

const BAD_CREDENTIALS = {
  ok: false,
  message: "Kredensial tidak valid. Periksa ID akun, username, dan password Anda.",
} as const

export async function signInRoot(email: string, password: string): Promise<SignInResult> {
  void password
  await sleep(300)
  const e = email.trim().toLowerCase()
  // MOCK TRIGGER: emails starting with "unverified". A real server may reveal this
  // ONLY after the password was verified.
  if (e.startsWith("unverified")) {
    return {
      ok: false,
      code: "email_unverified",
      message: "Email Anda belum diverifikasi. Cek kotak masuk atau kirim ulang email verifikasi.",
    }
  }
  const profiles = mockProfiles(e)
  const alias = mockAlias(e)
  teamStore.setProfiles(alias, profiles) // so IAM sign-in knows this account
  return { ok: true, session: { type: "root", email: e, alias, profiles, mode: profiles[0] } }
}

export async function signInIam(
  account: string,
  username: string,
  password: string
): Promise<SignInResult> {
  await sleep(300)
  const acc = account.trim().toLowerCase()
  const uname = username.trim().toLowerCase()

  // Known account: authenticate against real team members
  if (teamStore.knows(acc)) {
    const m = teamStore.find(acc, uname)
    if (!m || m.password !== password) return BAD_CREDENTIALS // same answer for every failure
    if (m.status === "disabled") {
      return { ok: false, message: "Akun ini dinonaktifkan. Hubungi pemilik akun Anda." }
    }

    teamStore.update(acc, m.id, { lastSignInAt: new Date().toISOString() })
    const profiles = teamStore.getProfiles(acc) ?? mockProfiles(acc)
    const session: Session = {
      type: "iam",
      account: acc,
      username: m.username,
      name: m.displayName,
      profiles,
      permissions: limitToProfiles(m.permissions, profiles),
      pending: m.mustChangePassword ? "change-password" : undefined,
    }
    session.mode = availableModes(session)[0]
    return { ok: true, session }
  }

  // Unknown account: legacy mock triggers (so earlier tests keep working)
  const profiles = mockProfiles(acc)
  const session: Session = {
    type: "iam",
    account: acc,
    username: username.trim(),
    profiles,
    permissions: limitToProfiles(mockIamPermissions(username), profiles),
    // MOCK TRIGGER: this password simulates "temporary password, must change"
    pending: password === "Temp1234!" ? "change-password" : undefined,
  }
  session.mode = availableModes(session)[0]
  return { ok: true, session }
}

/** DEV-ONLY simulation. Production needs the real Google flow. */
export async function signInWithGoogle(mode: "sign-in" | "sign-up"): Promise<SignInResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, message: "Login Google belum tersedia." }
  }
  await sleep(300)
  if (mode === "sign-up") {
    return {
      ok: true,
      session: {
        type: "root",
        email: "google.user@example.com",
        name: "Google User",
        profiles: [], // the first profile is created on /auth/complete-profile
        pending: "complete-profile",
      },
    }
  }
  teamStore.setProfiles("google-user", ["talent"])
  return {
    ok: true,
    session: {
      type: "root",
      email: "google.user@example.com",
      name: "Google User",
      alias: "google-user",
      profiles: ["talent"],
      mode: "talent",
    },
  }
}

export async function checkAliasAvailable(alias: string): Promise<boolean> {
  await sleep(350)
  return !TAKEN_ALIASES.has(alias)
}

export type AliasResult = { ok: true } | { ok: false; message: string }

export async function registerRoot(
  input: ProfilePayload & { name: string; email: string; password: string }
): Promise<AliasResult> {
  await sleep(500)
  if (TAKEN_ALIASES.has(input.account.alias)) {
    return { ok: false, message: "ID akun sudah dipakai, coba yang lain" }
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[mock] register", { ...input, password: "***" })
  }
  // Deliberately NO "email already exists" error (account enumeration).
  return { ok: true }
}

export async function completeRootProfile(input: ProfilePayload): Promise<AliasResult> {
  await sleep(500)
  if (TAKEN_ALIASES.has(input.account.alias)) {
    return { ok: false, message: "ID akun sudah dipakai, coba yang lain" }
  }
  if (process.env.NODE_ENV !== "production") console.log("[mock] complete profile", input)
  return { ok: true }
}

export async function addProfile(input: ProfilePayload["profile"]): Promise<AliasResult> {
  await sleep(500)
  // TODO: POST to the API. The server must reject a duplicate kind and require account:manage.
  if (process.env.NODE_ENV !== "production") console.log("[mock] add profile", input)
  return { ok: true }
}

export async function resendVerification(email: string): Promise<void> {
  void email
  await sleep(400)
}

export type VerifyResult = { ok: true } | { ok: false; reason: "expired" | "invalid" }

export async function verifyEmail(token: string): Promise<VerifyResult> {
  await sleep(500)
  if (token === "expired") return { ok: false, reason: "expired" }
  if (token === "invalid") return { ok: false, reason: "invalid" }
  return { ok: true }
}

export async function changeIamPassword(
  account: string,
  username: string,
  newPassword: string
): Promise<AliasResult> {
  await sleep(400)
  const acc = account.toLowerCase()
  const m = teamStore.find(acc, username.toLowerCase())
  if (m) {
    if (m.password === newPassword) {
      return { ok: false, message: "Password baru tidak boleh sama dengan password sementara." }
    }
    teamStore.update(acc, m.id, { password: newPassword, mustChangePassword: false })
  }
  return { ok: true }
}