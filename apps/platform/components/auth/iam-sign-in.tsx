"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { applyServerSession, getRememberedAccount, getSession, homeFor, rememberAccount } from "@/lib/auth"
import { signInIam } from "@/lib/auth-api"
import { iamSignInSchema, type IamSignInValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { PasswordInput } from "./password-input"
import { ServerError } from "./server-error"

export function IamSignIn({ initialAccount }: { initialAccount?: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IamSignInValues>({
    resolver: zodResolver(iamSignInSchema),
    defaultValues: { account: initialAccount ?? "", username: "", password: "", remember: true },
  })

  // Pre-fill the last used account (a ?account= link takes priority)
  useEffect(() => {
    if (initialAccount) return
    const saved = getRememberedAccount()
    if (saved) setValue("account", saved)
  }, [initialAccount, setValue])

  async function onSubmit(values: IamSignInValues) {
    setServerError(null)
    const account = values.account.trim().toLowerCase()
    const result = await signInIam(account, values.username, values.password)
    if (!result.ok) return setServerError(result.message)

    rememberAccount(values.remember ? account : null)
    applyServerSession(result.session)
    const next = getSession()
    router.replace(next ? homeFor(next) : "/")
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ServerError message={serverError} />

        <FormField
          label="ID akun atau alias"
          htmlFor="iam-account"
          error={errors.account?.message}
          hint="Diberikan oleh pemilik akun Anda"
        >
          <Input
            id="iam-account"
            autoComplete="organization"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="mis. studio-abc"
            aria-invalid={!!errors.account}
            {...register("account")}
          />
        </FormField>

        <FormField label="Username" htmlFor="iam-username" error={errors.username?.message}>
          <Input
            id="iam-username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.username}
            {...register("username")}
          />
        </FormField>

        <FormField label="Password" htmlFor="iam-password" error={errors.password?.message}>
          <PasswordInput
            id="iam-password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand" {...register("remember")} />
          Ingat ID akun ini di perangkat ini
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Masuk
        </Button>
      </form>

      <p className="text-xs leading-relaxed text-slate-500">
        Lupa password? Anggota tim tidak bisa mengatur ulang sendiri. Hubungi pemilik akun Anda
        untuk membuat password baru.
      </p>
    </div>
  )
}