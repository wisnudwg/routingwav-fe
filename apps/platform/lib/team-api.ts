import { generateTempPassword } from "./password-gen"
import { limitToProfiles, normalizePermissions, type Permission } from "./permissions"
import type { ProfileKind } from "./roles"
import type { TeamMember } from "./team"
import { teamStore, type MockMember } from "./team-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type Owner = { alias: string; profiles: ProfileKind[] }
export type ApiResult<T = void> = { ok: true; data: T } | { ok: false; message: string }

// Never expose the password field
const toPublic = (m: MockMember): TeamMember => ({
  id: m.id,
  account: m.account,
  username: m.username,
  displayName: m.displayName,
  permissions: m.permissions,
  status: m.status,
  mustChangePassword: m.mustChangePassword,
  createdAt: m.createdAt,
  lastSignInAt: m.lastSignInAt,
})

const sanitize = (perms: Permission[], owner: Owner) =>
  limitToProfiles(normalizePermissions(perms), owner.profiles)

export async function listTeam(owner: Owner): Promise<TeamMember[]> {
  await sleep(250)
  teamStore.setProfiles(owner.alias, owner.profiles) // mock only: the server derives this from the account
  return teamStore
    .list(owner.alias)
    .map(toPublic)
    .sort((a, b) => a.username.localeCompare(b.username))
}

export async function getTeamMember(owner: Owner, id: string): Promise<TeamMember | null> {
  await sleep(200)
  teamStore.setProfiles(owner.alias, owner.profiles)
  const m = teamStore.get(owner.alias, id)
  return m ? toPublic(m) : null
}

export async function createTeamMember(
  owner: Owner,
  input: { username: string; displayName?: string; permissions: Permission[] }
): Promise<ApiResult<{ member: TeamMember; tempPassword: string }>> {
  await sleep(500)
  teamStore.setProfiles(owner.alias, owner.profiles)

  const username = input.username.trim().toLowerCase()
  if (teamStore.find(owner.alias, username)) {
    return { ok: false, message: "Username sudah dipakai di akun ini" }
  }

  const tempPassword = generateTempPassword()
  const record: MockMember = {
    id: crypto.randomUUID(),
    account: owner.alias,
    username,
    displayName: input.displayName?.trim() || undefined,
    permissions: sanitize(input.permissions, owner),
    status: "active",
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    password: tempPassword,
  }
  teamStore.insert(record)
  return { ok: true, data: { member: toPublic(record), tempPassword } }
}

export async function updateTeamMember(
  owner: Owner,
  id: string,
  patch: { displayName?: string; permissions?: Permission[]; status?: TeamMember["status"] }
): Promise<ApiResult<TeamMember>> {
  await sleep(400)
  const next: Partial<MockMember> = {}
  if (patch.displayName !== undefined) next.displayName = patch.displayName.trim() || undefined
  if (patch.permissions) next.permissions = sanitize(patch.permissions, owner)
  if (patch.status) next.status = patch.status

  const updated = teamStore.update(owner.alias, id, next)
  return updated ? { ok: true, data: toPublic(updated) } : { ok: false, message: "Anggota tidak ditemukan" }
}

export async function resetMemberPassword(
  owner: Owner,
  id: string
): Promise<ApiResult<{ member: TeamMember; tempPassword: string }>> {
  await sleep(400)
  const tempPassword = generateTempPassword()
  const updated = teamStore.update(owner.alias, id, { password: tempPassword, mustChangePassword: true })
  return updated
    ? { ok: true, data: { member: toPublic(updated), tempPassword } }
    : { ok: false, message: "Anggota tidak ditemukan" }
}

export async function deleteTeamMember(owner: Owner, id: string): Promise<ApiResult> {
  await sleep(400)
  return teamStore.remove(owner.alias, id)
    ? { ok: true, data: undefined }
    : { ok: false, message: "Anggota tidak ditemukan" }
}