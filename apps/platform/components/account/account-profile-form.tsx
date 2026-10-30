"use client"

import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { FormField } from "@/components/auth/form-field"
import { ContactFields } from "@/components/auth/profile-fields"
import { NoOwner } from "@/components/team/team-view"
import { getAccountProfile, updateAccountProfile } from "@/lib/account-api"
import { displayName, useSession } from "@/lib/auth"
import { accountProfileSchema, type AccountProfileValues } from "@/lib/validators"
import { MockNotice } from "./mock-notice"

export function AccountProfileForm() {
  const session = useSession()
  const root = session?.type === "root" ? session : null
  const alias = root?.alias
  const fallbackName = root ? displayName(root) : ""

  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const form = useForm<AccountProfileValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: { name: "", phoneCountry: "ID", phoneNumber: "", country: "", address: "" },
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  useEffect(() => {
    if (!alias) return
    let cancelled = false
    getAccountProfile(alias).then((p) => {
      if (cancelled) return
      reset({
        name: p?.name ?? fallbackName,
        phoneCountry: p?.phoneCountry ?? "ID",
        phoneNumber: p?.phoneNumber ?? "",
        country: p?.country ?? "",
        address: p?.address ?? "",
      })
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [alias, fallbackName, reset])

  if (session === undefined) return null
  if (!root || !alias) return <NoOwner />
  if (!ready) return <p className="text-sm text-slate-500">Memuat…</p>

  async function onSubmit(values: AccountProfileValues) {
    if (!root || !alias) return
    setNotice(null)
    const res = await updateAccountProfile(alias, root.email, values)
    if (!res.ok) return setNotice(res.message)
    reset(values)
    setNotice("Perubahan disimpan.")
  }

  return (
    <div className="space-y-6">
      <MockNotice />

      <section className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-2 md:p-6">
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="truncate text-sm text-slate-900">{root.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">ID akun</p>
          <p className="font-mono text-sm text-slate-900">{alias}</p>
          <p className="mt-0.5 text-xs text-slate-500">Dipakai tim untuk masuk, tidak bisa diubah.</p>
        </div>
      </section>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="font-medium text-slate-900">Data akun</h2>

          <FormField label="Nama" htmlFor="name" error={errors.name?.message}>
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