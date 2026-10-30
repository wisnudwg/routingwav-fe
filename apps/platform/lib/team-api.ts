import { api, toFail, ApiError, type Fail } from "./api"
import type { CredentialsBody, MemberView, Permission } from "./api-types"
import { mirrorMember, mirrorMembers, mirrorRemoved } from "./mock-bridge"
import type { ProfileKind } from "./roles"
import type { TeamMember } from "./team"

export type Owner = { alias: string; profiles: ProfileKind[] }
export type ApiResult<T = void> = { ok: true; data: T } | Fail

export function toTeamMember(v: MemberView, account: string): TeamMember {
  return {
    id: v.id,
    account,
    username: v.username,
    displayName: v.name ?? undefined,
    permissions: v.permissions,
    status: v.status,
    mustChangePassword: v.mustChangePassword,
    tempPasswordExpiresAt: v.tempPasswordExpiresAt ?? undefined,
    createdAt: v.createdAt,
    lastSignInAt: v.lastSignInAt ?? undefined,
    email: v.notificationEmail ?? undefined,
    emailVerified: v.notificationEmailVerified,
  }
}

export async function listTeam(owner: Owner): Promise<TeamMember[]> {
  try {
    const { members } = await api<{ members: MemberView[] }>("/team")
    const list = members.map((m) => toTeamMember(m, owner.alias))
    mirrorMembers(owner.alias, owner.profiles, list)
    return list
  } catch (e) {
    console.warn("listTeam failed", e)
    return []
  }
}

export async function getTeamMember(owner: Owner, id: string): Promise<TeamMember | null> {
  try {
    const { member } = await api<{ member: MemberView }>(`/team/${id}`)
    return toTeamMember(member, owner.alias)
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) console.warn("getTeamMember failed", e)
    return null
  }
}

/** The temporary password is in this response and nowhere else: show it once */
export async function createTeamMember(
  owner: Owner,
  input: { username: string; displayName?: string; permissions: Permission[] },
): Promise<ApiResult<{ member: TeamMember; tempPassword: string }>> {
  try {
    const r = await api<CredentialsBody>("/team", {
      method: "POST",
      json: {
        username: input.username,
        name: input.displayName?.trim() || undefined,
        permissions: input.permissions,
      },
    })
    const member = toTeamMember(r.member, owner.alias)
    mirrorMember(member)
    return { ok: true, data: { member, tempPassword: r.tempPassword } }
  } catch (e) {
    return toFail(e)
  }
}

export async function updateTeamMember(
  owner: Owner,
  id: string,
  patch: { displayName?: string; permissions?: Permission[]; status?: TeamMember["status"] },
): Promise<ApiResult<TeamMember>> {
  try {
    let view: MemberView | null = null

    if (patch.displayName !== undefined || patch.permissions) {
      const json: { name?: string; permissions?: Permission[] } = {}
      if (patch.displayName !== undefined) json.name = patch.displayName
      if (patch.permissions) json.permissions = patch.permissions
      view = (await api<{ member: MemberView }>(`/team/${id}`, { method: "PATCH", json })).member
    }
    if (patch.status) {
      const action = patch.status === "active" ? "enable" : "disable"
      view = (await api<{ member: MemberView }>(`/team/${id}/${action}`, { method: "POST" })).member
    }
    view ??= (await api<{ member: MemberView }>(`/team/${id}`)).member

    const member = toTeamMember(view, owner.alias)
    mirrorMember(member)
    return { ok: true, data: member }
  } catch (e) {
    return toFail(e)
  }
}

export async function resetMemberPassword(
  owner: Owner,
  id: string,
): Promise<ApiResult<{ member: TeamMember; tempPassword: string }>> {
  try {
    const r = await api<CredentialsBody>(`/team/${id}/reset-password`, { method: "POST" })
    const member = toTeamMember(r.member, owner.alias)
    mirrorMember(member)
    return { ok: true, data: { member, tempPassword: r.tempPassword } }
  } catch (e) {
    return toFail(e)
  }
}

export async function deleteTeamMember(owner: Owner, id: string): Promise<ApiResult> {
  try {
    await api(`/team/${id}`, { method: "DELETE" })
    mirrorRemoved(owner.alias, id)
    return { ok: true, data: undefined }
  } catch (e) {
    return toFail(e)
  }
}