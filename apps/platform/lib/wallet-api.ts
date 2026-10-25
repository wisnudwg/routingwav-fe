import { approvalsStore } from "./approvals-store"
import type { Actor, ApprovalRequest } from "./approvals"
import { logEvent } from "./audit"
import { BANKS, maskBank, normalizeHolder, type BankSummary } from "./bank"
import { formatIDR } from "./format"
import { getKycSummary } from "./kyc-api"
import type { ApiResult } from "./team-api"
import { teamStore } from "./team-store"
import { MIN_WITHDRAWAL, type WalletSummary } from "./wallet"
import { walletStore, type BankRec } from "./wallet-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isProd = () => process.env.NODE_ENV === "production"
const NOT_AVAILABLE = "Fitur ini belum tersedia."
const OWNER_ONLY = "Hanya pemilik akun yang dapat mengelola rekening bank."

const bankName = (id: string) => BANKS.find((b) => b.id === id)?.name ?? id
const destLabel = (b: BankRec) => `${bankName(b.bankId)} ${maskBank(b.number)}`

const toSummary = (b: BankRec): BankSummary => ({
  id: b.id,
  bankId: b.bankId,
  bankName: bankName(b.bankId),
  holderName: b.holderName,
  masked: maskBank(b.number),
  createdAt: b.createdAt,
})

const heldOf = (alias: string) =>
  approvalsStore
    .requests(alias)
    .filter((r) => r.status === "pending" && r.type === "withdrawal")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)

export async function getWallet(alias: string): Promise<WalletSummary> {
  await sleep(200)
  const w = walletStore.wallet(alias)
  const held = heldOf(alias)
  return {
    balance: w.balance,
    held,
    available: w.balance - held,
    txs: [...w.txs].sort((a, b) => b.at.localeCompare(a.at)),
  }
}

export async function listBankAccounts(alias: string): Promise<BankSummary[]> {
  await sleep(150)
  return walletStore.banks(alias).map(toSummary)
}

export async function addBankAccount(
  actor: Actor,
  input: { bankId: string; number: string; holderName: string }
): Promise<ApiResult<BankSummary>> {
  await sleep(500)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }
  if (actor.kind !== "root") return { ok: false, message: OWNER_ONLY }

  const kyc = await getKycSummary(actor.alias)
  if (kyc.status !== "verified") {
    return { ok: false, message: "Verifikasi identitas diperlukan sebelum menambah rekening." }
  }
  const legal = kyc.names.legalName ?? kyc.names.fullName
  if (!legal || normalizeHolder(legal) !== normalizeHolder(input.holderName)) {
    return { ok: false, message: `Nama pemilik rekening harus sama dengan nama terverifikasi (${legal ?? "-"}).` }
  }
  if (!BANKS.some((b) => b.id === input.bankId)) return { ok: false, message: "Bank tidak dikenal." }
  if (!/^\d{6,20}$/.test(input.number)) return { ok: false, message: "Nomor rekening tidak valid." }
  if (walletStore.banks(actor.alias).some((b) => b.bankId === input.bankId && b.number === input.number)) {
    return { ok: false, message: "Rekening ini sudah terdaftar." }
  }

  const rec: BankRec = {
    id: crypto.randomUUID(),
    account: actor.alias,
    bankId: input.bankId,
    holderName: legal,
    number: input.number,
    createdAt: new Date().toISOString(),
    createdBy: actor.label,
  }
  walletStore.addBank(rec)
  logEvent(actor.alias, actor.label, "bank_added", destLabel(rec))
  return { ok: true, data: toSummary(rec) }
}

export async function removeBankAccount(actor: Actor, id: string): Promise<ApiResult> {
  await sleep(400)
  if (actor.kind !== "root") return { ok: false, message: OWNER_ONLY }
  const bank = walletStore.bank(actor.alias, id)
  if (!bank) return { ok: false, message: "Rekening tidak ditemukan." }

  const inUse = approvalsStore
    .requests(actor.alias)
    .some((r) => r.status === "pending" && r.payload.bankAccountId === id)
  if (inUse) {
    return { ok: false, message: "Ada penarikan yang menunggu persetujuan ke rekening ini. Selesaikan dulu." }
  }

  walletStore.removeBank(actor.alias, id)
  logEvent(actor.alias, actor.label, "bank_removed", destLabel(bank))
  return { ok: true, data: undefined }
}

export async function revealBankNumber(actor: Actor, id: string): Promise<ApiResult<string>> {
  await sleep(250)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }
  if (actor.kind !== "root") return { ok: false, message: OWNER_ONLY }
  // A real server also requires a recent password re-check and rate-limits this.
  const bank = walletStore.bank(actor.alias, id)
  if (!bank) return { ok: false, message: "Rekening tidak ditemukan." }
  logEvent(actor.alias, actor.label, "bank_revealed", destLabel(bank)) // logs the masked label, never the number
  return { ok: true, data: bank.number }
}

/** Shared by direct owner withdrawals and approved requests */
export function executeWithdrawal(alias: string, bankAccountId: string, amount: number): ApiResult<{ txId: string }> {
  const bank = walletStore.bank(alias, bankAccountId)
  if (!bank) return { ok: false, message: "Rekening tujuan sudah dihapus." }
  const res = walletStore.debit(alias, amount, `Penarikan ke ${destLabel(bank)}`)
  return res.ok ? { ok: true, data: { txId: res.tx.id } } : res
}

export async function requestWithdrawal(
  actor: Actor,
  input: { bankAccountId: string; amount: number }
): Promise<ApiResult<{ mode: "executed" | "pending" }>> {
  await sleep(500)
  if (isProd()) return { ok: false, message: NOT_AVAILABLE }

  if (actor.kind === "iam") {
    const m = teamStore.find(actor.alias, actor.username)
    if (!m || m.status !== "active" || !m.permissions.includes("wallet:withdraw")) {
      return { ok: false, message: "Anda tidak memiliki izin untuk mengajukan penarikan." }
    }
  }

  const kyc = await getKycSummary(actor.alias)
  if (kyc.status !== "verified") return { ok: false, message: "Identitas akun belum terverifikasi." }

  const bank = walletStore.bank(actor.alias, input.bankAccountId)
  if (!bank) return { ok: false, message: "Rekening tujuan tidak ditemukan." }

  const { amount } = input
  if (!Number.isInteger(amount) || amount < MIN_WITHDRAWAL) {
    return { ok: false, message: `Penarikan minimal ${formatIDR(MIN_WITHDRAWAL)}.` }
  }
  if (amount > walletStore.wallet(actor.alias).balance - heldOf(actor.alias)) {
    return { ok: false, message: "Saldo tersedia tidak cukup." }
  }

  const detail = `${formatIDR(amount)} → ${destLabel(bank)}`

  if (actor.kind === "root") {
    const res = executeWithdrawal(actor.alias, bank.id, amount)
    if (!res.ok) return res
    logEvent(actor.alias, actor.label, "withdrawal_executed", detail)
    return { ok: true, data: { mode: "executed" } }
  }

  const req: ApprovalRequest = {
    id: crypto.randomUUID(),
    account: actor.alias,
    type: "withdrawal",
    status: "pending",
    summary: `Tarik ${formatIDR(amount)} ke ${destLabel(bank)}`,
    amount,
    payload: { bankAccountId: bank.id },
    requestedBy: actor.username,
    requestedByLabel: actor.label,
    requestedAt: new Date().toISOString(),
  }
  approvalsStore.insert(req)
  logEvent(actor.alias, actor.label, "withdrawal_requested", detail)
  return { ok: true, data: { mode: "pending" } }
}