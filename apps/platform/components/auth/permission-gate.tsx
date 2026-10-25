"use client"

import { Header } from "@/components/dashboard/header"
import { useSession } from "@/lib/auth"
import { can, type Permission } from "@/lib/permissions"

export function PermissionGate({
  permission,
  withHeader,
  children,
}: {
  permission: Permission
  withHeader?: boolean
  children: React.ReactNode
}) {
  const session = useSession()
  if (!session) return null
  if (can(session, permission)) return <>{children}</>

  const panel = (
    <div role="alert" className="rounded-lg border bg-white p-8 text-center">
      <p className="font-medium text-slate-900">Anda tidak memiliki akses ke halaman ini</p>
      <p className="mt-1 text-sm text-slate-600">
        Hubungi pemilik akun Anda jika Anda membutuhkannya.
      </p>
    </div>
  )

  return withHeader ? (
    <>
      <Header title="Akses ditolak" />
      <div className="p-6 md:p-8">{panel}</div>
    </>
  ) : (
    panel
  )
}