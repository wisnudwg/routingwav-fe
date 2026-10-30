import type { Permission } from "./api-types"
import type { Session } from "./auth"
import type { ProfileKind } from "./roles"

export type { Permission }

export const modePermission = (k: ProfileKind): Permission => (k === "talent" ? "mode:talent" : "mode:client")

/** The server already sends a team member's *effective* permissions, so membership is enough. Owners can do everything. */
export function can(s: Session, p: Permission): boolean {
  return s.type === "root" || s.permissions.includes(p)
}

/** Profiles the signed-in user may actually enter */
export function availableModes(s: Session): ProfileKind[] {
  return s.profiles.filter((k) => can(s, modePermission(k)))
}