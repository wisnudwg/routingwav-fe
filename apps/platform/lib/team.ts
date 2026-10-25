import type { Permission } from "./permissions"

export type TeamMember = {
  id: string
  /** The owner's account alias */
  account: string
  /** Lowercase, unique within the account */
  username: string
  displayName?: string
  permissions: Permission[]
  status: "active" | "disabled"
  /** True until the member replaces their temporary password */
  mustChangePassword: boolean
  createdAt: string
  lastSignInAt?: string
}

export const signInUrl = (origin: string, alias: string) =>
  `${origin}/auth/sign-in?type=iam&account=${encodeURIComponent(alias)}`