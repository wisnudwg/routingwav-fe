import { NextResponse } from "next/server"
import type { PushSubscription } from "web-push"
import { subscriptions } from "@/lib/push-server"

export async function POST(req: Request) {
  const { key, subscription } = (await req.json()) as { key?: string; subscription?: PushSubscription }
  if (!key || !subscription?.endpoint || !subscription.keys) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  // TODO: authenticate the request and derive the key from the session, never from the body
  const list = (subscriptions.get(key) ?? []).filter((s) => s.endpoint !== subscription.endpoint)
  subscriptions.set(key, [...list, subscription])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = (await req.json()) as { endpoint?: string }
  for (const [email, list] of subscriptions) {
    subscriptions.set(email, list.filter((s) => s.endpoint !== endpoint))
  }
  return NextResponse.json({ ok: true })
}