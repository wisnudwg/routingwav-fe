"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth"
import { useKycStatus } from "@/lib/use-kyc-status"

export function VerificationBanner() {
  const session = useSession()
  const status = useKycStatus()

  if (session?.type !== "root" || (status !== "not_started" && status !== "rejected")) return null

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 md:px-8"
    >
      <span>
        {status === "rejected"
          ? "Verifikasi identitas ditolak. Perbarui data Anda untuk melanjutkan."
          : "Verifikasi identitas diperlukan untuk transaksi dan kontrak."}
      </span>
      <Link href="/account/verification" className="font-medium underline underline-offset-2">
        Verifikasi sekarang
      </Link>
    </div>
  )
}