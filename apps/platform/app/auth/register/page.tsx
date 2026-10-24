import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"
import { SessionGate } from "@/components/auth/session-gate"

export const metadata: Metadata = { title: "Daftar | Routing.com" }

export default function RegisterPage() {
  return (
    <SessionGate mode="guest">
      <RegisterForm />
    </SessionGate>
  )
}