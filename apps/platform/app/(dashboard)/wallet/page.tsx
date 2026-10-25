import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { WalletView } from "@/components/wallet/wallet-view"

export default function WalletPage() {
  return (
    <>
      <Header title="Wallet" />
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <PermissionGate permission="wallet:view">
          <WalletView />
        </PermissionGate>
      </div>
    </>
  )
}