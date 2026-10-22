import webpush, { type PushSubscription } from "web-push"

let configured = false
export function getWebPush() {
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    configured = true
  }
  return webpush
}

// DEV ONLY: replace with a database table (user_id, endpoint, p256dh, auth)
const g = globalThis as unknown as { __pushSubs?: Map<string, PushSubscription[]> }
export const subscriptions = (g.__pushSubs ??= new Map<string, PushSubscription[]>())