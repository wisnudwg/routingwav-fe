"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { RoleFields } from "@/components/auth/profile-fields"
import { applyServerSession, setPreferredMode, useSession } from "@/lib/auth"
import { addProfile } from "@/lib/auth-api"
import { roleInput } from "@/lib/profile-payload"
import { KIND_INFO, PROFILE_KINDS } from "@/lib/roles"
import { DASHBOARD_HOME } from "@/lib/routes"
import { addProfileSchema, type AddProfileValues } from "@/lib/validators"

export function AddProfileForm() {
  const router = useRouter()
  const session = useSession()
  const [done, setDone] = useState(false)

  const missing = session ? PROFILE_KINDS.find((k) => !session.profiles.includes(k)) : undefined

  const form = useForm<AddProfileValues>({
    resolver: zodResolver(addProfileSchema),
    defaultValues: { kind: missing, roles: [], otherRole: "", instruments: "" },
  })

  if (!session || done) return null

  if (!missing) {
    return (
      <div className="space-y-3 rounded-lg border bg-white p-8">
        <p className="font-medium text-slate-900">Anda sudah memiliki profil Talent dan Client.</p>
        <Link href={DASHBOARD_HOME[session.mode ?? "talent"]} className="text-sm font-medium text-brand hover:underline">
          Kembali ke dashboard →
        </Link>
      </div>
    )
  }

  async function onSubmit(v: AddProfileValues) {
    const result = await addProfile(roleInput(v))
    if (!result.ok) {
      form.setError("roles", { message: result.message })
      return
    }
    setDone(true) // avoids a flash of the "you already have both" state
    applyServerSession(result.session)
    setPreferredMode(v.kind)
    router.replace(DASHBOARD_HOME[v.kind])
  }

  const info = KIND_INFO[missing]

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 md:p-8">
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">Tambah profil {info.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{info.desc}</p>
      </div>

      <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        Data akun Anda (kontak, alamat, dan verifikasi) dipakai bersama, jadi tidak perlu diisi
        ulang. Anda bisa beralih antara profil kapan saja dari header.
      </p>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <RoleFields />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Tambah profil {info.title}
          </Button>
        </form>
      </FormProvider>
    </div>
  )
}