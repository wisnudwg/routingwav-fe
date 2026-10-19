import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Masuk | Routing.com" }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}