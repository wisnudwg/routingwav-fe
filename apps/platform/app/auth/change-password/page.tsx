import type { Metadata } from "next"
import { ChangePasswordForm } from "@/components/auth/change-password-form"
import { SessionGate } from "@/components/auth/session-gate"

export const metadata: Metadata = { title: "Ganti Password | Routing.com" }

export default function ChangePasswordPage() {
  return (
    <SessionGate mode="pending" step="change-password">
      <ChangePasswordForm />
    </SessionGate>
  )
}