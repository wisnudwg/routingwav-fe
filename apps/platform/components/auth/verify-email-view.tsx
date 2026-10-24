"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { verifyEmail } from "@/lib/auth-api"

type State = "idle" | "verifying" | "success" | "expired" | "invalid"

export function VerifyEmailView({ token }: { token?: string }) {
  const [state, setState] = useState<State>(token ? "idle" : "invalid")

  async function onVerify() {
    if (!token) return
    setState("verifying")
    const result = await verifyEmail(token)
    setState(result.ok ? "success" : result.reason)
  }

  if (state === "success") {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Email terverifikasi</h1>
        <p className="text-sm text-slate-600">Akun Anda aktif. Silakan masuk untuk melanjutkan.</p>
        <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
          Masuk →
        </Link>
      </div>
    )
  }

  if (state === "expired" || state === "invalid") {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          {state === "expired" ? "Tautan kedaluwarsa" : "Tautan tidak valid"}
        </h1>
        <p className="text-sm text-slate-600">
          Masuk dengan email dan password Anda untuk meminta tautan verifikasi baru.
        </p>
        <Link href="/auth/sign-in" className="inline-block text-sm font-medium text-brand hover:underline">
          Ke halaman masuk →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Verifikasi email</h1>
      <p className="text-sm text-slate-600">Satu langkah lagi untuk mengaktifkan akun Anda.</p>
      <Button onClick={onVerify} disabled={state === "verifying"} className="w-full">
        {state === "verifying" ? "Memverifikasi…" : "Verifikasi email saya"}
      </Button>
    </div>
  )
}