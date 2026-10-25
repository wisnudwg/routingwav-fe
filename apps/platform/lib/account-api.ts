import { logEvent } from "./audit"
import { readJson, writeJson } from "./mock-db"
import type { ApiResult } from "./team-api"
import type { AccountProfileValues } from "./validators"

export type AccountProfile = AccountProfileValues

const KEY = "mock:account:v1"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const FIELD_LABEL: Record<keyof AccountProfile, string> = {
  name: "Nama",
  phoneCountry: "Kode telepon",
  phoneNumber: "Nomor telepon",
  country: "Negara",
  address: "Alamat",
}

type Db = Record<string, AccountProfile>

export async function getAccountProfile(alias: string): Promise<AccountProfile | null> {
  await sleep(200)
  return readJson<Db>(KEY, {})[alias] ?? null
}

export async function updateAccountProfile(
  alias: string,
  actor: string,
  values: AccountProfile
): Promise<ApiResult> {
  await sleep(400)
  // TODO: the server requires account:manage and re-validates everything.
  const db = readJson<Db>(KEY, {})
  const prev = db[alias]
  const next: AccountProfile = { ...values, name: values.name.trim(), address: values.address.trim() }

  const changed = (Object.keys(FIELD_LABEL) as (keyof AccountProfile)[]).filter(
    (k) => !prev || prev[k] !== next[k]
  )
  db[alias] = next
  writeJson(KEY, db)

  if (changed.length) logEvent(alias, actor, "profile_updated", changed.map((k) => FIELD_LABEL[k]).join(", "))
  return { ok: true, data: undefined }
}