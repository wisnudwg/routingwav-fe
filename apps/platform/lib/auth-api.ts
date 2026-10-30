import { api, ApiError, toFail, type Fail } from "./api"
import type { SessionView } from "./api-types"

export type SessionResult = { ok: true; session: SessionView } | Fail

async function sessionCall(path: string, json?: unknown): Promise<SessionResult> {
  try {
    const r = await api<{ session: SessionView }>(path, { method: "POST", json })
    return { ok: true, session: r.session }
  } catch (e) {
    return toFail(e)
  }
}

async function okCall(path: string, json?: unknown): Promise<{ ok: true } | Fail> {
  try {
    await api(path, { method: "POST", json })
    return { ok: true }
  } catch (e) {
    return toFail(e)
  }
}

export const signInRoot = (email: string, password: string) =>
  sessionCall("/auth/sign-in/root", { email, password })

export const signInIam = (account: string, username: string, password: string) =>
  sessionCall("/auth/sign-in/iam", { account, username, password })

type ProfileFields = {
  kind: "talent" | "client"
  roles: string[]
  otherRole?: string
  instruments?: string
}
type ContactFields = { phoneCountry: string; phoneNumber: string; country: string; address: string }

export type RegisterInput = ProfileFields &
  ContactFields & {
    name: string
    email: string
    password: string
    accountAlias: string
    acceptTerms: true
  }

export const registerRoot = (input: RegisterInput) => okCall("/auth/register", input)

export const completeProfile = (input: ProfileFields & ContactFields & { accountAlias: string; acceptTerms: true }) =>
  sessionCall("/auth/complete-profile", input)

export const addProfile = (input: ProfileFields) => sessionCall("/account/profiles", input)

export const changePassword = (password: string) => sessionCall("/auth/change-password", { password })

/** The server enforces uniqueness on submit, so a failed check never blocks the user */
export async function checkAliasAvailable(alias: string): Promise<boolean> {
  try {
    const r = await api<{ available: boolean }>(`/accounts/alias-available?alias=${encodeURIComponent(alias)}`)
    return r.available
  } catch {
    return true
  }
}

/** Always answers the same way, so there is nothing to report */
export async function resendVerification(email: string): Promise<void> {
  await okCall("/auth/resend-verification", { email })
}

export async function verifyEmail(token: string): Promise<{ ok: true } | { ok: false; reason: "expired" | "invalid" }> {
  try {
    await api("/auth/verify-email", { method: "POST", json: { token } })
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof ApiError && e.code === "TOKEN_EXPIRED" ? "expired" : "invalid" }
  }
}

export const forgotPassword = (email: string) => okCall("/auth/forgot-password", { email })

export const resetPassword = (token: string, password: string) =>
  okCall("/auth/reset-password", { token, password })