import type { Metadata } from "next"
import { NoAccessView } from "@/components/auth/no-access-view"

export const metadata: Metadata = { title: "Belum ada akses | Routing.com" }

export default function NoAccessPage() {
  return <NoAccessView />
}