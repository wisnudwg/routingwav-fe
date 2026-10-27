import { cn } from "@workspace/ui/lib/utils"
import { formatTime, type Message } from "@/lib/messages"
import { AudioPlayer } from "./audio-player"

export function MessageBubble({ message, showMeta }: { message: Message; showMeta: boolean }) {
  const mine = message.from.side === "us"

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start", showMeta && "mt-3")}>
      {showMeta && (
        <p className="mb-1 px-1 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{message.from.party}</span>
          {message.from.member && <> · oleh {message.from.member}</>}
          {" · "}
          {formatTime(message.createdAt)}
        </p>
      )}

      <div
        className={cn(
          "max-w-[88%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[75%]",
          mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border bg-white text-slate-900"
        )}
      >
        {message.text && <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>}
        {message.attachment && (
          <div className="w-64 max-w-full sm:w-72">
            <AudioPlayer attachment={message.attachment} tone={mine ? "dark" : "light"} />
          </div>
        )}
      </div>
    </div>
  )
}