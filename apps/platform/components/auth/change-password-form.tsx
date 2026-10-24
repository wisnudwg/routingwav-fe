"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { clearSession, storeSession, useSession } from "@/lib/auth"
import { changeIamPassword } from "@/lib/auth-api"
import { changePasswordSchema, type NewPasswordValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { PasswordInput } from "./password-input"
import { ServerError } from "./server-error"

export function ChangePasswordForm() {
  const router = useRouter()
  const session = useSession()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(v: NewPasswordValues) {
    if (session?.type !== "iam") return
    setServerError(null)

    const result = await changeIamPassword(v.password)
    if (!result.ok) return setServerError(result.message)

    storeSession({ type: "iam", account: session.account, username: session.username, profiles: session.profiles })
    router.replace("/sales-orders")
  }

  function cancel() {
    clearSession()
    router.replace("/auth/sign-in")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Ganti password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Password sementara Anda harus diganti sebelum melanjutkan.
          {session?.type === "iam" && (
            <>
              {" "}Masuk sebagai{" "}
              <span className="font-medium text-slate-900">
                {session.username} @ {session.account}
              </span>
              .
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ServerError message={serverError} />

        <FormField label="Password baru" htmlFor="password" error={errors.password?.message} hint="Minimal 8 karakter">
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </FormField>

        <FormField label="Konfirmasi password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
          <PasswordInput id="confirm_password" autoComplete="new-password" aria-invalid={!!errors.confirm_password} {...register("confirm_password")} />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Simpan password baru
        </Button>
      </form>

      <button type="button" onClick={cancel} className="text-sm text-slate-600 hover:underline">
        Batal dan keluar
      </button>
    </div>
  )
}