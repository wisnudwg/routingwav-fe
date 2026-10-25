import { cn } from "@workspace/ui/lib/utils"
import { STATUS_INFO, type KycStatus } from "@/lib/kyc"

const TONES = {
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
} as const

export function StatusBadge({ status, className }: { status: KycStatus; className?: string }) {
  const info = STATUS_INFO[status]
  return (
    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", TONES[info.tone], className)}>
      {info.label}
    </span>
  )
}