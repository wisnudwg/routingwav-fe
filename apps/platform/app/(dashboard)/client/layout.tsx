import { ModeGate } from "@/components/auth/mode-gate"
import { RouteGate } from "@/components/auth/route-gate"

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModeGate mode="client">
      <RouteGate>{children}</RouteGate>
    </ModeGate>
  )
}