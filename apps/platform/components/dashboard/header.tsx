import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Input } from "@workspace/ui/components/input"
import { MobileNavTrigger } from "./mobile-nav-trigger"
import { NotificationButton } from "@/components/pwa/notification-button"

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-white px-4 py-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNavTrigger />
        <h1 className="truncate font-display text-2xl text-slate-900 md:text-4xl">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input placeholder="Pencarian" className="bg-slate-50 pl-9" />
        </div>

        {/* <button className="relative" aria-label="Notifikasi">
          <Bell className="size-5 text-slate-600" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-600" />
        </button> */}
        <NotificationButton />

        <div className="flex items-center gap-3 rounded-lg border bg-white py-1.5 pl-1.5 pr-4 shadow-sm">
          <Avatar>
            <AvatarFallback>PR</AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight sm:block">
            <p className="font-semibold text-slate-900">Pratayangsha</p>
            <p className="text-sm text-slate-600">Talent</p>
          </div>
        </div>
      </div>
    </header>
  )
}