"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { verifyMemberEmail } from "@/lib/member-email-api"

type State = "idle" | "verifying" | "success" | "expired" | "invalid"

export function VerifyMemberEmailView({ token }: { token?: string }) {
  const [state, setState] = useState<State>(token ? "idle" : "invalid")

  async function onVerify() {
    if (!token) return
    setState("verifying")
    const result = await verifyMemberEmail(token)
    setState(result.ok ? "success" : result.reason)
  }

  if (state === "success") {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Email terverifikasi</h1>
        <p className="text-sm text-slate-600">
          Anda kini bisa menerima notifikasi lewat email. Atur jenis notifikasinya setelah masuk, di menu Notifikasi.
        </p>
        <Link href="/auth/sign-in?type=iam" className="inline-block text-sm font-medium text-brand hover:underline">
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
          Minta pemilik akun Anda mengirim ulang email verifikasi dari halaman Team.
        </p>
        <Link href="/auth/sign-in?type=iam" className="inline-block text-sm font-medium text-brand hover:underline">
          Ke halaman masuk →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Verifikasi email notifikasi</h1>
      <p className="text-sm text-slate-600">
        Alamat ini akan menerima notifikasi Routing.com. Email tidak dipakai untuk masuk atau mengatur ulang password.
      </p>
      <Button onClick={onVerify} disabled={state === "verifying"} className="w-full">
        {state === "verifying" ? "Memverifikasi…" : "Verifikasi email saya"}
      </Button>
    </div>
  )
}