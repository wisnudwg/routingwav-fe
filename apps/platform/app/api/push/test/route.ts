import { NextResponse } from "next/server"
import { getWebPush, subscriptions } from "@/lib/push-server"

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { email, title, body, url, tag } = await req.json()
  const webpush = getWebPush()
  const list = subscriptions.get(email) ?? []
  const payload = JSON.stringify({ title, body, url, tag })

  const results = await Promise.all(
    list.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload)
        return { endpoint: sub.endpoint, ok: true }
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // subscription is dead, so remove it
          subscriptions.set(email, (subscriptions.get(email) ?? []).filter((s) => s.endpoint !== sub.endpoint))
        }
        return { endpoint: sub.endpoint, ok: false, status }
      }
    })
  )
  return NextResponse.json({ sent: results.length, results })
}