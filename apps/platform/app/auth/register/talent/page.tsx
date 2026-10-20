import type { Metadata } from "next"
import { RegisterTalentForm } from "@/components/auth/register-talent-form"

export const metadata: Metadata = { title: "Daftar | Routing.com" }

export default function RegisterPage() {
  return <RegisterTalentForm />
}