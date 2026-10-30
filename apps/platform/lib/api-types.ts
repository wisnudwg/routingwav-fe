import type { paths } from "./api-schema"
import type { ProfileKind } from "./roles"

type Json<R> = R extends { content: { "application/json": infer B } } ? B : never

/* ---- generated from the OpenAPI document ---- */
export type PermissionsMeta = Json<paths["/v1/meta/permissions"]["get"]["responses"][200]>
export type RulesMeta = Json<paths["/v1/meta/rules"]["get"]["responses"][200]>
type TeamListBody = Json<paths["/v1/team"]["get"]["responses"][200]>
export type MemberView = TeamListBody["members"][number]
export type CredentialsBody = Json<paths["/v1/team"]["post"]["responses"][201]>
export type Permission = PermissionsMeta["permissions"][number]["id"]

/* ---- hand-written: auth endpoints aren't in the OpenAPI document (small, stable payloads) ---- */
export type EmailStatus = { state: "none" } | { state: "pending" | "verified"; masked: string }

export type SessionView =
  | {
      type: "root"
      email: string
      name?: string
      alias?: string
      profiles: ProfileKind[]
      pending?: "complete-profile"
    }
  | {
      type: "iam"
      account: string
      username: string
      name?: string
      profiles: ProfileKind[]
      permissions: Permission[]
      notificationEmail: EmailStatus
      pending?: "change-password"
    }