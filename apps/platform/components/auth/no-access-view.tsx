"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { clearSession, homeFor, useSession } from "@/lib/auth"

export function NoAccessView() {
  const router = useRouter()
  const session = useSession()

  const show = !!session && !session.pending && !session.mode

  useEffect(() => {
    if (session === null) router.replace("/auth/sign-in")
    else if (session && !show) router.replace(homeFor(session))
  }, [session, show, router])

  if (!show) return null

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Belum ada akses</h1>
      <p className="text-sm text-slate-600">
        Akun Anda sudah aktif, tetapi pemilik akun belum memberi Anda izin ke area mana pun.
        Hubungi pemilik akun Anda, lalu masuk kembali.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          clearSession()
          router.replace("/auth/sign-in")
        }}
      >
        Keluar
      </Button>
    </main>
  )
}