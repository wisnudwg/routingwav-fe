import { dialCodeOf } from "./countries"
import type { ProfileValues } from "./validators"

export function buildProfilePayload(v: ProfileValues & { accountAlias: string }) {
  return {
    // Belongs to the account (shared by every profile)
    account: {
      alias: v.accountAlias,
      phone: `+${dialCodeOf(v.phoneCountry)}${v.phoneNumber}`,
      country: v.country, // ISO 3166-1 alpha-2
      address: v.address.trim(),
    },
    // The first profile ("hat") of the account
    profile: {
      kind: v.kind,
      roles: v.roles,
      otherRole: v.roles.includes("Other") ? v.otherRole?.trim() : undefined,
      instruments:
        v.kind === "talent" && v.roles.includes("Session Player") ? v.instruments?.trim() : undefined,
    },
  }
}
export type ProfilePayload = ReturnType<typeof buildProfilePayload>