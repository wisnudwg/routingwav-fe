import { NextResponse } from "next/server"
import type { PushSubscription } from "web-push"
import { subscriptions } from "@/lib/push-server"

export async function POST(req: Request) {
  const { email, subscription } = (await req.json()) as {
    email?: string
    subscription?: PushSubscription
  }
  if (!email || !subscription?.endpoint || !subscription.keys) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  // TODO: authenticate the request and use the session's user id, not a client-sent email
  const list = (subscriptions.get(email) ?? []).filter((s) => s.endpoint !== subscription.endpoint)
  subscriptions.set(email, [...list, subscription])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = (await req.json()) as { endpoint?: string }
  for (const [email, list] of subscriptions) {
    subscriptions.set(email, list.filter((s) => s.endpoint !== endpoint))
  }
  return NextResponse.json({ ok: true })
}