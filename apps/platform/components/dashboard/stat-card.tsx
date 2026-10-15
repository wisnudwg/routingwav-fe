import { Card } from "@workspace/ui/components/card"

export function StatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: React.ReactNode
}) {
  return (
    <Card className="gap-1 px-5 py-4">
      <p className="text-lg text-slate-800">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{note}</p>
    </Card>
  )
}