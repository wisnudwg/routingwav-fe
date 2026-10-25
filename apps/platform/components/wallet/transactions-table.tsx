import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { formatDateTime, formatIDR } from "@/lib/format"
import type { WalletTx } from "@/lib/wallet"

export function TransactionsTable({ txs }: { txs: WalletTx[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl text-slate-900">Riwayat transaksi</h2>
      {txs.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-600">
          Belum ada transaksi.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table className="min-w-xl">
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide">
                <TableHead className="pl-4">Waktu</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap py-3 pl-4 text-sm text-slate-700">{formatDateTime(t.at)}</TableCell>
                  <TableCell className="text-sm text-slate-900">{t.description}</TableCell>
                  <TableCell className={cn("whitespace-nowrap text-right text-sm font-medium", t.amount < 0 ? "text-slate-900" : "text-green-700")}>
                    {t.amount > 0 && "+"}
                    {formatIDR(t.amount)}
                  </TableCell>
                  <TableCell className="pr-4 text-sm text-slate-600">{t.status === "completed" ? "Selesai" : "Diproses"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}