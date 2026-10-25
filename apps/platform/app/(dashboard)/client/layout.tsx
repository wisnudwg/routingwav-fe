import { ModeGate } from "@/components/auth/mode-gate"

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return <ModeGate mode="client">{children}</ModeGate>
}