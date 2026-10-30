"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { slugifyAlias } from "@/lib/alias"
import { applyServerSession, getSession, homeFor, setPreferredMode, useSession } from "@/lib/auth"
import { completeProfile } from "@/lib/auth-api"
import { applyFieldErrors } from "@/lib/form-errors"
import { profileInput } from "@/lib/profile-payload"
import { completeProfileSchema, type CompleteProfileValues } from "@/lib/validators"
import { AccountKindField } from "./account-kind-field"
import { AliasField } from "./alias-field"
import { ProfileFields } from "./profile-fields"
import { ServerError } from "./server-error"
import { TermsCheckbox } from "./terms-checkbox"

export function CompleteProfileForm() {
  const router = useRouter()
  const session = useSession()
  const [serverError, setServerError] = useState<string | null>(null)

  const name = session?.type === "root" ? session.name : undefined

  const form = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      accountAlias: slugifyAlias(name ?? ""),
      acceptTerms: false,
      phoneCountry: "ID",
      phoneNumber: "",
      country: "",
      address: "",
      roles: [],
      otherRole: "",
      instruments: "",
    },
  })

  async function onSubmit(v: CompleteProfileValues) {
    setServerError(null)
    const result = await completeProfile({ accountAlias: v.accountAlias, acceptTerms: true, ...profileInput(v) })

    if (!result.ok) {
      if (!applyFieldErrors(form.setError, result.fields, Object.keys(v))) setServerError(result.message)
      return
    }

    applyServerSession(result.session)
    setPreferredMode(v.kind)
    const next = getSession()
    router.replace(next ? homeFor(next) : "/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Halo{name ? `, ${name}` : ""}!</h1>
        <p className="mt-1 text-sm text-slate-600">
          Lengkapi data akun Anda untuk mulai menggunakan Routing.com.
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ServerError message={serverError} />
          <AccountKindField />
          <AliasField />
          <ProfileFields />
          <TermsCheckbox />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Simpan &amp; lanjutkan
          </Button>
        </form>
      </FormProvider>
    </div>
  )
}