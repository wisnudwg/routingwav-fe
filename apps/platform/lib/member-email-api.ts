import { api, ApiError, toFail } from "./api"
import type { MemberView } from "./api-types"
import { getSession, refreshSession, type EmailStatus } from "./auth"
import { mirrorMember } from "./mock-bridge"
import type { TeamMember } from "./team"
import { toTeamMember, type ApiResult, type Owner } from "./team-api"

export type MyEmailStatus = EmailStatus

async function asMember(owner: Owner, call: Promise<{ member: MemberView }>): Promise<ApiResult<TeamMember>> {
  try {
    const member = toTeamMember((await call).member, owner.alias)
    mirrorMember(member)
    return { ok: true, data: member }
  } catch (e) {
    return toFail(e)
  }
}

export const setMemberEmail = (owner: Owner, _actorLabel: string, id: string, email: string) =>
  asMember(owner, api(`/team/${id}/email`, { method: "PUT", json: { email } }))

export async function resendMemberEmailVerification(owner: Owner, id: string): Promise<ApiResult<TeamMember>> {
  try {
    await api(`/team/${id}/email/resend`, { method: "POST" })
  } catch (e) {
    return toFail(e)
  }
  return asMember(owner, api(`/team/${id}`))
}

export const removeMemberEmail = (owner: Owner, _actorLabel: string, id: string) =>
  asMember(owner, api(`/team/${id}/email`, { method: "DELETE" }))

/** Public: whoever opens the emailed link */
export async function verifyMemberEmail(
  token: string,
): Promise<{ ok: true } | { ok: false; reason: "expired" | "invalid" }> {
  try {
    await api("/auth/verify-member-email", { method: "POST", json: { token } })
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof ApiError && e.code === "TOKEN_EXPIRED" ? "expired" : "invalid" }
  }
}

/** What a team member may know about their own address, straight from the session */
export async function getMyEmailStatus(_account?: string, _username?: string): Promise<MyEmailStatus> {
  await refreshSession()
  const s = getSession()
  return s?.type === "iam" ? s.notificationEmail : { state: "none" }
}