"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { slugifyAlias } from "@/lib/alias"
import { storeSession, useSession } from "@/lib/auth"
import { completeRootProfile } from "@/lib/auth-api"
import { buildProfilePayload } from "@/lib/profile-payload"
import { completeProfileSchema, type CompleteProfileValues } from "@/lib/validators"
import { AliasField } from "./alias-field"
import { ProfileFields } from "./profile-fields"
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
    if (session?.type !== "root") return
    setServerError(null)

    const result = await completeRootProfile(buildProfilePayload(v))
    if (!result.ok) {
      form.setError("accountAlias", { message: result.message })
      return
    }

    // Profile done → drop the pending step
    storeSession({ type: "root", email: session.email, name: session.name })
    router.replace("/sales-orders")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          Halo{name ? `, ${name}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Lengkapi data akun Anda untuk mulai menggunakan Routing.com.
        </p>
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">{serverError}</p>
      )}

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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