"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { storeEmail, useStoredEmail } from "@/lib/auth"
import { signInSchema, type SignInValues } from "@/lib/validators"
import { FormField } from "./form-field"
import { GoogleButton, OrDivider } from "./google-button"
import { PasswordInput } from "./password-input"

export function SignInForm() {
  const router = useRouter()
  const storedEmail = useStoredEmail()

  // Already signed in → skip the form
  useEffect(() => {
    if (storedEmail) router.replace("/sales-orders")
  }, [storedEmail, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  async function onSubmit(values: SignInValues) {
    // TODO: POST credentials to the API and handle errors
    storeEmail(values.email.trim().toLowerCase())
    router.replace("/sales-orders")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">Selamat datang kembali di Routing.com.</p>
      </div>

      <GoogleButton label="Masuk dengan Google" />
      <OrDivider text="atau dengan email" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

      <p className="text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link href="/auth/register/talent" className="font-medium text-brand hover:underline">
          Daftar sebagai Talent
        </Link>
        {" "}/{" "}
        <Link href="/auth/register/client" className="font-medium text-brand hover:underline">
          Daftar sebagai Client
        </Link>
      </p>
    </div>
  )
}