import { dialCodeOf } from "./countries"
import { OTHER_ROLE, SESSION_PLAYER_ROLE } from "./roles"
import type { ProfileValues, RoleValues } from "./validators"

export function buildProfile(v: RoleValues) {
  return {
    kind: v.kind,
    roles: v.roles,
    otherRole: v.roles.includes(OTHER_ROLE) ? v.otherRole?.trim() : undefined,
    instruments:
      v.kind === "talent" && v.roles.includes(SESSION_PLAYER_ROLE)
        ? v.instruments?.trim()
        : undefined,
  }
}

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
    profile: buildProfile(v),
  }
}
export type ProfilePayload = ReturnType<typeof buildProfilePayload>