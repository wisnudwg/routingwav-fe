import { Header } from "@/components/dashboard/header"
import { OrdersTable } from "@/components/dashboard/orders-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { formatIDR } from "@/lib/format"
import { orders, summary } from "@/lib/mock-data"

export default function SalesOrdersPage() {
  return (
    <>
      <Header title="Sales & Orders" />
      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Penjualan"
            value={formatIDR(summary.totalSales)}
            note={
              <>
                <span className="text-green-700">+{summary.growthPct}%</span> bulan ini
              </>
            }
          />
          <StatCard
            label="Pesanan Aktif"
            value={`${summary.activeOrders} Pesanan`}
            note="(Dalam Pengerjaan)"
          />
          <StatCard
            label="Menunggu Konfirmasi"
            value={formatIDR(summary.pendingFunds)}
            note="(Dana Ditahan)"
          />
        </div>

        <OrdersTable orders={orders} payout={summary.lastPayout} />
      </div>
    </>
  )
}