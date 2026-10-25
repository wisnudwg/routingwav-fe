import { logEvent } from "./audit"
import type { DocMeta } from "./kyc"
import { getKycSummary } from "./kyc-api"
import { readJson, writeJson } from "./mock-db"
import { grant, revoke } from "./permissions"
import type { ProfileKind } from "./roles"
import type { ApiResult, Owner } from "./team-api"
import { teamStore } from "./team-store"

export type Representative = {
  kind: ProfileKind
  username: string
  /** ISO date (YYYY-MM-DD) from which the designation applies */
  since: string
  /** Appointment letter / power of attorney (required for business accounts) */
  document?: DocMeta
  createdAt: string
}

const KEY = "mock:reps:v1"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const readAll = () => readJson<Record<string, Representative[]>>(KEY, {})

function save(alias: string, list: Representative[]) {
  const all = readAll()
  all[alias] = list
  writeJson(KEY, all)
}

/** A member who no longer represents any profile loses the signing permission */
function releaseSigning(alias: string, username: string, remaining: Representative[]) {
  if (remaining.some((r) => r.username === username)) return
  const m = teamStore.find(alias, username)
  if (m) teamStore.update(alias, m.id, { permissions: revoke(m.permissions, "contracts:sign") })
}

export async function listRepresentatives(alias: string): Promise<Representative[]> {
  await sleep(150)
  return readAll()[alias] ?? []
}

export async function designateRepresentative(
  owner: Owner,
  actorLabel: string,
  input: { kind: ProfileKind; username: string; since: string; document?: DocMeta }
): Promise<ApiResult> {
  await sleep(450)
  if (!owner.profiles.includes(input.kind)) return { ok: false, message: "Akun Anda tidak memiliki profil ini." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.since)) return { ok: false, message: "Tanggal berlaku tidak valid." }

  const m = teamStore.find(owner.alias, input.username)
  if (!m || m.status !== "active") return { ok: false, message: "Anggota tidak ditemukan atau dinonaktifkan." }

  const kyc = await getKycSummary(owner.alias)
  if (kyc.type === "business" && !input.document) {
    return { ok: false, message: "Surat kuasa atau SK penunjukan wajib diunggah untuk badan usaha." }
  }

  const current = readAll()[owner.alias] ?? []
  const previous = current.find((r) => r.kind === input.kind)
  const next: Representative[] = [
    ...current.filter((r) => r.kind !== input.kind),
    {
      kind: input.kind,
      username: m.username,
      since: input.since,
      document: input.document,
      createdAt: new Date().toISOString(),
    },
  ]
  save(owner.alias, next)

  teamStore.update(owner.alias, m.id, { permissions: grant(m.permissions, "contracts:sign") })
  if (previous && previous.username !== m.username) releaseSigning(owner.alias, previous.username, next)

  logEvent(owner.alias, actorLabel, "representative_set", `${input.kind === "talent" ? "Talent" : "Client"}: ${m.username} (berlaku ${input.since})`)
  return { ok: true, data: undefined }
}

export async function revokeRepresentative(owner: Owner, actorLabel: string, kind: ProfileKind): Promise<ApiResult> {
  await sleep(300)
  const current = readAll()[owner.alias] ?? []
  const target = current.find((r) => r.kind === kind)
  if (!target) return { ok: false, message: "Belum ada perwakilan untuk profil ini." }

  const next = current.filter((r) => r.kind !== kind)
  save(owner.alias, next)
  releaseSigning(owner.alias, target.username, next)

  logEvent(owner.alias, actorLabel, "representative_revoked", `${kind === "talent" ? "Talent" : "Client"}: ${target.username}`)
  return { ok: true, data: undefined }
}