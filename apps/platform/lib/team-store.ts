import type { ProfileKind } from "./roles"
import type { TeamMember } from "./team"

export type MockMember = TeamMember & { password: string }

type Db = { members: MockMember[]; profiles: Record<string, ProfileKind[]> }

const KEY = "mock:team:v1"

function read(): Db {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if (v && Array.isArray(v.members)) return { members: v.members, profiles: v.profiles ?? {} }
    }
  } catch {}
  return { members: [], profiles: {} }
}

function write(db: Db) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db))
  } catch {}
}

export const teamStore = {
  /** Has this alias ever been seen (a root user signed in, or members exist)? */
  knows: (alias: string) => {
    const db = read()
    return alias in db.profiles || db.members.some((m) => m.account === alias)
  },
  list: (alias: string) => read().members.filter((m) => m.account === alias),
  get: (alias: string, id: string) =>
    read().members.find((m) => m.account === alias && m.id === id) ?? null,
  find: (alias: string, username: string) =>
    read().members.find((m) => m.account === alias && m.username === username) ?? null,
  insert: (m: MockMember) => {
    const db = read()
    db.members.push(m)
    write(db)
  },
  update: (alias: string, id: string, patch: Partial<MockMember>) => {
    const db = read()
    const i = db.members.findIndex((m) => m.account === alias && m.id === id)
    if (i < 0) return null
    db.members[i] = { ...db.members[i]!, ...patch }
    write(db)
    return db.members[i]!
  },
  remove: (alias: string, id: string) => {
    const db = read()
    const next = db.members.filter((m) => !(m.account === alias && m.id === id))
    if (next.length === db.members.length) return false
    write({ ...db, members: next })
    return true
  },
  getProfiles: (alias: string) => read().profiles[alias] ?? null,
  setProfiles: (alias: string, profiles: ProfileKind[]) => {
    const db = read()
    db.profiles[alias] = profiles
    write(db)
  },
}