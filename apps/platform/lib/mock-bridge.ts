// DEV ONLY. The modules still on mocks (wallet, approvals, messages, notifications) look team members up in
// their own localStorage store. This keeps that store in step with the real team and the signed-in user.
import type { Permission, SessionView } from "./api-types"
import { notificationsStore } from "./notifications-store"
import type { TeamMember } from "./team"
import { teamStore, type MockMember } from "./team-store"

const dev = () => process.env.NODE_ENV !== "production"
const toMock = (m: TeamMember): MockMember => ({ ...m, password: "" })

export function mirrorSession(view: SessionView) {
  if (!dev()) return
  if (view.type === "root") {
    if (view.alias) {
      notificationsStore.setOwnerEmail(view.alias, view.email)
      teamStore.setProfiles(view.alias, view.profiles)
    }
    return
  }
  teamStore.setProfiles(view.account, view.profiles)
  teamStore.upsert(
    toMock({
      id: `self-${view.username}`,
      account: view.account,
      username: view.username,
      displayName: view.name,
      permissions: view.permissions,
      status: "active",
      mustChangePassword: view.pending === "change-password",
      createdAt: new Date().toISOString(),
      emailVerified: view.notificationEmail.state === "verified",
    }),
  )
}

export function mirrorMembers(alias: string, profiles: SessionView["profiles"], members: TeamMember[]) {
  if (!dev()) return
  teamStore.setProfiles(alias, profiles)
  teamStore.replaceAll(alias, members.map(toMock))
}

export function mirrorMember(m: TeamMember) {
  if (dev()) teamStore.upsert(toMock(m))
}

export function mirrorRemoved(alias: string, id: string) {
  if (dev()) teamStore.remove(alias, id)
}

/** Mock-only permission helpers (the real catalog lives on the server) */
export const mockGrant = (perms: Permission[], ...ids: Permission[]): Permission[] =>
  Array.from(new Set([...perms, ...ids]))
export const mockRevoke = (perms: Permission[], id: Permission): Permission[] => perms.filter((p) => p !== id)