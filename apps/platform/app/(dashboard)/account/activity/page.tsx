import { ActivityLog } from "@/components/account/activity-log"
import { PermissionGate } from "@/components/auth/permission-gate"

export default function ActivityPage() {
  return (
    <PermissionGate permission="activity:view">
      <ActivityLog />
    </PermissionGate>
  )
}