"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { PasswordInput, PasswordSpecifications } from "./password-input"

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
        <h1 className="font-heading text-3xl font-bold text-slate-900">Invalid link</h1>
        <p className="text-sm text-slate-600">
          The password-reset link is either incomplete or expired.
        </p>
        <Link href="/auth/forgot-password" className="inline-block text-sm font-medium text-brand hover:underline">
          Request new password-reset link
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
        <h1 className="font-heading text-3xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-600">Create new password for your account.</p>
        <PasswordSpecifications />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="New Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>
        <FormField label="Confirm Password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
          <PasswordInput
            id="confirm_password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm_password}
            {...register("confirm_password")}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Submit new password
        </Button>
      </form>
    </div>
  )
}