import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[15.5rem_1fr]">
      <Sidebar />
      <div className="min-w-0 bg-slate-50">{children}</div>
    </div>
  )
}