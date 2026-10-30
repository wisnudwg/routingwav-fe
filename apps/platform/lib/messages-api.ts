import { getAccountProfile } from "./mock-bridge"
import { requesterKey, type Actor } from "./approvals"
import { logEvent } from "./audit"
import { deleteBlob, getBlob, putBlob } from "./audio-blob-store"
import { makeToneWav, readAudioInfo, sniffAudio } from "./audio-utils"
import { accessRules, sanitizeFilename, type AccessState } from "./files"
import {
  MAX_TEXT,
  audioKindOf,
  dealOf,
  deleteBlockReason,
  editBlockReason,
  previewOf,
  unreadCount,
  validateAudioFile,
  type Attachment,
  type Conversation,
  type ConversationRow,
  type DealStatus,
  type Message,
} from "./messages"
import { messagesStore } from "./messages-store"
import { notificationsStore } from "./notifications-store"
import { filesUnlocked, messageReceived } from "./notify-events"
import type { ProfileKind } from "./roles"
import type { ApiResult } from "./team-api"
import { teamStore } from "./team-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isProd = () => process.env.NODE_ENV === "production"

const NO_SEND = "Anda tidak memiliki izin untuk mengirim pesan."
const NOT_FOUND = "Percakapan tidak ditemukan."
const MSG_NOT_FOUND = "Pesan tidak ditemukan."

type MsgPermission = "messages:view" | "messages:send" | "files:download"

/** Checked on every call. A real server does this from the session, never from client input. */
function mayUse(actor: Actor, permission: MsgPermission) {
  if (actor.kind === "root") return true
  const m = teamStore.find(actor.alias, actor.username)
  return !!m && m.status === "active" && m.permissions.includes(permission)
}

/** What a browser may receive. Previous versions and deleted content never leave the server. */
function forClient(m: Message): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    account: m.account,
    from: m.from,
    authorKey: m.authorKey,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    deletedBy: m.deletedBy,
    ...(m.deletedAt ? {} : { text: m.text, attachment: m.attachment }),
  }
}

export type Thread = { conversation: Conversation; messages: Message[] }

export async function listConversations(actor: Actor): Promise<ConversationRow[]> {
  await sleep(150)
  if (!mayUse(actor, "messages:view")) return []
  const me = requesterKey(actor)
  const all = messagesStore.accountMessages(actor.alias)

  return messagesStore
    .conversations(actor.alias)
    .map((c) => ({
      ...c,
      unread: unreadCount(all.filter((m) => m.conversationId === c.id), c.reads, me),
    }))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
}

export async function getUnreadTotal(actor: Actor): Promise<number> {
  if (!mayUse(actor, "messages:view")) return 0
  const me = requesterKey(actor)
  const all = messagesStore.accountMessages(actor.alias)
  return messagesStore
    .conversations(actor.alias)
    .reduce((sum, c) => sum + unreadCount(all.filter((m) => m.conversationId === c.id), c.reads, me), 0)
}

export async function getThread(actor: Actor, id: string): Promise<Thread | null> {
  await sleep(150)
  if (!mayUse(actor, "messages:view")) return null
  const conversation = messagesStore.conversation(actor.alias, id)
  if (!conversation) return null
  return { conversation, messages: messagesStore.messages(actor.alias, id).map(forClient) }
}

/** Marks the conversation read for this person only, and clears its bell items */
export async function markConversationRead(actor: Actor, id: string): Promise<void> {
  if (!mayUse(actor, "messages:view")) return
  const conv = messagesStore.conversation(actor.alias, id)
  if (!conv) return
  const me = requesterKey(actor)
  messagesStore.updateConversation(actor.alias, id, { reads: { ...conv.reads, [me]: new Date().toISOString() } })
  notificationsStore.markReadByUrl(actor.alias, me, `/messages/${id}`)
}

/* ---------- audio upload ---------- */

export async function uploadAttachment(
  actor: Actor,
  file: File,
  onProgress: (fraction: number) => void
): Promise<ApiResult<Attachment>> {
  if (!mayUse(actor, "messages:send")) return { ok: false, message: NO_SEND }

  const problem = validateAudioFile(file)
  if (problem) return { ok: false, message: problem }

  // Trust the bytes, not the file name
  const sniffed = await sniffAudio(file)
  if (!sniffed || sniffed !== audioKindOf(file)) {
    return { ok: false, message: "Isi file tidak cocok dengan format MP3/WAV. File mungkin rusak atau diganti namanya." }
  }

  const info = await readAudioInfo(file)
  if (!info.ok) return { ok: false, message: "File audio tidak bisa dibaca atau rusak." }

  // MOCK: simulated progress. A real upload PUTs to a presigned URL (XHR/fetch with progress) in the browser,
  // so the file never passes through this app's server.
  const id = crypto.randomUUID()
  try {
    for (let i = 1; i <= 8; i++) {
      await sleep(70)
      onProgress((i / 8) * 0.9)
    }
    await putBlob(id, file)
  } catch {
    return { ok: false, message: "Gagal menyimpan file. Penyimpanan browser mungkin penuh." }
  }
  onProgress(1)

  return {
    ok: true,
    data: { id, name: file.name.slice(0, 120), size: file.size, kind: sniffed, duration: info.duration },
  }
}

export async function discardAttachment(id: string): Promise<void> {
  await deleteBlob(id)
}

/* ---------- send / edit / delete ---------- */

export async function sendMessage(
  actor: Actor,
  conversationId: string,
  input: { text?: string; attachment?: Attachment }
): Promise<ApiResult<Message>> {
  await sleep(250)
  if (!mayUse(actor, "messages:send")) return { ok: false, message: NO_SEND }

  const conv = messagesStore.conversation(actor.alias, conversationId)
  if (!conv) return { ok: false, message: NOT_FOUND }

  const text = input.text?.trim() || undefined
  if (text && text.length > MAX_TEXT) return { ok: false, message: `Pesan maksimal ${MAX_TEXT} karakter.` }
  if (!text && !input.attachment) return { ok: false, message: "Pesan kosong." }

  let attachment: Attachment | undefined
  if (input.attachment) {
    const stored = await getBlob(input.attachment.id)
    if (!stored || stored.size !== input.attachment.size) {
      return { ok: false, message: "Lampiran tidak ditemukan. Unggah ulang file Anda." }
    }
    // The server decides the role: only Talent-side uploads can be deliverables
    attachment = {
      ...input.attachment,
      role: conv.ourKind === "talent" && input.attachment.role !== "reference" ? "deliverable" : "reference",
    }
  }

  const profile = await getAccountProfile(actor.alias)
  const member =
    actor.kind === "iam"
      ? teamStore.find(actor.alias, actor.username)?.displayName || actor.username
      : undefined
  const now = new Date().toISOString()

  const message: Message = {
    id: crypto.randomUUID(),
    conversationId: conv.id,
    account: actor.alias,
    from: { side: "us", party: profile?.name?.trim() || actor.alias, member },
    authorKey: requesterKey(actor),
    text,
    attachment,
    createdAt: now,
  }
  messagesStore.insertMessage(message)
  messagesStore.updateConversation(actor.alias, conv.id, {
    lastMessageAt: now,
    lastPreview: previewOf(message),
    reads: { ...conv.reads, [requesterKey(actor)]: now }, // the sender has read up to here
  })
  return { ok: true, data: forClient(message) }
}

function isLatest(account: string, conversationId: string, messageId: string) {
  const list = messagesStore.messages(account, conversationId)
  return list[list.length - 1]?.id === messageId
}

export async function editMessage(
  actor: Actor,
  conversationId: string,
  messageId: string,
  rawText: string
): Promise<ApiResult<Message>> {
  await sleep(200)
  if (!mayUse(actor, "messages:send")) return { ok: false, message: NO_SEND }

  const conv = messagesStore.conversation(actor.alias, conversationId)
  const msg = messagesStore.message(actor.alias, messageId)
  if (!conv || !msg || msg.conversationId !== conv.id) return { ok: false, message: MSG_NOT_FOUND }

  const blocked = editBlockReason(msg, requesterKey(actor), Date.now())
  if (blocked) return { ok: false, message: blocked }

  const text = rawText.trim() || undefined
  if (text && text.length > MAX_TEXT) return { ok: false, message: `Pesan maksimal ${MAX_TEXT} karakter.` }
  if (!text && !msg.attachment) return { ok: false, message: "Pesan tidak boleh kosong." }
  if (text === msg.text) return { ok: true, data: forClient(msg) } // nothing changed

  const updated = messagesStore.updateMessage(actor.alias, msg.id, {
    text,
    editedAt: new Date().toISOString(),
    history: [...(msg.history ?? []), { at: msg.editedAt ?? msg.createdAt, text: msg.text }],
  })
  if (!updated) return { ok: false, message: MSG_NOT_FOUND }

  if (isLatest(actor.alias, conv.id, msg.id)) {
    messagesStore.updateConversation(actor.alias, conv.id, { lastPreview: previewOf(updated) })
  }
  return { ok: true, data: forClient(updated) }
}

export async function deleteMessage(actor: Actor, conversationId: string, messageId: string): Promise<ApiResult> {
  await sleep(200)
  if (!mayUse(actor, "messages:send")) return { ok: false, message: NO_SEND }

  const conv = messagesStore.conversation(actor.alias, conversationId)
  const msg = messagesStore.message(actor.alias, messageId)
  if (!conv || !msg || msg.conversationId !== conv.id) return { ok: false, message: MSG_NOT_FOUND }

  const blocked = deleteBlockReason(msg, requesterKey(actor), actor.kind === "root", Date.now(), dealOf(conv))
  if (blocked) return { ok: false, message: blocked }

  // Soft delete: the original stays on the server for disputes. Browsers only ever get the tombstone.
  messagesStore.updateMessage(actor.alias, msg.id, {
    deletedAt: new Date().toISOString(),
    deletedBy: requesterKey(actor),
  })
  if (isLatest(actor.alias, conv.id, msg.id)) {
    messagesStore.updateConversation(actor.alias, conv.id, { lastPreview: "Pesan dihapus" })
  }
  return { ok: true, data: undefined }
}

/* ---------- playback and download (the API decides, the UI only reflects it) ---------- */

function resolveAttachment(actor: Actor, conversationId: string, messageId: string) {
  if (!mayUse(actor, "messages:view")) return null
  const conversation = messagesStore.conversation(actor.alias, conversationId)
  const message = messagesStore.message(actor.alias, messageId)
  if (!conversation || !message || message.conversationId !== conversation.id) return null
  if (message.deletedAt || !message.attachment) return null
  return { conversation, message, attachment: message.attachment }
}

export async function getAttachmentAccess(
  actor: Actor,
  conversationId: string,
  messageId: string
): Promise<AccessState | null> {
  const r = resolveAttachment(actor, conversationId, messageId)
  if (!r) return null
  return accessRules({ ...r, mayDownload: mayUse(actor, "files:download") })
}

/**
 * MOCK: both cases return the same bytes. A real server returns a URL to the separately rendered watermarked
 * preview while access.watermarked is true, and the original only once the buyer is entitled.
 */
export async function getAttachmentBlob(actor: Actor, conversationId: string, messageId: string): Promise<Blob | null> {
  const r = resolveAttachment(actor, conversationId, messageId)
  return r ? getBlob(r.attachment.id) : null
}

export async function downloadAttachment(
  actor: Actor,
  conversationId: string,
  messageId: string
): Promise<ApiResult<{ blob: Blob; filename: string }>> {
  await sleep(200)
  const r = resolveAttachment(actor, conversationId, messageId)
  if (!r) return { ok: false, message: "File tidak ditemukan." }

  const { download } = accessRules({ ...r, mayDownload: mayUse(actor, "files:download") })
  if (!download.allowed) {
    return {
      ok: false,
      message:
        download.reason === "locked_until_paid"
          ? "File ini baru bisa diunduh setelah kontrak selesai dan dibayar."
          : "Anda tidak memiliki izin mengunduh file.",
    }
  }

  const blob = await getBlob(r.attachment.id)
  if (!blob) return { ok: false, message: "File tidak ditemukan." }

  logEvent(actor.alias, actor.label, "file_downloaded", `${r.attachment.name} · ${r.conversation.counterparty.name}`)
  return { ok: true, data: { blob, filename: sanitizeFilename(r.attachment.name) } }
}

/* ---------- DEV ONLY: a simulated counterparty and deal ---------- */

const SAMPLE_TEXTS = [
  "Halo! Bisa kirim revisi mix-nya hari ini?",
  "Terima kasih, sudah saya dengarkan. Ada sedikit catatan di bagian chorus.",
  "Deadline-nya masih hari Jumat ya?",
  "Oke, saya setuju dengan arahnya. Silakan lanjut.",
]

function deliverIncoming(conv: Conversation, text?: string, attachment?: Attachment) {
  const now = new Date().toISOString()
  const message: Message = {
    id: crypto.randomUUID(),
    conversationId: conv.id,
    account: conv.account,
    from: { side: "them", party: conv.counterparty.name },
    text,
    attachment,
    createdAt: now,
  }
  messagesStore.insertMessage(message)
  messagesStore.updateConversation(conv.account, conv.id, { lastMessageAt: now, lastPreview: previewOf(message) })
  messageReceived({ account: conv.account, conversationId: conv.id, from: conv.counterparty.name, hasAudio: !!attachment })
}

export async function devStartConversation(
  actor: Actor,
  input: { name: string; subject: string; ourKind: ProfileKind }
): Promise<ApiResult<{ id: string }>> {
  await sleep(250)
  if (isProd()) return { ok: false, message: "Tidak tersedia." }

  const now = new Date().toISOString()
  const conv: Conversation = {
    id: crypto.randomUUID(),
    account: actor.alias,
    ourKind: input.ourKind,
    counterparty: {
      id: crypto.randomUUID(),
      name: input.name.trim() || "Rina Pratiwi",
      kind: input.ourKind === "talent" ? "client" : "talent",
    },
    subject: input.subject.trim() || "Diskusi proyek",
    createdAt: now,
    lastMessageAt: now,
    lastPreview: "",
    reads: {},
    dealStatus: "none",
  }
  messagesStore.insertConversation(conv)
  deliverIncoming(conv, SAMPLE_TEXTS[0])
  return { ok: true, data: { id: conv.id } }
}

export async function devIncoming(actor: Actor, id: string, type: "text" | "audio"): Promise<ApiResult> {
  await sleep(200)
  if (isProd()) return { ok: false, message: "Tidak tersedia." }
  const conv = messagesStore.conversation(actor.alias, id)
  if (!conv) return { ok: false, message: NOT_FOUND }

  if (type === "text") {
    deliverIncoming(conv, SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)])
    return { ok: true, data: undefined }
  }

  const freq = [440, 523, 659][Math.floor(Math.random() * 3)]!
  const blob = makeToneWav(30, freq) // long enough to hear the 4 s and 24 s watermark tags
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    name: `preview-mix-${Math.floor(Math.random() * 90 + 10)}.wav`,
    size: blob.size,
    kind: "wav",
    duration: 30,
    role: conv.counterparty.kind === "talent" ? "deliverable" : "reference",
  }
  await putBlob(attachment.id, blob)
  deliverIncoming(conv, "Ini file terbarunya, mohon didengarkan.", attachment)
  return { ok: true, data: undefined }
}

/** Stands in for the contract + payment state until the Contracts module exists */
export async function devSetDealStatus(actor: Actor, id: string, status: DealStatus): Promise<ApiResult> {
  await sleep(200)
  if (isProd()) return { ok: false, message: "Tidak tersedia." }
  const conv = messagesStore.conversation(actor.alias, id)
  if (!conv) return { ok: false, message: NOT_FOUND }

  const before = dealOf(conv)
  messagesStore.updateConversation(actor.alias, id, { dealStatus: status })
  if (status === "completed_paid" && before !== "completed_paid" && conv.ourKind === "client") {
    filesUnlocked({ account: actor.alias, conversationId: id })
  }
  return { ok: true, data: undefined }
}