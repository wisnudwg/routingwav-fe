"use client"

import Link from "next/link"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { slugifyAlias } from "@/lib/alias"
import { registerRoot } from "@/lib/auth-api"
import { buildProfilePayload } from "@/lib/profile-payload"
import { registerSchema, type RegisterValues } from "@/lib/validators"
import { AliasField } from "./alias-field"
import { FormField } from "./form-field"
import { GoogleButton, OrDivider } from "./google-button"
import { PasswordInput } from "./password-input"
import { ProfileFields } from "./profile-fields"
import { ResendVerification } from "./resend-verification"
import { ServerError } from "./server-error"
import { TermsCheckbox } from "./terms-checkbox"

export function RegisterForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
      accountAlias: "",
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

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = form

  async function onSubmit(v: RegisterValues) {
    setServerError(null)
    const email = v.email.trim().toLowerCase()

    const result = await registerRoot({
      name: v.name.trim(),
      email,
      password: v.password,
      ...buildProfilePayload(v),
    })

    if (!result.ok) {
      setError("accountAlias", { message: result.message })
      return
    }
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Cek email Anda</h1>
        <p className="text-sm text-slate-600">
          Kami mengirim tautan verifikasi ke{" "}
          <span className="font-medium text-slate-900">{sentTo}</span>. Klik tautan itu untuk
          mengaktifkan akun, lalu masuk.
        </p>
        <ResendVerification email={sentTo} />
        <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
          Ke halaman masuk →
        </Link>
      </div>
    )
  }

  const nameField = register("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Buat akun pemilik</h1>
        <p className="mt-1 text-sm text-slate-600">
          Anda akan menjadi pemilik akun dan bisa menambahkan anggota tim nanti.
        </p>
      </div>

      <GoogleButton mode="sign-up" label="Daftar dengan Google" />
      <OrDivider text="atau isi manual" />

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ServerError message={serverError} />

          <FormField label="Nama" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...nameField}
              onChange={(e) => {
                nameField.onChange(e)
                // Suggest an alias from the name until the user edits the alias themselves
                if (!dirtyFields.accountAlias) setValue("accountAlias", slugifyAlias(e.target.value))
              }}
            />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
            </FormField>
            <FormField label="Konfirmasi password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
              <PasswordInput id="confirm_password" autoComplete="new-password" aria-invalid={!!errors.confirm_password} {...register("confirm_password")} />
            </FormField>
          </div>

          <AliasField />
          <ProfileFields />
          <TermsCheckbox />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Daftar
          </Button>
        </form>
      </FormProvider>

      <div className="space-y-1 text-center text-sm text-slate-600">
        <p>
          Sudah punya akun?{" "}
          <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">
            Masuk
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          Bergabung ke tim? Akun anggota tim dibuat oleh pemilik akun, bukan lewat halaman ini.
        </p>
      </div>
    </div>
  )
}