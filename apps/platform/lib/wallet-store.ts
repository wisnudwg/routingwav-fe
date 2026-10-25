import { readJson, writeJson } from "./mock-db"
import type { WalletTx } from "./wallet"

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

export const walletStore = {
  wallet(alias: string): WalletRec {
    const all = readJson<Record<string, WalletRec>>(WKEY, {})
    if (all[alias]) return all[alias]
    all[alias] = seed()
    writeJson(WKEY, all)
    return all[alias]
  },

  debit(alias: string, amount: number, description: string):
    | { ok: true; tx: WalletTx }
    | { ok: false; message: string } {
    const all = readJson<Record<string, WalletRec>>(WKEY, {})
    const w = all[alias] ?? seed()
    if (amount > w.balance) return { ok: false, message: "Saldo tidak cukup." }

    const tx: WalletTx = {
      id: crypto.randomUUID(), at: new Date().toISOString(), type: "withdrawal",
      description, amount: -amount, status: "completed",
    }
    all[alias] = { balance: w.balance - amount, txs: [tx, ...w.txs] }
    writeJson(WKEY, all)
    emit()
    return { ok: true, tx }
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