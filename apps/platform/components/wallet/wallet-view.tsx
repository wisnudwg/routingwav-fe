"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { APPROVALS_EVENT } from "@/lib/approvals-store"
import type { BankSummary } from "@/lib/bank"
import { useSession } from "@/lib/auth"
import { formatIDR } from "@/lib/format"
import { getKycStatus, getKycSummary, KYC_EVENT } from "@/lib/kyc-api"
import { can } from "@/lib/permissions"
import { useActor } from "@/lib/use-actor"
import { MIN_WITHDRAWAL, PAYOUT_HOURS, WITHDRAWAL_FEE_BPS, type WalletSummary } from "@/lib/wallet"
import { devAddFunds, devSettleWithdrawals, getWallet, listBankAccounts } from "@/lib/wallet-api"
import { WALLET_EVENT } from "@/lib/wallet-store"
import { BankAccounts } from "./bank-accounts"
import { TransactionsTable } from "./transactions-table"
import { WithdrawForm } from "./withdraw-form"

type Data = { wallet: WalletSummary; banks: BankSummary[]; verified: boolean; verifiedName?: string }

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border bg-white px-5 py-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  )
}

export function WalletView() {
  const session = useSession()
  const actor = useActor()
  const alias = actor?.alias

  const [data, setData] = useState<Data | null>(null)
  const [notice, setNotice] = useState<"executed" | "pending" | null>(null)

  useEffect(() => {
    if (!alias || !actor) return
    let cancelled = false
    const load = async () => {
      const [wallet, banks, status, summary] = await Promise.all([
        getWallet(alias),
        listBankAccounts(alias),
        getKycStatus(alias),
        // Names are for the owner only. Team members get the status badge, nothing more.
        actor.kind === "root" ? getKycSummary(alias) : Promise.resolve(null),
      ])
      if (cancelled) return
      setData({
        wallet,
        banks,
        verified: status === "verified",
        verifiedName: summary?.names.legalName ?? summary?.names.fullName,
      })
    }
    void load()
    for (const e of [WALLET_EVENT, APPROVALS_EVENT, KYC_EVENT]) window.addEventListener(e, load)
    return () => {
      cancelled = true
      for (const e of [WALLET_EVENT, APPROVALS_EVENT, KYC_EVENT]) window.removeEventListener(e, load)
    }
  }, [alias, actor])

  if (!session || !actor) return null
  if (!data) return <p className="text-sm text-slate-500">Memuat…</p>

  const { wallet, banks, verified, verifiedName } = data
  const isOwner = actor.kind === "root"
  const processing = wallet.txs.some((t) => t.status === "processing")

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Saldo tersedia" value={formatIDR(wallet.available)} />
        <Stat label="Dana ditahan" value={formatIDR(wallet.held)} note="Menunggu persetujuan penarikan" />
        <Stat label="Total saldo" value={formatIDR(wallet.balance)} />
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        Biaya penarikan {WITHDRAWAL_FEE_BPS / 100}% · minimal {formatIDR(MIN_WITHDRAWAL)} · dana masuk dalam 1×
        {PAYOUT_HOURS} jam · batas harian {formatIDR(wallet.dailyLimit)} (terpakai {formatIDR(wallet.dailyUsed)}, sisa{" "}
        {formatIDR(wallet.dailyRemaining)}).
      </p>

      {can(session, "wallet:withdraw") && (
        <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="font-medium text-slate-900">{isOwner ? "Tarik saldo" : "Ajukan penarikan saldo"}</h2>

          {notice && (
            <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {notice === "executed" ? (
                `Penarikan diproses. Dana masuk ke rekening dalam 1×${PAYOUT_HOURS} jam.`
              ) : (
                <>
                  Permintaan penarikan dikirim dan menunggu persetujuan.{" "}
                  <Link href="/approvals" className="font-medium underline">Lihat status</Link>
                </>
              )}
            </p>
          )}

          <WithdrawForm
            actor={actor}
            banks={banks}
            available={wallet.available}
            dailyRemaining={wallet.dailyRemaining}
            verified={verified}
            onDone={setNotice}
          />
        </section>
      )}

      <BankAccounts
        actor={actor}
        banks={banks}
        canManage={isOwner}
        verified={verified}
        verifiedName={verifiedName}
        onChanged={() => window.dispatchEvent(new Event(WALLET_EVENT))}
      />

      <TransactionsTable txs={wallet.txs} />

      {process.env.NODE_ENV !== "production" && isOwner && (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <p className="text-xs text-slate-600">Dev: uji batas harian dan status pencairan</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => devAddFunds(actor, 30_000_000)}>
              Tambah saldo Rp 30.000.000
            </Button>
            <Button size="sm" variant="outline" disabled={!processing} onClick={() => devSettleWithdrawals(actor)}>
              Selesaikan pencairan yang diproses
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}