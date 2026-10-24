import { dialCodeOf } from "./countries"
import type { ProfileValues } from "./validators"

export function buildProfilePayload(v: ProfileValues & { accountAlias: string }) {
  return {
    accountAlias: v.accountAlias,
    phone: `+${dialCodeOf(v.phoneCountry)}${v.phoneNumber}`,
    country: v.country, // ISO 3166-1 alpha-2
    address: v.address.trim(),
    roles: v.roles,
    otherRole: v.roles.includes("Other") ? v.otherRole?.trim() : undefined,
    instruments: v.roles.includes("Session Player") ? v.instruments?.trim() : undefined,
  }
}
export type ProfilePayload = ReturnType<typeof buildProfilePayload>