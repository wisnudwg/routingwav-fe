"use client"

import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { FormField } from "@/components/auth/form-field"
import { ContactFields } from "@/components/auth/profile-fields"
import { ServerError } from "@/components/auth/server-error"
import { NoOwner } from "@/components/team/team-view"
import { getAccountProfile, updateAccountProfile, type AccountProfile } from "@/lib/account-api"
import { refreshSession, useSession } from "@/lib/auth"
import { applyFieldErrors } from "@/lib/form-errors"
import { accountProfileSchema, type AccountProfileValues } from "@/lib/validators"

const toValues = (p: AccountProfile): AccountProfileValues => ({
  name: p.name,
  phoneCountry: p.phoneCountry || "ID",
  phoneNumber: p.phoneNumber,
  country: p.country,
  address: p.address,
})

export function AccountProfileForm() {
  const session = useSession()
  const isOwner = session?.type === "root"

  const [info, setInfo] = useState<{ email: string; alias: string } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const form = useForm<AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: { name: "", phoneCountry: "ID", phoneNumber: "", country: "", address: "" },
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = form

  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    getAccountProfile().then((res) => {
      if (cancelled) return
      if (!res.ok) return setLoadError(res.message)
      reset(toValues(res.data))
      setInfo({ email: res.data.email, alias: res.data.alias })
    })
    return () => {
      cancelled = true
    }
  }, [isOwner, reset])

  if (session === undefined) return null
  if (!isOwner) return <NoOwner />
  if (loadError) return <p role="alert" className="text-sm text-destructive">{loadError}</p>
  if (!info) return <p className="text-sm text-slate-500">Memuat…</p>

  async function onSubmit(values: AccountProfileValues) {
    setServerError(null)
    setNotice(null)
    const res = await updateAccountProfile(values)
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.fields, Object.keys(values))) setServerError(res.message)
      return
    }
    reset(toValues(res.data)) // shows what the server stored (e.g. a phone number without its leading zero)
    await refreshSession() // the header picks up the new name
    setNotice("Perubahan disimpan.")
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-2 md:p-6">
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="truncate text-sm text-slate-900">{info.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">ID akun</p>
          <p className="font-mono text-sm text-slate-900">{info.alias}</p>
          <p className="mt-0.5 text-xs text-slate-500">Dipakai tim untuk masuk, tidak bisa diubah.</p>
        </div>
      </section>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="font-medium text-slate-900">Data akun</h2>
          <ServerError message={serverError} />

          <FormField
            label="Nama"
            htmlFor="name"
            error={errors.name?.message}
            hint="Nama tampilan. Nama resmi untuk kontrak dan rekening berasal dari verifikasi identitas."
          >
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
          </FormField>

          <ContactFields />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting || !isDirty}>Simpan perubahan</Button>
            {notice && <span role="status" className="text-sm text-green-700">{notice}</span>}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}