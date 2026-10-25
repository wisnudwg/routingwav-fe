// actor.ts
import type { Actor } from "./approvals"
import { sessionId, type Session } from "./auth"

export function actorOf(s: Session): Actor | null {
  if (s.type === "root") return s.alias ? { kind: "root", alias: s.alias, label: s.email } : null
  return { kind: "iam", alias: s.account, username: s.username, label: sessionId(s) }
}