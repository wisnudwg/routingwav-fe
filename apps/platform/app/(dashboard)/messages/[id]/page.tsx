import { ThreadView } from "@/components/messages/thread-view"

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ThreadView key={id} id={id} />
}