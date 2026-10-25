import { Search } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { NotificationButton } from "@/components/pwa/notification-button"
import { MobileNavTrigger } from "./mobile-nav-trigger"
import { ModeSwitcher } from "./mode-switcher"
import { ProfileMenu } from "./profile-menu"

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-white px-4 py-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNavTrigger />
        <h1 className="truncate font-display text-2xl text-slate-900 md:text-4xl">{title}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative hidden w-64 lg:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input placeholder="Pencarian" className="bg-slate-50 pl-9" />
        </div>

        <ModeSwitcher className="hidden md:inline-flex" />
        <NotificationButton />
        <ProfileMenu />
      </div>
    </header>
  )
}