"use client"

import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { ConversationList } from "./conversation-list"

export function MessagesShell({ children }: { children: React.ReactNode }) {
  const open = usePathname() !== "/messages" // a conversation is open

  return (
    <div className="flex h-[calc(100dvh-4.75rem)] min-h-112 overflow-hidden border-t bg-white">
      <aside className={cn("w-full shrink-0 border-r md:w-80 lg:w-96", open ? "hidden md:block" : "block")}>
        <ConversationList />
      </aside>
      <section className={cn("min-w-0 flex-1", open ? "block" : "hidden md:block")}>{children}</section>
    </div>
  )
}