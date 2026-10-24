import type { Metadata } from "next"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ClientHomePlaceholder } from "@/components/dashboard/client-home-placeholder"

export const metadata: Metadata = { title: "Dashboard Client | Routing.com" }

export default function ClientHomePage() {
  return (
    <AuthGuard mode="client">
      <ClientHomePlaceholder />
    </AuthGuard>
  )
}