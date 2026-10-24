import type { Metadata } from "next"
import { VerifyEmailView } from "@/components/auth/verify-email-view"

export const metadata: Metadata = { title: "Verifikasi Email | Routing.com" }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <VerifyEmailView token={token} />
}