import { api, toFail, type Fail } from "./api"
import type { AccountProfile } from "./api-types"

export type { AccountProfile }
export type AccountProfileInput = Pick<AccountProfile, "name" | "phoneCountry" | "phoneNumber" | "country" | "address">
type Result = { ok: true; data: AccountProfile } | Fail

export async function getAccountProfile(): Promise<Result> {
  try {
    const r = await api<{ profile: AccountProfile }>("/account/profile")
    return { ok: true, data: r.profile }
  } catch (e) {
    return toFail(e)
  }
}

export async function updateAccountProfile(input: AccountProfileInput): Promise<Result> {
  try {
    const r = await api<{ profile: AccountProfile }>("/account/profile", { method: "PUT", json: input })
    return { ok: true, data: r.profile }
  } catch (e) {
    return toFail(e)
  }
}