export type OrderStatus = "revision" | "in_progress" | "completed" | "cancelled"

export type Order = {
  id: string
  date: string
  party: string
  item: string
  status: OrderStatus
  amount: number
}

export const summary = {
  totalSales: 14_750_000,
  growthPct: 12,
  activeOrders: 3,
  pendingFunds: 5_000_000,
  lastPayout: { amount: 5_000_000, bank: "Bank BCA", doneOn: "24 Sep" },
}

export const orders: Order[] = [
  { id: "R-84012", date: "2026-09-28", party: "Brian", item: "Mixing Testing Project (Draft 2)", status: "revision", amount: 2_500_000 },
  { id: "R-83995", date: "2026-09-25", party: "Feds", item: "Mastering Album Hoolahoop (Track 2)", status: "in_progress", amount: 3_500_000 },
  { id: "R-83984", date: "2026-09-22", party: "Bisma", item: "Vocal & Synth Presets Pop (Digital)", status: "completed", amount: 99_000 },
  { id: "R-83972", date: "2026-09-19", party: "Dewi", item: "Indie Drums Sample Pack Vol. 1 (Digital)", status: "completed", amount: 150_000 },
  { id: "R-83960", date: "2026-09-15", party: "Mamang", item: "Tuning Vocal (Digital)", status: "completed", amount: 350_000 },
]