"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ServerError } from "@/components/auth/server-error"
import type { Actor } from "@/lib/approvals"
import type { BankSummary } from "@/lib/bank"
import { formatIDR } from "@/lib/format"
import { digitsOnly } from "@/lib/kyc"
import { MIN_WITHDRAWAL, PAYOUT_HOURS, WITHDRAWAL_FEE_BPS, feeFor } from "@/lib/wallet"
import { requestWithdrawal } from "@/lib/wallet-api"

export function WithdrawForm({
  actor,
  banks,
  available,
  dailyRemaining,
  verified,
  onDone,
}: {
  actor: Actor
  banks: BankSummary[]
  available: number
  dailyRemaining: number
  verified: boolean
  onDone: (mode: "executed" | "pending") => void
}) {
  const [bankId, setBankId] = useState("")
  const [digits, setDigits] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isOwner = actor.kind === "root"
  const bank = banks.find((b) => b.id === bankId) ?? banks[0]
  const amount = Number(digits || 0)
  const maxAmount = Math.max(Math.min(available, dailyRemaining), 0)

  const tooLow = amount > 0 && amount < MIN_WITHDRAWAL
  const overBalance = amount > available
  const overDaily = !overBalance && amount > dailyRemaining
  const fee = feeFor(amount)
  const canSubmit = verified && !!bank && amount >= MIN_WITHDRAWAL && !overBalance && !overDaily && !busy

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!bank || !canSubmit) return
    setBusy(true)
    setError(null)
    const res = await requestWithdrawal(actor, { bankAccountId: bank.id, amount })
    setBusy(false)
    if (!res.ok) return setError(res.message)
    setDigits("")
    onDone(res.data.mode)
  }

  if (!verified) {
    return (
      <p className="text-sm text-slate-600">
        Penarikan memerlukan identitas akun yang terverifikasi.{" "}
        {isOwner ? (
          <Link href="/account/verification" className="font-medium text-brand hover:underline">
            Verifikasi sekarang
          </Link>
        ) : (
          "Hubungi pemilik akun Anda."
        )}
      </p>
    )
  }

  if (banks.length === 0) {
    return <p className="text-sm text-slate-600">Tambahkan rekening bank terlebih dahulu untuk menarik saldo.</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ServerError message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="wd-bank" className="text-sm font-medium text-slate-800">Rekening tujuan</label>
          <select
            id="wd-bank"
            value={bank?.id ?? ""}
            onChange={(e) => setBankId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.bankName} {b.masked}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="wd-amount" className="text-sm font-medium text-slate-800">Jumlah (Rp)</label>
          <div className="flex gap-2">
            <Input
              id="wd-amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder={String(MIN_WITHDRAWAL)}
              value={digits}
              aria-invalid={tooLow || overBalance || overDaily}
              onChange={(e) => setDigits(digitsOnly(e.target.value, 12))}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setDigits(String(maxAmount))}>
              Maks
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {amount > 0 ? formatIDR(amount) : `Minimal ${formatIDR(MIN_WITHDRAWAL)}`}
            {tooLow && <span className="text-destructive"> · di bawah minimum</span>}
            {overBalance && <span className="text-destructive"> · melebihi saldo tersedia</span>}
            {overDaily && (
              <span className="text-destructive"> · melebihi sisa batas harian ({formatIDR(dailyRemaining)})</span>
            )}
          </p>
        </div>
      </div>

      {amount >= MIN_WITHDRAWAL && (
        <dl className="space-y-1.5 rounded-md bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Jumlah ditarik</dt>
            <dd className="text-slate-900">{formatIDR(amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Biaya penarikan ({WITHDRAWAL_FEE_BPS / 100}%)</dt>
            <dd className="text-slate-900">−{formatIDR(fee)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
            <dt className="text-slate-800">Diterima di rekening</dt>
            <dd className="text-slate-900">{formatIDR(amount - fee)}</dd>
          </div>
          <p className="pt-1 text-xs text-slate-500">
            Estimasi dana masuk dalam 1×{PAYOUT_HOURS} jam setelah disetujui dan diproses.
          </p>
        </dl>
      )}

      {!isOwner && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Penarikan oleh anggota tim perlu disetujui pemilik akun (atau penerima delegasi). Dana ditahan
          sampai ada keputusan, dan biaya di atas dikunci saat Anda mengajukan.
        </p>
      )}

      <Button type="submit" disabled={!canSubmit}>
        {isOwner ? "Tarik saldo" : "Ajukan penarikan"}
      </Button>
    </form>
  )
}