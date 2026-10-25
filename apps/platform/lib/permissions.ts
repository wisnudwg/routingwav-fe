import type { Session } from "./auth"
import type { ProfileKind } from "./roles"

export const PERMISSIONS = [
  "mode:talent", // may enter the Talent side
  "mode:client", // may enter the Client side
  "messages:use",
  "wallet:view",
  "wallet:withdraw",
  "team:manage", // create / disable IAM users, set their permissions
  "account:manage", // profiles, account settings, KYC
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const isPermission = (x: unknown): x is Permission =>
  typeof x === "string" && (PERMISSIONS as readonly string[]).includes(x)

/** Only the account owner can ever hold these. Never grantable to an IAM user. */
export const ROOT_ONLY: readonly Permission[] = ["team:manage", "account:manage"]

export const modePermission = (k: ProfileKind): Permission =>
  k === "talent" ? "mode:talent" : "mode:client"

export function can(s: Session, p: Permission): boolean {
  if (s.type === "root") return true
  return !ROOT_ONLY.includes(p) && s.permissions.includes(p)
}

/** Profiles the signed-in user may actually enter */
export function availableModes(s: Session): ProfileKind[] {
  return s.profiles.filter((k) => can(s, modePermission(k)))
}