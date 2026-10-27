import type { ProfileKind } from "./roles"
import { jakartaDay } from "./wallet"

export const MAX_TEXT = 2000
export const MAX_AUDIO_MB = 100
export const AUDIO_ACCEPT = ".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav,audio/wave"

/** Authors can edit or delete their own messages for this long. Set to 0 to make messages permanent. */
export const EDIT_WINDOW_MINUTES = 15
export const EDIT_WINDOW_MS = EDIT_WINDOW_MINUTES * 60_000

export type AudioKind = "mp3" | "wav"
export type AttachmentRole = "deliverable" | "reference"
/** Placeholder until the Contracts module: the real value comes from the contract + payment state */
export type DealStatus = "none" | "in_progress" | "completed_paid"

export type Attachment = {
  id: string
  name: string
  size: number
  kind: AudioKind
  /** Seconds, when the browser could read it */
  duration?: number
  /** Decided by the server when the message is sent. Missing (old data) counts as the restrictive "deliverable". */
  role?: AttachmentRole
}

export type MessageSender = {
  side: "us" | "them"
  /** The party shown as the author: our profile/studio name, or the counterparty */
  party: string
  /** The individual acting for our party (team members only) */
  member?: string
}

export type MessageEdit = { at: string; text?: string }

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
  editedAt?: string
  deletedAt?: string
  deletedBy?: string
  /** Previous versions. Kept for disputes and never sent to browsers. */
  history?: MessageEdit[]
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
  dealStatus?: DealStatus
}

export type ConversationRow = Conversation & { unread: number }

export const roleOf = (a: Attachment): AttachmentRole => a.role ?? "deliverable"
export const dealOf = (c: Pick<Conversation, "dealStatus">): DealStatus => c.dealStatus ?? "none"

export const ROLE_LABEL: Record<AttachmentRole, string> = {
  deliverable: "Hasil kerja",
  reference: "Materi referensi",
}
export const DEAL_LABEL: Record<DealStatus, string> = {
  none: "Belum ada kontrak",
  in_progress: "Kontrak berjalan",
  completed_paid: "Selesai & dibayar",
}

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

/* ---------- edit / delete rules (the server repeats these) ---------- */

const windowText = `${EDIT_WINDOW_MINUTES} menit setelah dikirim`

export function editBlockReason(m: Message, me: string, now: number): string | null {
  if (m.deletedAt) return "Pesan sudah dihapus."
  if (m.from.side !== "us" || m.authorKey !== me) return "Anda hanya dapat mengubah pesan Anda sendiri."
  if (now - Date.parse(m.createdAt) > EDIT_WINDOW_MS) return `Pesan hanya dapat diubah dalam ${windowText}.`
  return null
}

export function deleteBlockReason(
  m: Message,
  me: string,
  isOwner: boolean,
  now: number,
  deal: DealStatus
): string | null {
  if (m.deletedAt) return "Pesan sudah dihapus."
  if (m.from.side !== "us" || (m.authorKey !== me && !isOwner)) return "Anda hanya dapat menghapus pesan Anda sendiri."
  if (now - Date.parse(m.createdAt) > EDIT_WINDOW_MS) return `Pesan hanya dapat dihapus dalam ${windowText}.`
  if (m.attachment && roleOf(m.attachment) === "deliverable" && deal !== "none") {
    return "File hasil kerja tidak dapat dihapus setelah kontrak berjalan."
  }
  return null
}

/* ---------- helpers ---------- */

/** Messages written by someone else, after this person last read (deleted ones don't count) */
export function unreadCount(messages: Message[], reads: Record<string, string>, me: string) {
  const since = reads[me] ?? ""
  return messages.filter(
    (m) => !m.deletedAt && m.createdAt > since && !(m.from.side === "us" && m.authorKey === me)
  ).length
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