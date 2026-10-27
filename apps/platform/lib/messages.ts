import type { ProfileKind } from "./roles"
import { jakartaDay } from "./wallet"

export const MAX_TEXT = 2000
export const MAX_AUDIO_MB = 100
export const AUDIO_ACCEPT = ".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav,audio/wave"

export type AudioKind = "mp3" | "wav"

export type Attachment = {
  id: string
  name: string
  size: number
  kind: AudioKind
  /** Seconds, when the browser could read it */
  duration?: number
}

export type MessageSender = {
  side: "us" | "them"
  /** The party shown as the author: our profile/studio name, or the counterparty */
  party: string
  /** The individual acting for our party (team members only) */
  member?: string
}

export type Message = {
  id: string
  conversationId: string
  account: string
  from: MessageSender
  /** Our side only: "owner" or the member's username (drives per-person read state) */
  authorKey?: string
  text?: string
  attachment?: Attachment
  createdAt: string
}

export type Counterparty = { id: string; name: string; kind: ProfileKind }

export type Conversation = {
  id: string
  account: string
  /** Which of our profiles this conversation belongs to */
  ourKind: ProfileKind
  counterparty: Counterparty
  subject: string
  createdAt: string
  lastMessageAt: string
  lastPreview: string
  /** "owner" or username → ISO time they last read */
  reads: Record<string, string>
}

export type ConversationRow = Conversation & { unread: number }

/* ---------- audio rules ---------- */

const WAV_TYPES = ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"]
const MP3_TYPES = ["audio/mpeg", "audio/mp3"]

/** Extension and MIME type must agree (an empty MIME type is allowed: some Windows setups report none) */
export function audioKindOf(file: { name: string; type: string }): AudioKind | null {
  const ext = file.name.toLowerCase().split(".").pop()
  const type = file.type.toLowerCase()
  if (ext === "mp3" && (type === "" || MP3_TYPES.includes(type))) return "mp3"
  if (ext === "wav" && (type === "" || WAV_TYPES.includes(type))) return "wav"
  return null
}

/** Cheap checks first. Content sniffing and a decode check follow in the upload step. */
export function validateAudioFile(file: File): string | null {
  if (file.size === 0) return "File kosong."
  if (!audioKindOf(file)) return "Hanya file MP3 atau WAV yang didukung."
  if (file.size > MAX_AUDIO_MB * 1024 * 1024) return `Ukuran maksimal ${MAX_AUDIO_MB} MB.`
  return null
}

/* ---------- helpers ---------- */

/** Messages written by someone else, after this person last read */
export function unreadCount(messages: Message[], reads: Record<string, string>, me: string) {
  const since = reads[me] ?? ""
  return messages.filter((m) => m.createdAt > since && !(m.from.side === "us" && m.authorKey === me)).length
}

export function previewOf(m: Pick<Message, "text" | "attachment">) {
  const text = m.text?.trim()
  if (text) return text.slice(0, 80)
  return m.attachment ? `File audio: ${m.attachment.name}` : ""
}

export function formatDayLabel(iso: string) {
  const day = jakartaDay(iso)
  if (day === jakartaDay(Date.now())) return "Hari ini"
  if (day === jakartaDay(Date.now() - 86_400_000)) return "Kemarin"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(iso))
}

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso))