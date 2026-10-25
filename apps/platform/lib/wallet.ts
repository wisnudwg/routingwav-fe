export const MIN_WITHDRAWAL = 50_000

export type WalletTx = {
  id: string
  at: string
  type: "sale" | "withdrawal"
  description: string
  /** Positive = money in, negative = money out (IDR) */
  amount: number
  status: "completed" | "processing"
}

export type WalletSummary = {
  balance: number
  /** Reserved by withdrawal requests waiting for approval */
  held: number
  available: number
  txs: WalletTx[]
}