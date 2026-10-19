import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = { title: "Masuk | Routing.com" }

export default function SignInPage() {
  return <SignInForm />
}