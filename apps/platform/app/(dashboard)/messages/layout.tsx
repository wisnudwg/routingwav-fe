import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { MessagesShell } from "@/components/messages/messages-shell"

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate permission="messages:view" withHeader>
      <Header title="Messages" />
      <MessagesShell>{children}</MessagesShell>
    </PermissionGate>
  )
}