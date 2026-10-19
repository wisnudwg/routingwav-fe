"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { PasswordInput } from "./password-input"

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Tautan tidak valid</h1>
        <p className="text-sm text-slate-600">
          Tautan reset password tidak lengkap atau sudah kedaluwarsa.
        </p>
        <Link href="/auth/forgot-password" className="inline-block text-sm font-medium text-brand hover:underline">
          Minta tautan baru
        </Link>
      </div>
    )
  }

  async function onSubmit(values: ResetPasswordValues) {
    // TODO: POST { token, password: values.password } to the API
    router.replace("/auth/sign-in")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Atur ulang password</h1>
        <p className="mt-1 text-sm text-slate-600">Buat password baru untuk akun Anda.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Password baru" htmlFor="password" error={errors.password?.message} hint="Minimal 8 karakter">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>
        <FormField label="Konfirmasi password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
          <PasswordInput
            id="confirm_password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm_password}
            {...register("confirm_password")}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Simpan password baru
        </Button>
      </form>
    </div>
  )
}