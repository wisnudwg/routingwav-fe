import type { Metadata } from "next"
import { VerifyMemberEmailView } from "@/components/auth/verify-member-email-view"

export const metadata: Metadata = { title: "Verifikasi Email | Routing.com" }

export default async function VerifyMemberEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <VerifyMemberEmailView token={token} />
}