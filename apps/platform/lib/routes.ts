import type { ProfileKind } from "./roles"

export const DASHBOARD_HOME: Record<ProfileKind, string> = {
  talent: "/talent/sales-orders", // switch to /talent/dashboard once that page is designed
  client: "/client/dashboard",
}

export function modeFromPath(pathname: string): ProfileKind | null {
  if (pathname === "/talent" || pathname.startsWith("/talent/")) return "talent"
  if (pathname === "/client" || pathname.startsWith("/client/")) return "client"
  return null
}