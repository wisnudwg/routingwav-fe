import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { DelegationView } from "@/components/team/delegation-view"

export default function DelegationPage() {
  return (
    <>
      <Header title="Delegasi persetujuan" />
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <PermissionGate permission="team:manage">
          <DelegationView />
        </PermissionGate>
      </div>
    </>
  )
}