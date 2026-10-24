import type { Session } from "./auth"
import type { ProfilePayload } from "./profile-payload"
import type { ProfileKind } from "./roles"

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

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; code?: "email_unverified"; message: string }

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
  return { ok: true, session: { type: "root", email: e, profiles, mode: profiles[0] } }
}

export async function signInIam(
  account: string,
  username: string,
  password: string
): Promise<SignInResult> {
  await sleep(300)
  const acc = account.trim().toLowerCase()
  const profiles = mockProfiles(acc) // IAM users inherit their account's profiles (permissions come later)
  return {
    ok: true,
    session: {
      type: "iam",
      account: acc,
      username: username.trim(),
      profiles,
      mode: profiles[0],
      // MOCK TRIGGER: this password simulates "temporary password, must change"
      pending: password === "Temp1234!" ? "change-password" : undefined,
    },
  }
}

/** DEV-ONLY simulation. Production needs the real Google flow. */
export async function signInWithGoogle(mode: "sign-in" | "sign-up"): Promise<SignInResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, message: "Login Google belum tersedia." }
  }
  await sleep(300)
  const session: Session =
    mode === "sign-up"
      ? {
          type: "root",
          email: "google.user@example.com",
          name: "Google User",
          profiles: [], // the first profile is created on /auth/complete-profile
          pending: "complete-profile",
        }
      : {
          type: "root",
          email: "google.user@example.com",
          name: "Google User",
          profiles: ["talent"],
          mode: "talent",
        }
  return { ok: true, session }
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

export async function changeIamPassword(newPassword: string): Promise<AliasResult> {
  void newPassword
  await sleep(400)
  return { ok: true }
}