"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth"
import { IamSignIn } from "./iam-sign-in"
import { RootSignIn } from "./root-sign-in"
import { UserTypeSwitch, type UserType } from "./user-type-switch"

export function SignInForm({
  initialType = "root",
  initialAccount,
}: {
  initialType?: UserType
  initialAccount?: string
}) {
  const router = useRouter()
  const session = useSession()
  const [type, setType] = useState<UserType>(initialType)

  // Already signed in → skip the form
  useEffect(() => {
    if (session) router.replace("/sales-orders")
  }, [session, router])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-600">Selamat datang kembali di Routing.com.</p>
      </div>

      <UserTypeSwitch value={type} onChange={setType} />

      {type === "root" ? (
        <RootSignIn key="root" />
      ) : (
        <IamSignIn key="iam" initialAccount={initialAccount} />
      )}

      <p className="text-center text-sm text-slate-600">
        {type === "root" ? (
          <>
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-medium text-brand hover:underline">
              Daftar
            </Link>
          </>
        ) : (
          "Akun anggota tim dibuat oleh pemilik akun. Belum punya? Minta pemilik akun Anda membuatkannya."
        )}
      </p>
    </div>
  )
}