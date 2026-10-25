import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { MemberManage } from "@/components/team/member-manage"

export default async function ManageMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <Header title="Kelola anggota" />
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <PermissionGate permission="team:manage">
          <MemberManage id={id} />
        </PermissionGate>
      </div>
    </>
  )
}