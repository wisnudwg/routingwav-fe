import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { MemberCreate } from "@/components/team/member-create"

export default function NewMemberPage() {
  return (
    <>
      <Header title="Tambah anggota" />
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <PermissionGate permission="team:manage">
          <MemberCreate />
        </PermissionGate>
      </div>
    </>
  )
}