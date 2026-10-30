"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { forgotPassword } from "@/lib/auth-api"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await forgotPassword(values.email) // same answer whether or not the email exists
    if (!result.ok) return setError("email", { message: result.message })
    setSentTo(values.email)
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Password-reset link sent!</h1>
        <p className="text-sm text-slate-600">
          We have sent a password-reset link to <span className="font-medium text-slate-900">{sentTo}</span>.
          Click on the link to reset your password.
          The link expires in 10 minutes.
        </p>
        <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we&apos;ll send you a password-reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="email@domain.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Send password-reset link
        </Button>
      </form>

      <p className="text-xs leading-relaxed text-slate-500">
        Ini untuk akun pemilik. Anggota tim (IAM) tidak bisa mengatur ulang sendiri, hubungi pemilik
        akun Anda.
      </p>
      <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
        ← Back to sign in
      </Link>
    </div>
  )
}