import { AuthGuard } from "@/components/auth/auth-guard"
import { MobileNavProvider } from "@/components/dashboard/nav-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { VerificationBanner } from "@/components/account/verification-banner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MobileNavProvider>
        <div className="min-h-screen md:grid md:grid-cols-[15.5rem_1fr]">
          <Sidebar />
          <div className="min-w-0 bg-slate-50">
            <VerificationBanner />
            {children}
          </div>
        </div>
      </MobileNavProvider>
    </AuthGuard>
  )
}