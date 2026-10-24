import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = { title: "Masuk | Routing.com" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; account?: string }>
}) {
  const { type, account } = await searchParams
  return <SignInForm initialType={type === "iam" ? "iam" : "root"} initialAccount={account} />
}