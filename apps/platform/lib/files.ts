import { dealOf, roleOf, type Attachment, type Conversation, type Message } from "./messages"

export type DownloadState =
  | { allowed: true }
  | { allowed: false; reason: "no_permission" | "locked_until_paid" }

export type AccessState = { watermarked: boolean; download: DownloadState }

/**
 * - Our own uploads: clean playback, always downloadable (with the permission).
 * - Their reference material: clean, downloadable.
 * - Their deliverables: watermarked preview, downloadable only once the deal is completed and paid.
 */
export function accessRules(p: {
  message: Message
  attachment: Attachment
  conversation: Conversation
  mayDownload: boolean
}): AccessState {
  const own = p.message.from.side === "us"
  const paid = dealOf(p.conversation) === "completed_paid"
  const deliverable = roleOf(p.attachment) === "deliverable"

  const watermarked = !own && deliverable && !paid
  if (!p.mayDownload) return { watermarked, download: { allowed: false, reason: "no_permission" } }
  if (watermarked) return { watermarked, download: { allowed: false, reason: "locked_until_paid" } }
  return { watermarked, download: { allowed: true } }
}

/** File names come from users: strip path and control characters before they reach a download header */
export function sanitizeFilename(name: string) {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 120)
  return clean || "audio"
}