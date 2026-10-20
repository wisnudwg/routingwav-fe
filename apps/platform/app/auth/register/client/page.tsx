import type { Metadata } from "next"
import { RegisterClientForm } from "@/components/auth/register-client-form"

export const metadata: Metadata = { title: "Daftar | Routing.com" }

export default function RegisterPage() {
  return <RegisterClientForm />
}