import { readJson, writeJson } from "./mock-db"
import { PAYOUT_HOURS, type WalletTx } from "./wallet"

export const WALLET_EVENT = "wallet-change"

type WalletRec = { balance: number; txs: WalletTx[] }
export type BankRec = {
  id: string
  account: string
  bankId: string
  holderName: string
  number: string // DEV ONLY. A real backend stores this encrypted.
  createdAt: string
  createdBy: string
}

const WKEY = "mock:wallet:v1"
const BKEY = "mock:banks:v1"

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const emit = () => window.dispatchEvent(new Event(WALLET_EVENT))
const loadAll = () => readJson<Record<string, WalletRec>>(WKEY, {})

function seed(): WalletRec {
  const sale = (d: number, description: string, amount: number): WalletTx => ({
    id: crypto.randomUUID(), at: daysAgo(d), type: "sale", description, amount, status: "completed",
  })
  return {
    balance: 8_250_000,
    txs: [
      sale(2, "Mastering Album Hoolahoop (Track 2)", 3_500_000),
      sale(9, "Mixing Testing Project", 2_500_000),
      sale(14, "Paket Sample & Tuning Vocal", 2_250_000),
    ],
  }
}

/** A processing payout counts as completed once its settle time has passed */
const withSettlement = (t: WalletTx): WalletTx =>
  t.status === "processing" && t.settleAt && Date.now() >= Date.parse(t.settleAt)
    ? { ...t, status: "completed" }
    : t

export const walletStore = {
  wallet(alias: string): WalletRec {
    const all = loadAll()
    if (!all[alias]) {
      all[alias] = seed()
      writeJson(WKEY, all)
    }
    const w = all[alias]!
    return { balance: w.balance, txs: w.txs.map(withSettlement) }
  },

  debit(
    alias: string,
    gross: number,
    fee: number,
    description: string
  ): { ok: true; tx: WalletTx } | { ok: false; message: string } {
    const all = loadAll()
    const w = all[alias] ?? seed()
    if (gross > w.balance) return { ok: false, message: "Saldo tidak cukup." }

    const tx: WalletTx = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      type: "withdrawal",
      description,
      amount: -gross,
      fee,
      net: gross - fee,
      settleAt: new Date(Date.now() + PAYOUT_HOURS * 3_600_000).toISOString(),
      status: "processing",
    }
    all[alias] = { balance: w.balance - gross, txs: [tx, ...w.txs] }
    writeJson(WKEY, all)
    emit()
    return { ok: true, tx }
  },

  /** DEV ONLY */
  credit(alias: string, amount: number, description: string) {
    const all = loadAll()
    const w = all[alias] ?? seed()
    const tx: WalletTx = {
      id: crypto.randomUUID(), at: new Date().toISOString(), type: "sale", description, amount, status: "completed",
    }
    all[alias] = { balance: w.balance + amount, txs: [tx, ...w.txs] }
    writeJson(WKEY, all)
    emit()
  },

  /** DEV ONLY: stands in for the payout provider's "paid" webhook */
  settleProcessing(alias: string): WalletTx[] {
    const all = loadAll()
    const w = all[alias]
    if (!w) return []
    const settled: WalletTx[] = []
    w.txs = w.txs.map((t) => {
      if (t.status !== "processing") return t
      const done = { ...t, status: "completed" as const }
      settled.push(done)
      return done
    })
    writeJson(WKEY, all)
    emit()
    return settled
  },

  banks: (alias: string) => readJson<BankRec[]>(BKEY, []).filter((b) => b.account === alias),
  bank: (alias: string, id: string) =>
    readJson<BankRec[]>(BKEY, []).find((b) => b.account === alias && b.id === id) ?? null,
  addBank(rec: BankRec) {
    writeJson(BKEY, [...readJson<BankRec[]>(BKEY, []), rec])
    emit()
  },
  removeBank(alias: string, id: string) {
    const all = readJson<BankRec[]>(BKEY, [])
    const next = all.filter((b) => !(b.account === alias && b.id === id))
    if (next.length === all.length) return false
    writeJson(BKEY, next)
    emit()
    return true
  },
}