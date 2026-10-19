"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validators"
import { FormField } from "./form-field"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordValues) {
    // TODO: POST { email } to the API. The server emails a link like
    //   `${origin}/auth/reset-password?token=<one-time-token>`
    setSentTo(values.email)
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Cek email Anda</h1>
        <p className="text-sm text-slate-600">
          Jika <span className="font-medium text-slate-900">{sentTo}</span> terdaftar, kami telah
          mengirim tautan untuk mengatur ulang password. Tautan berlaku untuk waktu terbatas.
        </p>
        <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Lupa password?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Masukkan email Anda dan kami akan mengirim tautan reset.
        </p>
      </div>

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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Kirim tautan reset
        </Button>
      </form>

      <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
        ← Kembali ke halaman masuk
      </Link>
    </div>
  )
}