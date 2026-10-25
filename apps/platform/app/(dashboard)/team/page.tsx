import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { TeamView } from "@/components/team/team-view"

export default function TeamPage() {
  return (
    <>
      <Header title="Team" />
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <PermissionGate permission="team:manage">
          <TeamView />
        </PermissionGate>
      </div>
    </>
  )
}