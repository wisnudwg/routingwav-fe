"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartColumn, LayoutDashboard, List, LogOut, Percent, Store } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { clearStoredEmail } from "@/lib/auth"
import { useRouter } from "next/navigation"

const main = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "All Products", icon: List },
  { href: "/store-builder", label: "Store Builder", icon: Store },
]

const studio = [
  { href: "/studio/action-needed", label: "Action Needed (1)", alert: true },
  { href: "/studio/responded", label: "Responded" },
  { href: "/studio/upcoming", label: "Upcoming (4)" },
  { href: "/studio/completed", label: "Completed (7)" },
]

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 px-6 py-2.5 text-[15px] text-slate-800 hover:bg-slate-50",
        active &&
          "font-semibold text-brand before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand"
      )}
    >
      {children}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r bg-white md:flex">
      <div className="px-6 py-5 leading-none">
        {/* Placeholder: swap for your real logo */}
        <span className="font-heading text-2xl font-extrabold tracking-tight text-brand">
          ROUTING<span className="font-semibold">.com</span>
        </span>
        <span className="mt-1 block text-[11px] text-slate-600">Where Music Gets Produced</span>
      </div>

      <nav className="mt-4 flex flex-col">
        {main.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} active={pathname === href}>
            <Icon className="size-5 text-slate-500" aria-hidden />
            {label}
          </NavLink>
        ))}

        <div className="flex items-center gap-3 px-6 py-2.5 text-[15px] text-slate-800">
          <Percent className="size-5 text-slate-500" aria-hidden />
          Studio Manager
        </div>
        <div className="ml-[34px] border-l pl-4">
          {studio.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-2 py-2 text-[15px] text-slate-700 hover:text-brand"
            >
              {s.label}
              {s.alert && (
                <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-medium text-white">
                  1
                </span>
              )}
            </Link>
          ))}
        </div>

        <NavLink href="/sales-orders" active={pathname === "/sales-orders"}>
          <ChartColumn className="size-5 text-slate-500" aria-hidden />
          Sales &amp; Orders
        </NavLink>
      </nav>

      <button
        onClick={() => {
          clearStoredEmail()
          router.replace("/auth/sign-in")
        }}
        className="mt-auto flex items-center gap-3 px-6 py-4 text-[15px] text-slate-700 hover:bg-slate-50"
      >
        <LogOut className="size-5 text-slate-500" aria-hidden />
        Keluar
      </button>
    </aside>
  )
}