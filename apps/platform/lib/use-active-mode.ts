"use client"

import { usePathname } from "next/navigation"
import { useSession } from "./auth"
import type { ProfileKind } from "./roles"
import { modeFromPath } from "./routes"

/** The mode in the URL if there is one, otherwise the last-used mode */
export function useActiveMode(): ProfileKind | null {
  const pathname = usePathname()
  const session = useSession()
  return modeFromPath(pathname) ?? session?.mode ?? null
}