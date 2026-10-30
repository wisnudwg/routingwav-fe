// permission-graph.ts
import type { Permission, PermissionsMeta } from "./api-types"
import type { ProfileKind } from "./roles"

export type MetaEntry = PermissionsMeta["permissions"][number]
export type MetaIndex = ReadonlyMap<Permission, MetaEntry>

export const indexMeta = (meta: PermissionsMeta): MetaIndex =>
  new Map(meta.permissions.map((p) => [p.id, p] as const))

const ordered = (index: MetaIndex, set: Set<Permission>) => [...index.keys()].filter((p) => set.has(p))

/** Adds a permission together with everything it depends on */
export function grantIn(index: MetaIndex, current: readonly Permission[], id: Permission): Permission[] {
  const set = new Set(current)
  const add = (p: Permission) => {
    set.add(p)
    for (const r of index.get(p)?.requires ?? []) if (!set.has(r)) add(r)
  }
  add(id)
  return ordered(index, set)
}

/** Removes a permission and everything that depends on it */
export function revokeIn(index: MetaIndex, current: readonly Permission[], id: Permission): Permission[] {
  const set = new Set(current)
  set.delete(id)
  let changed = true
  while (changed) {
    changed = false
    for (const p of [...set]) {
      if ((index.get(p)?.requires ?? []).some((r) => !set.has(r))) {
        set.delete(p)
        changed = true
      }
    }
  }
  return ordered(index, set)
}

export function normalizeIn(index: MetaIndex, ids: readonly Permission[]): Permission[] {
  let out: Permission[] = []
  for (const id of ids) {
    const e = index.get(id)
    if (e && !e.rootOnly) out = grantIn(index, out, id)
  }
  return out
}

/** Drops permissions of profiles the account doesn't have */
export function limitTo(index: MetaIndex, perms: readonly Permission[], profiles: readonly ProfileKind[]): Permission[] {
  return perms.filter((p) => {
    const scope = index.get(p)?.scope
    return scope === "shared" || (scope !== undefined && profiles.includes(scope))
  })
}