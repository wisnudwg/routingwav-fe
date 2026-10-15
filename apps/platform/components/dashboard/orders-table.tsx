"use client"

import Link from "next/link"
import { useState } from "react"
import { Card } from "@workspace/ui/components/card"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { formatDate, formatIDR } from "@/lib/format"
import type { Order, OrderStatus } from "@/lib/mock-data"

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
] as const
type Filter = (typeof FILTERS)[number]["key"]

const matches: Record<Filter, (s: OrderStatus) => boolean> = {
  all: () => true,
  active: (s) => s === "revision" || s === "in_progress",
  completed: (s) => s === "completed",
  cancelled: (s) => s === "cancelled",
}

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  revision: { label: "Menunggu Revisi", className: "bg-rose-100 text-rose-800" },
  in_progress: { label: "Dalam Pengerjaan", className: "bg-slate-700 text-white" },
  completed: { label: "Selesai", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Dibatalkan", className: "bg-zinc-100 text-zinc-600" },
}

const ACTION: Record<OrderStatus, string> = {
  revision: "Lihat Proyek",
  in_progress: "Kirim File",
  completed: "Detail",
  cancelled: "Detail",
}

type Payout = { amount: number; bank: string; doneOn: string }

export function OrdersTable({ orders, payout }: { orders: Order[]; payout: Payout }) {
  const [filter, setFilter] = useState<Filter>("all")
  const rows = orders.filter((o) => matches[filter](o.status))

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-xl text-slate-900">Aktivitas Penjualan &amp; Pesanan</h2>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1 text-sm text-slate-700 hover:bg-slate-100",
                filter === f.key && "bg-slate-200 font-medium text-slate-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[56rem]">
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-wide">
              <TableHead className="pl-5">ID / Tanggal</TableHead>
              <TableHead>Kreator / Pembeli</TableHead>
              <TableHead>Layanan / Produk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead className="pr-5 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="py-3 pl-5">
                  <p className="font-medium text-slate-900">#{o.id}</p>
                  <p className="text-sm text-slate-700">{formatDate(o.date)}</p>
                </TableCell>
                <TableCell>{o.party}</TableCell>
                <TableCell className="max-w-64 whitespace-normal">{o.item}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-block whitespace-nowrap rounded-md px-3 py-1 text-sm",
                      STATUS[o.status].className
                    )}
                  >
                    {STATUS[o.status].label}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatIDR(o.amount)}</TableCell>
                <TableCell className="pr-5 text-center">
                  <Link
                    href={`/orders/${o.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-brand text-brand hover:bg-brand/5"
                    )}
                  >
                    {ACTION[o.status]}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  Belum ada pesanan di kategori ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4 text-sm text-slate-800">
        <p>
          Pencairan Terakhir: {formatIDR(payout.amount)} ke {payout.bank} (Selesai pada{" "}
          {payout.doneOn})
        </p>
        <p className="underline underline-offset-2">
          <Link href="/wallet">Riwayat Wallet</Link> / <Link href="/wallet/withdraw">Tarik Saldo</Link>
        </p>
      </div>
    </Card>
  )
}