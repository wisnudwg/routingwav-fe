"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { ChartColumn, LayoutDashboard, List, LogOut, Percent, Store, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { clearStoredEmail } from "@/lib/auth"
import { useMobileNav } from "./nav-context"

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
  onClick,
  children,
}: {
  href: string
  active: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

/** The actual menu: shared by the desktop sidebar and the mobile drawer. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-6 py-5 leading-none">
        {/* Placeholder: swap for your real logo */}
        <span className="font-heading text-2xl font-extrabold tracking-tight text-brand">
          ROUTING<span className="font-semibold">.com</span>
        </span>
        <span className="mt-1 block text-[11px] text-slate-600">Where Music Gets Produced</span>
      </div>

      <nav className="mt-4 flex flex-col">
        {main.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} active={pathname === href} onClick={onNavigate}>
            <Icon className="size-5 text-slate-500" aria-hidden />
            {label}
          </NavLink>
        ))}

        <div className="flex items-center gap-3 px-6 py-2.5 text-[15px] text-slate-800">
          <Percent className="size-5 text-slate-500" aria-hidden />
          Studio Manager
        </div>
        <div className="ml-8.5 border-l pl-4">
          {studio.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              onClick={onNavigate}
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

        <NavLink href="/sales-orders" active={pathname === "/sales-orders"} onClick={onNavigate}>
          <ChartColumn className="size-5 text-slate-500" aria-hidden />
          Sales &amp; Orders
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={() => {
          clearStoredEmail()
          router.replace("/auth/sign-in")
        }}
        className="mt-auto flex items-center gap-3 px-6 py-4 text-[15px] text-slate-700 hover:bg-slate-50"
      >
        <LogOut className="size-5 text-slate-500" aria-hidden />
        Keluar
      </button>
    </div>
  )
}

function MobileSidebar() {
  const { open, setOpen } = useMobileNav()
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)

  // Move focus into the drawer when it opens
  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Panel. `inert` keeps it unfocusable while it's off-screen. */}
      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        inert={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Tutup menu"
          className="absolute right-3 top-4 grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <X className="size-5" />
        </button>
        <SidebarContent onNavigate={close} />
      </aside>
    </div>
  )
}

export function Sidebar() {
  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen border-r bg-white md:block">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <MobileSidebar />
    </>
  )
}