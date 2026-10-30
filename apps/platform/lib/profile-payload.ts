import { OTHER_ROLE, SESSION_PLAYER_ROLE } from "./roles"
import type { ProfileValues, RoleValues } from "./validators"

export function roleInput(v: RoleValues) {
  return {
    kind: v.kind,
    roles: v.roles,
    otherRole: v.roles.includes(OTHER_ROLE) ? v.otherRole?.trim() : undefined,
    instruments:
      v.kind === "talent" && v.roles.includes(SESSION_PLAYER_ROLE) ? v.instruments?.trim() : undefined,
  }
}

export function profileInput(v: ProfileValues) {
  return {
    ...roleInput(v),
    phoneCountry: v.phoneCountry,
    phoneNumber: v.phoneNumber,
    country: v.country,
    address: v.address.trim(),
  }
}