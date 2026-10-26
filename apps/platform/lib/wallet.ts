export const MIN_WITHDRAWAL = 50_000
/** 2%, in basis points. The fee is deducted from the withdrawn amount: the bank receives amount − fee. */
export const WITHDRAWAL_FEE_BPS = 200
/** Per account, per Jakarta calendar day. Placeholder: set with your payout provider and compliance. */
export const DAILY_WITHDRAWAL_LIMIT = 25_000_000
export const PAYOUT_HOURS = 24

export const feeFor = (gross: number) => Math.round((gross * WITHDRAWAL_FEE_BPS) / 10_000)
export const netFor = (gross: number) => gross - feeFor(gross)

/** "YYYY-MM-DD" in Asia/Jakarta */
export const jakartaDay = (d: string | number | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(d))

export type WalletTx = {
  id: string
  at: string
  type: "sale" | "withdrawal"
  description: string
  /** Positive = money in, negative = money out (IDR, the gross amount for withdrawals) */
  amount: number
  status: "completed" | "processing"
  fee?: number
  net?: number
  /** When a processing payout is expected to land */
  settleAt?: string
}

export type WalletSummary = {
  balance: number
  /** Reserved by withdrawal requests waiting for approval */
  held: number
  available: number
  dailyLimit: number
  dailyUsed: number
  dailyRemaining: number
  txs: WalletTx[]
}