"use client"

import { useRouter } from "next/navigation"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { slugifyAlias } from "@/lib/alias"
import { homeFor, storeSession, useSession } from "@/lib/auth"
import { completeRootProfile } from "@/lib/auth-api"
import { buildProfilePayload } from "@/lib/profile-payload"
import { completeProfileSchema, type CompleteProfileValues } from "@/lib/validators"
import { AccountKindField } from "./account-kind-field"
import { AliasField } from "./alias-field"
import { ProfileFields } from "./profile-fields"
import { TermsCheckbox } from "./terms-checkbox"

export function CompleteProfileForm() {
  const router = useRouter()
  const session = useSession()

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

    const result = await completeRootProfile(buildProfilePayload(v))
    if (!result.ok) {
      form.setError("accountAlias", { message: result.message })
      return
    }

    // First profile created → drop the pending step and activate it
    const next = {
      type: "root" as const,
      email: session.email,
      name: session.name,
      alias: v.accountAlias,
      profiles: [v.kind],
      mode: v.kind,
    }
    storeSession(next)
    router.replace(homeFor(next))
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

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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