import type { Conversation, Message } from "./messages"
import { readJson, writeJson } from "./mock-db"

export const MESSAGES_EVENT = "messages-change"

const CKEY = "mock:conversations:v1"
const MKEY = "mock:messages:v1"

const emit = () => window.dispatchEvent(new Event(MESSAGES_EVENT))
const allConversations = () => readJson<Conversation[]>(CKEY, [])
const allMessages = () => readJson<Message[]>(MKEY, [])

export const messagesStore = {
  conversations: (account: string) => allConversations().filter((c) => c.account === account),

  conversation: (account: string, id: string) =>
    allConversations().find((c) => c.account === account && c.id === id) ?? null,

  insertConversation(c: Conversation) {
    writeJson(CKEY, [...allConversations(), c])
    emit()
  },

  updateConversation(account: string, id: string, patch: Partial<Conversation>) {
    const all = allConversations()
    const i = all.findIndex((c) => c.account === account && c.id === id)
    if (i < 0) return null
    all[i] = { ...all[i]!, ...patch }
    writeJson(CKEY, all)
    emit()
    return all[i]!
  },

  messages: (account: string, conversationId: string) =>
    allMessages()
      .filter((m) => m.account === account && m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),

  accountMessages: (account: string) => allMessages().filter((m) => m.account === account),

  insertMessage(m: Message) {
    writeJson(MKEY, [...allMessages(), m].slice(-2000))
    emit()
  },

  message: (account: string, id: string) =>
    allMessages().find((m) => m.account === account && m.id === id) ?? null,

  updateMessage(account: string, id: string, patch: Partial<Message>) {
    const all = allMessages()
    const i = all.findIndex((m) => m.account === account && m.id === id)
    if (i < 0) return null
    all[i] = { ...all[i]!, ...patch }
    writeJson(MKEY, all)
    emit()
    return all[i]!
  },
}