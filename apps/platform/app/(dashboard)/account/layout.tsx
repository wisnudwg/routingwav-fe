import { PermissionGate } from "@/components/auth/permission-gate"
import { AccountTabs } from "@/components/account/account-tabs"
import { Header } from "@/components/dashboard/header"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header title="Account" />
      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
        <PermissionGate permission="account:manage">
          <AccountTabs />
          {children}
        </PermissionGate>
      </div>
    </>
  )
}