import Link from "next/link"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const links = [
  { href: "/talent", label: "Cari Talent" },
  { href: "/projects", label: "Projects" },
  { href: "/cara-kerja", label: "Cara Kerja" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Placeholder: swap for your real SVG logo via next/image */}
        <Link href="/" className="leading-none" aria-label="Routing.com">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-brand">
            ROUTING<span className="font-semibold">.com</span>
          </span>
          <span className="block text-[10px] text-brand-dark">
            “Where Music Gets Produced”
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-brand hover:text-rose"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
            Log in
          </Link>
          <Link
            href="/daftar"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-brand text-brand"
            )}
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  )
}