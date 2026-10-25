"use client"

import { usePathname } from "next/navigation"
import { routePermission } from "@/lib/nav-config"
import { PermissionGate } from "./permission-gate"

export function RouteGate({ children }: { children: React.ReactNode }) {
  const permission = routePermission(usePathname())
  if (!permission) return <>{children}</>
  return (
    <PermissionGate permission={permission} withHeader>
      {children}
    </PermissionGate>
  )
}