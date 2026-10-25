import { ComingSoon, titleFromSlug } from "@/components/dashboard/coming-soon"

export default async function TalentPlaceholder({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ComingSoon title={titleFromSlug(slug)} />
}