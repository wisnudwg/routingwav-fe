import { api, toFail, type Fail } from "./api"
import type { ActivityPage } from "./api-types"

export type { ActivityEvent } from "./api-types"
export type ActivityCategory = "all" | "auth" | "team" | "account"

export async function fetchActivity(
  category: ActivityCategory,
  cursor?: string | null,
): Promise<({ ok: true } & ActivityPage) | Fail> {
  const q = new URLSearchParams({ category, limit: "30" })
  if (cursor) q.set("cursor", cursor)
  try {
    return { ok: true, ...(await api<ActivityPage>(`/account/activity?${q}`)) }
  } catch (e) {
    return toFail(e)
  }
}