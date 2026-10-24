import type { Metadata } from "next"
import { CompleteProfileForm } from "@/components/auth/complete-profile-form"
import { SessionGate } from "@/components/auth/session-gate"

export const metadata: Metadata = { title: "Lengkapi Profil | Routing.com" }

export default function CompleteProfilePage() {
  return (
    <SessionGate mode="pending" step="complete-profile">
      <CompleteProfileForm />
    </SessionGate>
  )
}