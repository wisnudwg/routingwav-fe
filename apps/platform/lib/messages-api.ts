import { getAccountProfile } from "./account-api"
import { requesterKey, type Actor } from "./approvals"
import { deleteBlob, getBlob, putBlob } from "./audio-blob-store"
import { makeToneWav, readAudioInfo, sniffAudio } from "./audio-utils"
import {
  MAX_TEXT,
  audioKindOf,
  previewOf,
  unreadCount,
  validateAudioFile,
  type Attachment,
  type Conversation,
  type ConversationRow,
  type Message,
} from "./messages"
import { messagesStore } from "./messages-store"
import { notificationsStore } from "./notifications-store"
import { messageReceived } from "./notify-events"
import type { ProfileKind } from "./roles"
import type { ApiResult } from "./team-api"
import { teamStore } from "./team-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isProd = () => process.env.NODE_ENV === "production"

const NO_SEND = "Anda tidak memiliki izin untuk mengirim pesan."
const NOT_FOUND = "Percakapan tidak ditemukan."

/** Checked on every call. A real server does this from the session, never from client input. */
function mayUse(actor: Actor, permission: "messages:view" | "messages:send") {
  if (actor.kind === "root") return true
  const m = teamStore.find(actor.alias, actor.username)
  return !!m && m.status === "active" && m.permissions.includes(permission)
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
  return conversation ? { conversation, messages: messagesStore.messages(actor.alias, id) } : null
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

/* ---------- sending ---------- */

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

  if (input.attachment) {
    const stored = await getBlob(input.attachment.id)
    if (!stored || stored.size !== input.attachment.size) {
      return { ok: false, message: "Lampiran tidak ditemukan. Unggah ulang file Anda." }
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
    attachment: input.attachment,
    createdAt: now,
  }
  messagesStore.insertMessage(message)
  messagesStore.updateConversation(actor.alias, conv.id, {
    lastMessageAt: now,
    lastPreview: previewOf(message),
    reads: { ...conv.reads, [requesterKey(actor)]: now }, // the sender has read up to here
  })
  return { ok: true, data: message }
}

/* ---------- DEV ONLY: a simulated counterparty ---------- */

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
  const blob = makeToneWav(4, freq)
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    name: `preview-mix-${Math.floor(Math.random() * 90 + 10)}.wav`,
    size: blob.size,
    kind: "wav",
    duration: 4,
  }
  await putBlob(attachment.id, blob)
  deliverIncoming(conv, "Ini preview terbarunya, mohon didengarkan.", attachment)
  return { ok: true, data: undefined }
}