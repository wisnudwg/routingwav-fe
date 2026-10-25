"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { StepUpPrompt } from "@/components/account/step-up-prompt"
import { FormField } from "@/components/auth/form-field"
import { ServerError } from "@/components/auth/server-error"
import type { Actor } from "@/lib/approvals"
import { BANKS, addBankSchema, type AddBankValues, type BankSummary } from "@/lib/bank"
import { formatDateTime } from "@/lib/format"
import { digitsOnly } from "@/lib/kyc"
import { isElevated } from "@/lib/step-up"
import { addBankAccount, removeBankAccount, revealBankNumber } from "@/lib/wallet-api"

function AddBankForm({
  actor,
  verifiedName,
  onDone,
  onCancel,
}: {
  actor: Actor
  verifiedName?: string
  onDone: () => void
  onCancel: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddBankValues>({
    resolver: zodResolver(addBankSchema),
    defaultValues: { bankId: "", number: "", holderName: verifiedName ?? "", confirm: false },
  })

  const number = register("number")

  async function onSubmit(v: AddBankValues) {
    setServerError(null)
    const res = await addBankAccount(actor, v)
    if (!res.ok) return setServerError(res.message)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-lg border bg-slate-50 p-4">
      <ServerError message={serverError} />

      <FormField label="Bank" htmlFor="bankId" error={errors.bankId?.message}>
        <select
          id="bankId"
          aria-invalid={!!errors.bankId}
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
          {...register("bankId")}
        >
          <option value="">Pilih bank</option>
          {BANKS.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Nomor rekening" htmlFor="number" error={errors.number?.message}>
        <Input
          id="number"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={!!errors.number}
          {...number}
          onChange={(e) => {
            e.target.value = digitsOnly(e.target.value, 20)
            number.onChange(e)
          }}
        />
      </FormField>

      <FormField
        label="Nama pemilik rekening"
        htmlFor="holderName"
        error={errors.holderName?.message}
        hint={verifiedName ? `Harus sama dengan nama terverifikasi: ${verifiedName}` : undefined}
      >
        <Input id="holderName" autoComplete="off" aria-invalid={!!errors.holderName} {...register("holderName")} />
      </FormField>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 size-4 accent-brand" {...register("confirm")} />
          <span>Saya menyatakan rekening ini atas nama saya / badan usaha saya.</span>
        </label>
        {errors.confirm?.message && <p role="alert" className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>Simpan rekening</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  )
}

export function BankAccounts({
  actor,
  banks,
  canManage,
  verified,
  verifiedName,
  onChanged,
}: {
  actor: Actor
  banks: BankSummary[]
  canManage: boolean
  verified: boolean
  verifiedName?: string
  onChanged: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [pendingReveal, setPendingReveal] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Re-mask everything after a minute
  useEffect(() => {
    if (Object.keys(revealed).length === 0) return
    const t = setTimeout(() => setRevealed({}), 60_000)
    return () => clearTimeout(t)
  }, [revealed])

  async function doReveal(id: string) {
    const res = await revealBankNumber(actor, id)
    if (res.ok) setRevealed((r) => ({ ...r, [id]: res.data }))
    else setError(res.message)
  }

  function requestReveal(id: string) {
    setError(null)
    if (isElevated()) void doReveal(id)
    else setPendingReveal(id)
  }

  async function remove(id: string) {
    const res = await removeBankAccount(actor, id)
    setRemoving(null)
    if (!res.ok) return setError(res.message)
    onChanged()
  }

  return (
    <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium text-slate-900">Rekening bank</h2>
          <p className="text-xs text-slate-500">Tujuan penarikan saldo. Nomor lengkap hanya bisa dilihat pemilik akun.</p>
        </div>
        {canManage && !adding && verified && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="size-4" aria-hidden /> Tambah rekening
          </Button>
        )}
      </div>

      {canManage && !verified && (
        <p className="text-sm text-slate-600">
          Verifikasi identitas diperlukan sebelum menambah rekening, karena nama pemilik rekening harus sama dengan nama terverifikasi.
        </p>
      )}

      {adding && (
        <AddBankForm
          actor={actor}
          verifiedName={verifiedName}
          onDone={() => {
            setAdding(false)
            onChanged()
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {banks.length === 0 && !adding ? (
        <p className="text-sm text-slate-600">
          Belum ada rekening terdaftar.{!canManage && " Minta pemilik akun menambahkannya."}
        </p>
      ) : (
        <ul className="divide-y">
          {banks.map((b) => {
            const value = revealed[b.id]
            return (
              <li key={b.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{b.bankName}</p>
                    <p className="font-mono text-sm tracking-wide text-slate-700">{value ?? b.masked}</p>
                    <p className="text-xs text-slate-500">
                      {b.holderName} · ditambahkan {formatDateTime(b.createdAt)}
                    </p>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      {value ? (
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setRevealed({})}>
                          <EyeOff className="size-4" aria-hidden /> Sembunyikan
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => requestReveal(b.id)}>
                          <Eye className="size-4" aria-hidden /> Tampilkan
                        </Button>
                      )}
                      {removing === b.id ? (
                        <>
                          <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Ya, hapus</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>Batal</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(b.id)}>Hapus</Button>
                      )}
                    </div>
                  )}
                </div>

                {pendingReveal === b.id && (
                  <StepUpPrompt
                    onCancel={() => setPendingReveal(null)}
                    onConfirmed={() => {
                      setPendingReveal(null)
                      void doReveal(b.id)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ServerError message={error} />
    </section>
  )
}