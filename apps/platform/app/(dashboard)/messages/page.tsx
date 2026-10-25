import { ComingSoon } from "@/components/dashboard/coming-soon"

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      permission="messages:view"
      description="Chat dan pertukaran file audio (mp3/wav) akan ada di sini."
    />
  )
}