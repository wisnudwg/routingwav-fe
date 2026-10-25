import type { ApprovalRequest, Delegation } from "./approvals"
import { readJson, writeJson } from "./mock-db"

export const APPROVALS_EVENT = "approvals-change"

type Db = { requests: ApprovalRequest[]; delegations: Delegation[] }
const KEY = "mock:approvals:v1"

function read(): Db {
  const v = readJson<Partial<Db>>(KEY, {})
  return { requests: v.requests ?? [], delegations: v.delegations ?? [] }
}

function write(db: Db) {
  writeJson(KEY, db)
  window.dispatchEvent(new Event(APPROVALS_EVENT))
}

export const approvalsStore = {
  requests: (alias: string) => read().requests.filter((r) => r.account === alias),
  request: (alias: string, id: string) =>
    read().requests.find((r) => r.account === alias && r.id === id) ?? null,
  insert(r: ApprovalRequest) {
    const db = read()
    db.requests.push(r)
    write(db)
  },
  update(alias: string, id: string, patch: Partial<ApprovalRequest>) {
    const db = read()
    const i = db.requests.findIndex((r) => r.account === alias && r.id === id)
    if (i < 0) return null
    db.requests[i] = { ...db.requests[i]!, ...patch }
    write(db)
    return db.requests[i]!
  },

  delegations: (alias: string) => read().delegations.filter((d) => d.account === alias),
  delegationFor: (alias: string, username: string) =>
    read().delegations.find((d) => d.account === alias && d.username === username) ?? null,
  saveDelegation(d: Delegation) {
    const db = read()
    db.delegations = [...db.delegations.filter((x) => !(x.account === d.account && x.username === d.username)), d]
    write(db)
  },
  removeDelegation(alias: string, username: string) {
    const db = read()
    const next = db.delegations.filter((d) => !(d.account === alias && d.username === username))
    if (next.length === db.delegations.length) return false
    write({ ...db, delegations: next })
    return true
  },
}