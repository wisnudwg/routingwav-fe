import { redirect } from "next/navigation"
import { DASHBOARD_HOME } from "@/lib/routes"

export default function TalentIndex() {
  redirect(DASHBOARD_HOME.client)
}