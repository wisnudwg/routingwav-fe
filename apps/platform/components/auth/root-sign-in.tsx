"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { storeSession } from "@/lib/auth"
import { signInRoot } from "@/lib/auth-api"
import { signInSchema, type SignInValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { GoogleButton, OrDivider } from "./google-button"
import { PasswordInput } from "./password-input"
import { ServerError } from "./server-error"

export function RootSignIn() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  async function onSubmit(values: SignInValues) {
    setServerError(null)
    const result = await signInRoot(values.email, values.password)
    if (!result.ok) return setServerError(result.message)
    storeSession(result.session)
    router.replace("/sales-orders")
  }

  return (
    <div className="space-y-6">
      <GoogleButton label="Masuk dengan Google" />
      <OrDivider text="atau dengan email" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ServerError message={serverError} />

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-sm text-brand hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Masuk
        </Button>
      </form>
    </div>
  )
}