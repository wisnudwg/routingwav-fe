import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Input } from "@workspace/ui/components/input"

export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b bg-white px-6 py-4 md:px-8">
      <h1 className="font-display text-3xl text-slate-900 md:text-4xl">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input placeholder="Pencarian" className="bg-slate-50 pl-9" />
        </div>

        <button className="relative" aria-label="Notifikasi">
          <Bell className="size-5 text-slate-600" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-600" />
        </button>

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